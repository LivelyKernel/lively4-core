import { BaseActiveExpression } from 'active-expression';

self.__expressionAnalysisMode__ = false;

// #TODO: should be a stack for nested aexprs
// #TODO: maybe we should provide a global stack across all implementations
self.__currentActiveExpression__ = false;

// maps from proxy to target
self.__proxyToTargetMap__ = self.__proxyToTargetMap__ || new WeakMap();

// maps from target ids to active expressions
// #TODO: should use a MultiMap
self.__proxyIdToActiveExpressionsMap__ = self.__proxyIdToActiveExpressionsMap__ || new Map();

export function reset() {
  self.__proxyIdToActiveExpressionsMap__.clear();
  self.__proxyIdToActiveExpressionsMap__ = new Map();
}

const basicHandlerFactory = id => ({
  get: (target, property) => {
    if (self.__expressionAnalysisMode__) {
      let dependencies = self.__proxyIdToActiveExpressionsMap__.get(id);
      dependencies.add(self.__currentActiveExpression__);
      self.__proxyIdToActiveExpressionsMap__.set(id, dependencies);
    }
    if (typeof target[property] === 'function') {
      return Reflect.get(target, property).bind(target);
    }
    return Reflect.get(target, property);
  },

  set: (target, property, value) => {
    Reflect.set(target, property, value);

    if (!self.__proxyIdToActiveExpressionsMap__.has(id)){
      self.__proxyIdToActiveExpressionsMap__.set(id, new Set());
    }
    
    self.__proxyIdToActiveExpressionsMap__
      .get(id)
      .forEach(dependentActiveExpression =>
        dependentActiveExpression.notifyOfUpdate()
      );
    return true;
  },
  
  deleteProperty(target, property) {
    if (property in target) {
      delete target[property];
      if (!self.__proxyIdToActiveExpressionsMap__.has(id)){
        self.__proxyIdToActiveExpressionsMap__.set(id, {});
      }

      self.__proxyIdToActiveExpressionsMap__
        .get(id)
        .forEach(dependentActiveExpression =>
          dependentActiveExpression.notifyOfUpdate()
      );
      
      return true
    }
    return false
  }
});

const functionHandlerFactory = id => ({
  apply: (target, thisArg, argumentsList) => {
    thisArg = self.__proxyToTargetMap__.get(thisArg) || thisArg;

    if (self.__expressionAnalysisMode__) {
      return target.bind(thisArg)(...argumentsList);
    }
    const result = target.bind(thisArg)(...argumentsList);
    self.__proxyIdToActiveExpressionsMap__
      .get(id)
      .forEach(dependentActiveExpression =>
        dependentActiveExpression.notifyOfUpdate()
      );
    return result;
  },
});

export function unwrap(proxy) {
  return self.__proxyToTargetMap__.get(proxy) || proxy;
}

export function wrap(typeOfWhat, what) {
  if (self.__proxyToTargetMap__.has(what)) return what;
  const id = self.__proxyIdToActiveExpressionsMap__.size;
  const basicHandler = basicHandlerFactory(id);

  if (typeOfWhat !== 'Object'){
    const functionHandler = functionHandlerFactory(id);
    const methods = Object.getOwnPropertyNames(eval(typeOfWhat).prototype).filter(
      propName => typeof what[propName] === 'function'
    );
    methods.forEach(
      method => (what[method] = new Proxy(what[method], functionHandler))
    );
  }

  self.__proxyIdToActiveExpressionsMap__.set(id, new Set());
  const proxy = new Proxy(what, basicHandler);
  self.__proxyToTargetMap__.set(proxy, what);

  return proxy;
}

// #TODO: should be a default export
export function aexpr(func, ...arg) {
  return new ProxiesActiveExpression(func, ...arg);
}

export class ProxiesActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.notifyOfUpdate();
  }

  // #TODO: dependencies are only accumulated iver time; here, we do not remove those not needed anymore
  updateDependencies() {
    if (this.isDisabled()) { return; }

    self.__expressionAnalysisMode__ = true;
    self.__currentActiveExpression__ = this;

    this.func();

    self.__expressionAnalysisMode__ = false;
  }
  
  notifyOfUpdate() {
    self.__expressionAnalysisMode__ = true;
    self.__currentActiveExpression__ = this;

    this.func();
    this.checkAndNotify();

    self.__expressionAnalysisMode__ = false;
  }
}
