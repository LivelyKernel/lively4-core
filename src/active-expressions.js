
import { ActiveView, ActiveDOMView } from './active-view.js';
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
    
    this.applyArguments = null;
    this.condition = condition;
    this.expressions = new Map();
    this.options = options;
  }
  
  applyOnAll() {
    this.applyArguments = Array.prototype.slice.call(arguments);
    
    return this;
  }
  
  applyOnCollection() {
    var collection = this.applyArguments.shift();
    
    if(collection instanceof ActiveView) {
      this.applyOnActiveView(collection);
    } else if(collection instanceof NodeList) {
      this.applyOnIteratable(collection);
    } else {
      //normal collection
      this.applyOnIteratable(collection);
    }
  }
  
  applyOnActiveView(activeView) {
    activeView.onEnter(node => {
      let expression = new ActiveExpr(this.condition, [node, ...this.applyArguments], this.options);
      expression.onChange(this.callback);
       
       this.expressions.set(node, expression);
    })
    .onExit(node => {
      this.expressions.get(node).destroy();
    });
  }
  
  applyOnIteratable(collection) {
    collection.forEach(element => {
      new ActiveExpr(this.condition, [element, ...this.applyArguments], this.options)
       .onChange(this.callback);
    });
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
  
  onChange(callback) {
    this.callback = callback;
    
    if(this.applyArguments) {
      this.applyOnCollection();
    }
  }
}

class ActiveExpr {
  constructor(condition, context, options) {
    this.options = options;
    this.condition = condition;
    
    this.context = context;
    this.callback = null;

    this.lastValue = ActiveExpr.NotTested;
    this.observers = {};
    
    this.logger = new Logger(options);

    this._ast = lively.ast.parseFunction(condition);
    this._declarations = lively.ast.query.topLevelDeclsAndRefs(this._ast);
    this.observables = this.detectObservables();
    
    this.proxify();
    
    this.test();
  }
  
  onChange(callback) {
    this.callback = callback;
  }
  
  test() {
    let result = this.condition.apply(this, this.context);

    this.logger.log('Test returned:', result);

    if (this.lastValue === ActiveExpr.NotTested) {
      this.logger.log('first test!');
      this.lastValue = result;
    } else {
      if (this.lastValue !== result || this.options.alwaysTrigger) {
        this.logger.log('Firing callback as result differs');
        this.currentValue = result;
        
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
        tmpState.funcName = null;
  
        c(node.object, tmpState);
        node.object.name = tmpState.varName;
  
        c(node.property, tmpState);
        node.property.name = tmpState.varName;
        
        state.varName = node.object.name + '.' + node.property.name;
        state.objName = node.object.name;
        state.funcName = tmpState.funcName ? tmpState.funcName : node.property.name;
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
        
        if(tmpState.funcName == 'getAttribute' || tmpState.funcName == 'hasAttribute') {
          self.logger.log('Attribute access found:', node.arguments[0].value);
          state.variablesToObserve.push(tmpState.objName + '.$attributes.' + node.arguments[0].value);
        }
        state.calledFunctions.push(tmpState.varName);
        
        for(let argument of node.arguments) {
          c(argument, state);
        }
      }
    });
    
    delete state.varName;
  
