
import { ActiveDOMView } from './active-view.js';
import { Logger } from './logger.js';

function setDefaultOptions(options) {
  if (options.alwaysTrigger === undefined) {
    options.alwaysTrigger = false;
  }
  
  if (options.strict === undefined) {
    options.strict = true;
  }
  
  if (options.debug === undefined) {
    options.debug = false;
  }
  
  return options;
}

var htmlAttributes = [
  // Node:
  'innerText', 'outerText', 'textContent',
  // Element:
  'accessKey', 'attributes', 'childElementCount', 'children', 'classList', 'className', 'clientHeight', 'clientLeft', 'clientTop', 'clientWidth', 'currentStyle', 'firstElementChild', 'id', 'innerHTML', 'lastElementChild', 'localName', 'name', 'namespaceURI', 'nextElementSibling', 'prefix', 'previousElementSibling', 'runtimeStyle', 'scrollHeight', 'scrollLeft', 'scrollLeftMax', 'scrollTop', 'scrollTopMax', 'scrollWidth', 'tabStop', 'tagName',
  // HtmlElement:
  'contentEditable', 'dataset', 'dir', 'isContentEditable', 'lang', 'offsetHeight', 'offsetLeft', 'offsetParent', 'offsetTop', 'offsetWidth', 'outerText', 'style', 'tabIndex', 'title',
  // InputElement
  'value'
];

export class AExpr {
  constructor(condition, options) {
    options = setDefaultOptions(options || {});
    this.condition = condition;
    this.options = options;
  }

  applyOn(/* arguments */) {
    if (arguments.length != this.condition.length) {
      console.warn('AExpr: mismatching argument count: ', 
                    arguments.length, this.condition.length);
    }
    
    // TODO: Check if all are null?
    if (this.options.strict && arguments[0] === null) {
      // TODO: warning instead of Exception ?
      // option to allow null?
      throw 'ActiveExpr.applyOn: null arguments received!';
    }
    
    var context = Array.prototype.slice.call(arguments);
    return new ActiveExpr(this.condition, context, this.options);
  }
}

class ActiveExpr {
  constructor(condition, context, options) {
    this.options = options;
    this.condition = condition;
    
    this.context = context;
    this.callback = null; // callback.bind(this);

    this.lastValue = undefined;
    this.observers = {};
    
    this.logger = new Logger(options);

    this._ast = lively.ast.parseFunction(condition);
    this._declarations = lively.ast.query.topLevelDeclsAndRefs(this._ast);
    this.observables = this.detectObservables();

    // this.transformExpression();
    this.proxify();
    
    this.test();
  }
  
  onChange(callback) {
    this.callback = callback;
  }
  
  test() {
    let result = this.condition.apply(this, this.context);

    this.logger.log('Test returned:', result);

    if (this.lastValue === undefined) {
      this.lastValue = result;
    } else {
      if (this.lastValue !== result || this.options.alwaysTrigger) {
        if (this.callback) {
          this.callback.apply(this, this.context);
          // re-evaluate
          result = this.condition.apply(this, this.context);
        }
      }
      this.lastValue = result;
    }
  }
  
  transformExpression() {
    let off = 0;
    
    let src = this.originalExpr.toString();
    for (let i = this._declarations.refs.length - 1; i >= 0; i--) {
      let node = this._declarations.refs[i];
      
      if (!node.name.includes('.') && window[node.name] !== undefined) {
        // dont replace global objects like parseInt
        continue;
      }
      let left = src.substring(0, node.start - 1);
      let right = src.substring(node.start - 1);
      src = left + '__context.' + right;
      off += 10;
    }

    let body = src.substring(this._ast.body.start - 1, this._ast.body.end + off);
    this.expr = eval('(function(__context)' + body + ')');
    
    this.logger.log('Transformed body:', body);
    this.logger.log('Transformed expr:', this.expr);
  }
  
  detectObservables() {
    var self = this;
    var state = {
      localVariables: [],
      calledFunctions: [],
      variablesToObserve: []
    };

    lively.ast.acorn.walk.recursive(this._ast, state, {
      'VariableDeclarator': function VariableDeclarator(node, state, c) {
        var varName = node.id.name;
        state.localVariables.push(varName);
  
        c(node.init, state);
      },
      'MemberExpression': function MemberExpression(node, state, c) {
        var tmpState = jQuery.extend(true, {}, state);
  
        c(node.object, tmpState);
        node.object.name = tmpState.varName;
  
        c(node.property, tmpState);
        node.property.name = tmpState.varName;
        
        state.varName = node.object.name + '.' + node.property.name;
        state.variablesToObserve.push(state.varName);
      },
      'ThisExpression': function ThisExpression(node, state, c) {
        //makes no sense all alone, so only used to get 'varName'
  
        state.varName = 'this';
      },
      'Identifier': function Identifier(node, state, c) {
        if (state.localVariables.indexOf(node.name) === -1) {
          state.variablesToObserve.push(node.name);
        }
  
        state.varName = node.name;
      },
      'CallExpression': function CallExpression(node, state, c) {
        var tmpState = jQuery.extend(true, {}, state);
        
        c(node.callee, tmpState);
        //TODO: ignore inline functions
        self.logger.log(node, tmpState);
        state.calledFunctions.push(tmpState.varName);
        
        for(let argument of node.arguments) {
          c(argument, state);
        }
      }
    });
    
    delete state.varName;
  
    return state;
  }
  
