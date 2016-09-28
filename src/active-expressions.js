
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
  
  /**
   * Create AExpr with the given arguments
   * @function AExpr#applyOn
   * @param {any} ...arguments
   * @return {ActiveExpr} The new ActiveExpr instance
   */
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
  
  /**
   * Set callback for this AExpr
   * @function AExpr#onChange
   * @param {Function} callback
   * @return {AExpr} This AExpr instance
   */
  onChange(callback) {
    this.callback = callback;
    
    if(this.applyArguments) {
      this._applyOnCollection();
    }
    
    return this;
  }
  
  /**
   * Apply the expression on all arguments provided
   * @function AExpr#applyOnAll
   * @param {any} ...arguments
   * @return {AExpr} This active expression
   */
  applyOnAll() {
    this.applyArguments = Array.prototype.slice.call(arguments);
    
    return this;
  }
  
  /**
   * Apply the expression on the given ActiveView instance
   * @function AExpr#_applyOnActiveView
   * @param {ActiveView} activeView
   */
  _applyOnActiveView(activeView) {
    activeView.onEnter(node => {
      let expression = new ActiveExpr(this.condition, [node, ...this.applyArguments], this.options);
      expression.onChange(this.callback);
       
       this.expressions.set(node, expression);
    })
    .onExit(node => {
      this.expressions.get(node).destroy();
    });
  }
  
  /**
   * Apply the expression on the collection
   * @function AExpr#_applyOnIteratable
   * @param {iterable} collection
   */
  _applyOnIteratable(collection) {
    collection.forEach(element => {
      new ActiveExpr(this.condition, [element, ...this.applyArguments], this.options)
       .onChange(this.callback);
    });
  }
  
  
  /**
   * Apply the expression on the saved arguments
   * @function AExpr#_applyOnCollection
   * @return {AExpr} This active expression
   */
  _applyOnCollection() {
    var collection = this.applyArguments.shift();
    
    if(collection instanceof ActiveView) {
      this._applyOnActiveView(collection);
    } else if(collection instanceof NodeList) {
      this._applyOnIteratable(collection);
    } else {
      //normal collection
      this._applyOnIteratable(collection);
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
  
  /**
   * Set callback for this ActiveExpr
   * @function ActiveExpr#onChange
   * @param {Function} callback
   */
  onChange(callback) {
    this.callback = callback;
  }
  
  /**
   * Test the condition and make callback if necessary
   * @function ActiveExpr#test
   */
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

  /**
   * Find variables to be observed in the condition function
   * @function ActiveExpr#detectObservables
   * @return {Object} State object with observables
   */
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
  
  /**
   * Retrieve arguments of the expression as a Map
   * @function ActiveExpr#getCalledArguments
   * @return {Object} Map of expression arguments
   */
  getCalledArguments() {
    var contextArgs = {};
    var i = 0;
    this._ast.params.forEach(function(p) {
      contextArgs[p.name] = i;
      i++;
    });
    
    return contextArgs;
  }
  
  /**
   * Wrap a proxy/hook around all variables to be observed
   * @function ActiveExpr#proxify
   */
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
  
  /**
   * Remove proxies/hooks from observed variables
   * @function ActiveExpr#unProxify
   */
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
  
  /**
   * Remove proxy/hook from specified context variable
   * @function ActiveExpr#unproxifyVariable
   * @param {Object} object that has the variable
   * @param {String} name of the variable
   * @param {String} contextVariableName, name of the base variable
   */
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
  
  /**
   * Unwraps a function to find more variables to observe
   * @function ActiveExpr#proxifyFunction
   */
  proxifyFunction(func) {
    // NOT IMPLEMENTED
    return;
  }

  /**
   * Wrap proxy/hook around specified context variable
   * @function ActiveExpr#proxifyVariable
   * @param {Object} object that has the variable
   * @param {String} variable, name of the variable
   * @param {Function} unused
   * @param {String} contextVariableName, name of the base variable
   */
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
