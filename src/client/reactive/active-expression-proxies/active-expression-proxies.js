import { BaseActiveExpression } from 'active-expression';

window.__expressionAnalysisMode__ = false;

window.__currentActiveExpression__ = false;

export function reset() {
  // maps from target ids to active expressions
  window.__proxyIdToActiveExpressionsMap__ = new Map();

  // maps from proxy to target
  window.__proxyToTargetMap__ = new WeakMap();
}

reset();

const basicHandlerFactory = id => ({
  get: (target, property) => {
    if (window.__expressionAnalysisMode__) {
      let dependencies = window.__proxyIdToActiveExpressionsMap__.get(id);

      dependencies.add(window.__currentActiveExpression__);
      window.__proxyIdToActiveExpressionsMap__.set(id, dependencies);
    }
    if (typeof target[property] === 'function') {
      return Reflect.get(target, property).bind(target);
    }
    return Reflect.get(target, property);
  },

  set: (target, property, value) => {
    Reflect.set(target, property, value);

    window.__proxyIdToActiveExpressionsMap__
      .get(id)
      .forEach(dependentActiveExpression =>
        dependentActiveExpression.notifyOfUpdate()
      );
    return true;
  },
});

const functionHandlerFactory = id => ({
  apply: (target, thisArg, argumentsList) => {
    thisArg = window.__proxyToTargetMap__.get(thisArg) || thisArg;

    if (window.__expressionAnalysisMode__) {
      return target.bind(thisArg)(...argumentsList);
    }
    const result = target.bind(thisArg)(...argumentsList);
    window.__proxyIdToActiveExpressionsMap__
      .get(id)
      .forEach(dependentActiveExpression =>
        dependentActiveExpression.notifyOfUpdate()
      );
    return result;
  },
});

export function unwrap(proxy) {
  return window.__proxyToTargetMap__.get(proxy) || proxy;
}

export function wrap(typeOfWhat, what) {
  if (window.__proxyToTargetMap__.has(what)) return what;
  const id = window.__proxyIdToActiveExpressionsMap__.size;
  const basicHandler = basicHandlerFactory(id);

  if (typeOfWhat !== 'Object') {
    
    const prototypes = {
      "Set": Set.prototype,
      "Map": Map.prototype,
      "Array": Array.prototype
    }
    
    const functionHandler = functionHandlerFactory(id);
    const methods = Object.getOwnPropertyNames(prototypes[typeOfWhat]).filter(
      propName => typeof what[propName] === 'function'
    );
    methods.forEach(
      method => (what[method] = new Proxy(what[method], functionHandler))
    );
  }

  window.__proxyIdToActiveExpressionsMap__.set(id, new Set());
  const proxy = new Proxy(what, basicHandler);
  window.__proxyToTargetMap__.set(proxy, what);

  return proxy;
}


export function aexpr(func, ...arg) {
  return new ProxiesActiveExpression(func, ...arg);
}

export class ProxiesActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.notifyOfUpdate();
  }

  notifyOfUpdate() {
    window.__expressionAnalysisMode__ = true;
    window.__currentActiveExpression__ = this;

    this.func();
    this.checkAndNotify();

    window.__expressionAnalysisMode__ = false;
  }
}
