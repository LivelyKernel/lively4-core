import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';
import CachingFetch from './caching-fetch.js';
import CachingPromise from './caching-promise.js';

// TODO: this is use to keep SystemJS from messing up scoping
// (BaseActiveExpression would not be defined in aexpr)
const HACK = {};

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

function resolveValue(value, func) {
  if(isPromise(value)) {
    value.then(func);
  } else {
    func(value);
  }
}

export class BaseActiveExpression {

  /**
   *
   * @param func (Function) the expression to be observed
   * @param ...params (Objects) the instances bound as parameters to the expression
   */
  constructor(func, ...params) {
    this.func = func;
    this.params = params;
    this.cachingFetch = new CachingFetch();
    this.cachingPromise = new CachingPromise(this.cachingFetch);
    let currentValue = this.getCurrentValue();
    if(isPromise(currentValue)) {
      this.isAsync = true;
    }
    resolveValue(currentValue, (value) => {
      this.lastValue = value;
    })
    this.callbacks = [];
    this._isDisposed = false;
    this._shouldDisposeOnLastCallbackDetached = false;

    this._annotations = new Annotations();
  }

  /**
   * Executes the encapsulated expression with the given parameters.
   * aliases with 'now'
   * @public
   * @returns {*} the current value of the expression
   */
  getCurrentValue() {
    return this.cachingFetch.trace(() => {
      return this.cachingPromise.trace(() => {
        return this.func(...(this.params));
      });
    });
  }

  /**
   * @public
   * @param callback
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  onChange(callback) {
    this.callbacks.push(callback);

    return this;
  }
  // #TODO: should this remove all occurences of the callback?
  offChange(callback) {
    var index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
    if (this._shouldDisposeOnLastCallbackDetached && this.callbacks.length === 0) {
      this.dispose();
    }

    return this;
  }

  /**
   * Signals the active expression that a state change might have happened.
   * Mainly for implementation strategies.
   * @public
   */
  checkAndNotify() {
    let currentValue = this.getCurrentValue();
    resolveValue(currentValue, (value) => {
      if(this.lastValue == value) { return; }
      let lastValue = this.lastValue;
      this.lastValue = value;

      this.notify(value, {
        lastValue
      });
    });
  }

  notify(...args) {
    this.callbacks.forEach(callback => callback(...args));
  }

  /**
   * TODO
   * like a bind for AExpr
   * @param items
   */
  applyOn(...items) {
    throw new Error('Not yet implemented');
  }

  onBecomeTrue(callback) {
    // setup dependency
    this.onChange(bool => {
      if(bool) {
        callback();
      }
    });
    // check initial state
    resolveValue(this.getCurrentValue(), (value) => {
      if(value) { callback() }
    });

    return this;
  }

  onBecomeFalse(callback) {
    // setup dependency
    this.onChange(bool => {
      if(!bool) {
        callback();
      }
    });
    // check initial state
    resolveValue(this.getCurrentValue(), (value) => {
      if(!value) { callback() }
    });

    return this;
  }

  nowAndOnChange(callback) {
    // setup dependency
    this.onChange(callback);

    // call immediately
    // #TODO: duplicated code: we should extract this call
    resolveValue(this.getCurrentValue(), (value) => {
      this.notify(value, {});
    });

    return this;
  }

  dispose() {
    this._isDisposed = true;
  }

  isDisposed() {
    return this._isDisposed;
  }

  /**
   * #TODO: implement
   * disposeOnLastCallbackDetached
   * chainable
   * for some auto-cleanup
   * (only triggers, when a callback is detached; not initially, if there are no callbacks)
   */
  disposeOnLastCallbackDetached() {
    this._shouldDisposeOnLastCallbackDetached = true;
    return this;
  }

  meta(annotation) {
    if(annotation) {
      this._annotations.add(annotation);
      return this;
    } else {
      return this._annotations;
    }
  }
}

export function aexpr(func, ...params) {
  return new BaseActiveExpression(func, ...params);
}

export default BaseActiveExpression;
