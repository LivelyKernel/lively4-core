import { BaseActiveExpression } from 'active-expression';

window.__expressionAnalysisMode__ = false;

window.__currentActiveExpression__ = false;

// maps from target ids to active expressions
window.__activeExpressionsMap__ = new Map();

const basicHandlerFactory = id =>
  ({
    get: (target, property) => {
      if (window.__expressionAnalysisMode__) {
        let dependencies = window.__activeExpressionsMap__.get(id);
        
        dependencies.add(window.__currentActiveExpression__);
        window.__activeExpressionsMap__.set(id, dependencies);
      }
      return Reflect.get(target, property);
    },

    set: (target, property, value) => {
      Reflect.set(target, property, value);

      window.__activeExpressionsMap__.get(id).forEach(
        (dependentActiveExpression) => dependentActiveExpression.notifyOfUpdate()
      )
      return true;
    }
  });


export function wrapObject(what) {
  const id = window.__activeExpressionsMap__.size;
  const basicHandler = basicHandlerFactory(id);

  window.__activeExpressionsMap__.set(id, new Set());
  const proxy = new Proxy(what, basicHandler);
  return proxy;
}

export function wrapArray(what) {
  
  const id = window.__activeExpressionsMap__.size;
  const basicHandler = basicHandlerFactory(id);

  const functionHandler = {
    apply: (target, thisArg, argumentsList) => {
      target.bind(thisArg)(...argumentsList);
      window.__activeExpressionsMap__.get(id).forEach(
        (dependentActiveExpression) => dependentActiveExpression.notifyOfUpdate()
      )
    }
  }
  


  const arrayMethods = Object.getOwnPropertyNames(Array.prototype).filter(propName => typeof what[propName] === 'function');
  arrayMethods.forEach(arrayMethod => what[arrayMethod] = new Proxy(what[arrayMethod], functionHandler))
  
  window.__activeExpressionsMap__.set(id, new Set());
  const proxy = new Proxy(what, basicHandler);
  return proxy;
}


export function wrapSet(what) {
  
  const id = window.__activeExpressionsMap__.size;
  const basicHandler = basicHandlerFactory(id);

  const functionHandler = {
    apply: (target, thisArg, argumentsList) => {
      target.bind(thisArg)(...argumentsList);
      window.__activeExpressionsMap__.get(id).forEach(
        (dependentActiveExpression) => dependentActiveExpression.notifyOfUpdate()
      )
    }
  }
  

  const setMethods = Object.getOwnPropertyNames(Set.prototype).filter(propName => typeof what[propName] === 'function');
  setMethods.forEach(setMethod => what[setMethod] = new Proxy(what[setMethod], functionHandler))
  
  window.__activeExpressionsMap__.set(id, new Set());
  const proxy = new Proxy(what, basicHandler);
  return proxy;
}


export function aexpr(func, ...arg) {
  return new ProxiesActiveExpression(func, ...arg);
}

export class ProxiesActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.updateDependencies();
  }

  notifyOfUpdate() {
    this.updateDependencies();
    this.checkAndNotify();
  }

  updateDependencies() {
    window.__expressionAnalysisMode__ = true;

    window.__currentActiveExpression__ = this;

    this.func();
  window.__expressionAnalysisMode__ = false;
  }
}