  proxify() {
    this.logger.log('Variables to observe:', this.observables.variablesToObserve);
    
    var contextArgs = {};
    var i = 0;
    this._ast.params.forEach(function(p) {
      contextArgs[p.name] = i;
      i++;
    });
    
    for(let observable of this.observables.variablesToObserve) {
      let observableParts = observable.split('.');
      let contextVariableName = observableParts.shift();
      let objectPropertyName = observableParts.join(".");
  
      let object = null;
      
      if(contextVariableName != observable) {
        var idx = contextArgs[contextVariableName];
        
        if (idx !== undefined) {
          object = this.context[idx];
          this.proxifyVariable(object, objectPropertyName, this.callback, contextVariableName);
        }
      } else {
        //has no dot in its name, so is probably a global var?
      }
      
    }
    
    for(let func of this.observables.calledFunctions) {
      this.proxifyFunction(func);
    }
  }
  
  proxifyFunction(func) {
    return;
    //NOT IMPLEMENTED
    
    let functionObject = eval(func);
  }
  
  proxifyVariable(object, variable, contextVariableName) {
    this.logger.log('Proxifying variable:', object, variable, 'With context variable name:', contextVariableName);

    if (object instanceof HTMLElement) {
      if (this.observers[contextVariableName] === undefined) {
        this.logger.log('Proxifying with MutationObserver');
        this.observers[contextVariableName] = {
          attributes: new Set(),
          mutationObserver: null,
          config: {
            attributes: true,
            characterData: false,
            subtree: false
          }
        }
        
        var mutationObserver = new MutationObserver(
          (records, m) => this.mutationObserverCallback(records, m)
        );
        mutationObserver.observe(object, this.observers[contextVariableName].config);
        
        this.observers[contextVariableName].mutationObserver = mutationObserver;
       
        // this.logger.log('set up', this.observers[contextVariableName]);
        
        // set up event listeners if necessary...
        if (variable == 'value') {
          // this.logger.log('Adding event listener');
          object.addEventListener('change', (e) => this.domEventCallback(e));
        }
      }

      var nextAttribute = variable;
      if (nextAttribute.includes('.')) {
        nextAttribute = nextAttribute.split('.')[0];
      }

      // stop recursion of it's a standard HTML attribute
      if (object.hasAttribute(nextAttribute) ||  htmlAttributes.indexOf(variable) !== -1) {
        // HTMLElements get special treatment
        this.logger.log('Returning, because MutationObserver is enough');
        return;
      }
    }
    
    if (variable.includes('.')) {
      let components = variable.split('.');
      this.proxifyVariable(object[components[0]], components.splice(1).join('.'));
      return;
    }
    
    this.logger.log('Patching variable:', variable, ' on ', object);
    
    ['__lively_expr_getters',
     '__lively_expr_setters',
     '__lively_expr_vars'
    ].forEach((k) => {
      if (object[k] === undefined) {
        object[k] = {};
      }
    })
    
    if (object.__lively_expr_watchers === undefined) {
      object.__lively_expr_watchers = new Set();
    }

    // TODO: handle multiple expressions on same object
    
    let oldGetter = object.__lookupGetter__(variable) || object.__lively_expr_getters[variable];

    let oldSetter = object.__lookupSetter__(variable) || object.__lively_expr_setters[variable];

    if (oldGetter) object.__lively_expr_getters[variable] = oldGetter;
    if (oldSetter) object.__lively_expr_setters[variable] = oldSetter;

    // save current value for default getter
    object.__lively_expr_vars[variable] = object[variable];
    
    object.__lively_expr_watchers.add(this);
    
    // this.logger.log('old getter:', oldGetter);
    // this.logger.log('old setter:', oldSetter);

    var newGetter = function() {
      if (this.__lively_expr_getters[variable]) {
        return this.__lively_expr_getters[variable].call(this);
      }
      return this.__lively_expr_vars[variable];
    };
    
    var newSetter = function(newValue) {
      if (this.__lively_expr_setters[variable]) {
        this.__lively_expr_setters[variable].call(this, newValue);
      } else {
        this.__lively_expr_vars[variable] = newValue;
      }

      // alert watchers
      this.__lively_expr_watchers.forEach((w) => {
        w.test();
      });
    };
    
    object.__defineGetter__(variable, newGetter);
    object.__defineSetter__(variable, newSetter);
  }
  
  mutationObserverCallback(records, mutationObserver) {
    this.test();
  }
  
  domEventCallback(e) {
    this.test();
  }
}

  // let outOfScreen = AExpr(
  //   function condition(w) { 
  //     return parseInt(w.style.top) < 0 || parseInt(w.style.left) < 0
  //   }
  // );
  
  // outOfScreen
  //   .applyOn(document.querySelector('lively-window'))
  //   .onChange(function(node) {
  //     if (parseInt(node.style.top) < 0) {
  //       node.style.top = 0;
  //     }
  //     if (parseInt(node.style.left) < 0) {
  //       node.style.left = 0;
  //     }
  //   });