    return state;
  }
  
  getCalledArguments() {
    var contextArgs = {};
    var i = 0;
    this._ast.params.forEach(function(p) {
      contextArgs[p.name] = i;
      i++;
    });
    
    return contextArgs;
  }
  
  proxify() {
    this.logger.log('Variables to observe:', this.observables.variablesToObserve);
    
    var contextArgs = this.getCalledArguments();
    
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
  
  unProxify() {
    var contextArgs = this.getCalledArguments();
  
    for(let observable of this.observables.variablesToObserve) {
      let observableParts = observable.split('.');
      let contextVariableName = observableParts.shift();
      let objectPropertyName = observableParts.join(".");
  
      let object = null;
      
      if(contextVariableName != observable) {
        var idx = contextArgs[contextVariableName];
        
        if (idx !== undefined) {
          object = this.context[idx];
      
          this.unProxifyVariable(object, objectPropertyName, contextVariableName);
        }
      }
    }
  }
  
  unProxifyVariable(object, variable, contextVariableName) {
    var nextAttribute = variable;
    var isAttribute = false;
    
    if (nextAttribute.includes('.')) {
      nextAttribute = nextAttribute.split('.')[0];
      if(nextAttribute == '$attributes') {
        this.logger.log('Attribute catched!');
        nextAttribute = variable.split('.')[1];
        variable = variable.split('.').slice(1).join('.');
        isAttribute = true;
      }
    }
    
    if (object instanceof HTMLElement) {
      
      let obs = this.observers[contextVariableName];
      if (obs && obs.attributes.has(variable)) {
        obs.attributes.delete(variable);
        obs.config.attributeFilter = [...obs.attributes];
        
        obs.mutationObserver.disconnect();
        if (obs.attributes.size > 0) {
          obs.mutationObserver.observe(object, obs.config);
        }
        
        return;
      }
    }
    
    if (variable.includes('.')) {
      let components = variable.split('.');
      this.unProxifyVariable(object[components[0]], components.splice(1).join('.'));
      return;
    }
    
    if(!object.__lively_expr_watchers)
      return;
      
    object.__lively_expr_watchers.delete(this);
    
    if(object.__lively_expr_watchers.size === 0) {
      let oldGetter = object.__lively_expr_getters[variable];
      let oldSetter = object.__lively_expr_setters[variable];
      
      if(oldGetter)
        object.__defineGetter__(variable, oldGetter);
      if(oldSetter)
        object.__defineSetter__(variable, oldSetter);
    }
  }
  
  proxifyFunction(func) {
    return;
    //NOT IMPLEMENTED
    
    let functionObject = eval(func);
  }
  
  proxifyVariable(object, variable, callback, contextVariableName) {
    this.logger.log('Proxifying variable:', object, variable, 'With context variable name:', contextVariableName);

    var nextAttribute = variable;
    var isAttribute = false;
    
    if (nextAttribute.includes('.')) {
      nextAttribute = nextAttribute.split('.')[0];
      if(nextAttribute == '$attributes') {
        this.logger.log('Attribute catched!');
        nextAttribute = variable.split('.')[1];
        variable = variable.split('.').slice(1).join('.');
        isAttribute = true;
      }
    }

    if (object instanceof HTMLElement) {
      var isHtmlAttribute = object.hasAttribute(nextAttribute) || htmlAttributes.indexOf(nextAttribute) !== -1 || isAttribute;
      if (isHtmlAttribute) {
        if (this.observers[contextVariableName] === undefined) {
          this.logger.log('Proxifying with MutationObserver');
          
          let obs = {
            attributes: new Set([nextAttribute]),
            mutationObserver: null,
            config: {
              attributes: true,
              characterData: false,
              subtree: false
            }
          };

          this.observers[contextVariableName] = obs;

          obs.config.attributeFilter = [...obs.attributes];

          var mutationObserver = new MutationObserver(
            (records, m) => this.mutationObserverCallback(records, m)
          );
          mutationObserver.observe(object, obs.config);
          
          obs.mutationObserver = mutationObserver;
         
          this.logger.log('set up', this.observers[contextVariableName]);
        } else {
          let obs = this.observers[contextVariableName];
          if (!obs.attributes.has(nextAttribute)) {
            this.logger.log('restarting observer for attribute', nextAttribute);
            obs.attributes.add(nextAttribute);
            obs.config.attributeFilter = [...obs.attributes];
            
            obs.mutationObserver.disconnect();
            obs.mutationObserver.observe(object, obs.config);
          }
        }

        // set up event listeners if necessary...
        if (nextAttribute == 'value') {
          // this.logger.log('Adding event listener');
          object.addEventListener('change', (e) => this.domEventCallback(e));
        }
        // MutationObserver is enough for HTML attributes
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

    object.__lively_expr_watchers.add(this);

    // check if object is already patched
    if (object.__lively_expr_vars.hasOwnProperty(variable)) {
      this.logger.log('variable', variable, 'already patched.');
      return;
    }
    
    let oldGetter = object.__lookupGetter__(variable) || object.__lively_expr_getters[variable];

    let oldSetter = object.__lookupSetter__(variable) || object.__lively_expr_setters[variable];

    if (oldGetter) object.__lively_expr_getters[variable] = oldGetter;
    if (oldSetter) object.__lively_expr_setters[variable] = oldSetter;

    // save current value for default getter
    object.__lively_expr_vars[variable] = object[variable];

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
  
  destroy() {
    this.unProxify();
  }
}

ActiveExpr.NotTested = Symbol('ActiveExpr::NotTested');

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

