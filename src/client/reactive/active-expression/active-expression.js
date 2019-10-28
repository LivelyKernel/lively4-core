import Annotations from '../utils/annotations.js';
import { shallowEqualsArray, shallowEqualsSet, shallowEqualsMap, shallowEquals, deepEquals } from '../utils/equality.js';
import { isString, clone, cloneDeep } from 'utils';

// #TODO: this is use to keep SystemJS from messing up scoping
// (BaseActiveExpression would not be defined in aexpr)
const HACK = {};

window.__compareAExprResults__ = false;

export const AExprRegistry = {

  _aexprs: new Set(),

  /**
   * Handling membership
   */
  addAExpr(aexpr) {
    this._aexprs.add(aexpr);
  },
  removeAExpr(aexpr) {
    this._aexprs.delete(aexpr);
  },

  /**
   * Access
   */
  allAsArray() {
    return Array.from(this._aexprs);
  }
};

class DefaultMatcher {
  static compare(lastResult, newResult) {
    // array
    if(Array.isArray(lastResult) && Array.isArray(newResult)) {
      return shallowEqualsArray(lastResult, newResult);
    }
    
    // set
    if(lastResult instanceof Set && newResult instanceof Set) {
      return shallowEqualsSet(lastResult, newResult);
    }

    // map
    if(lastResult instanceof Map && newResult instanceof Map) {
      return shallowEqualsMap(lastResult, newResult);
    }

    return lastResult === newResult;
  }
  
  static store(result) {
    // array
    if(Array.isArray(result)) {
      return Array.prototype.slice.call(result);
    }
    
    // set
    if(result instanceof Set) {
      return new Set(result);
    }
    
    // map
    if(result instanceof Map) {
      return new Map(result);
    }
    
    return result;
  }
}

class IdentityMatcher {
  static compare(lastResult, newResult) {
    return lastResult === newResult;
  }
  
  static store(result) {
    return result;
  }
}

class ShallowMatcher {
  static compare(lastResult, newResult) {
    // array
    if(Array.isArray(lastResult) && Array.isArray(newResult)) {
      return shallowEqualsArray(lastResult, newResult);
    }
    
    // set
    if(lastResult instanceof Set && newResult instanceof Set) {
      return shallowEqualsSet(lastResult, newResult);
    }

    // map
    if(lastResult instanceof Map && newResult instanceof Map) {
      return shallowEqualsMap(lastResult, newResult);
    }

    return shallowEquals(lastResult, newResult) ;
  }
  
  static store(result) {
    return clone.call(result);
  }
}

class DeepMatcher {
  static compare(lastResult, newResult) {
    return deepEquals(lastResult, newResult);
  }
  
  static store(result) {
    return cloneDeep.call(result);
  }
}

const MATCHER_MAP = new Map([
  ['default', DefaultMatcher],
  ['identity', IdentityMatcher],
  ['shallow', ShallowMatcher],
  ['deep', DeepMatcher]
]);

const NO_VALUE_YET = Symbol('No value yet');

export class BaseActiveExpression {

  /**
   *
   * @param func (Function) the expression to be observed
   * @param ...params (Objects) the instances bound as parameters to the expression
   */
  constructor(func, { params = [], match, errorMode = 'silent' } = {}) {
    this.func = func;
    this.params = params;
    this.errorMode = errorMode;
    this.setupMatcher(match);
    this._initLastValue();
    this.callbacks = [];
    // this.allCallbacks = new Map();
    this._isDisposed = false;
    this._shouldDisposeOnLastCallbackDetached = false;

    this._annotations = new Annotations();

    if(new.target === BaseActiveExpression) {
      this.addToRegistry();
    }
  }
  
//   addEventListener(type, callback) {
    
//   }
  
//   removeEventListener(type, callback) {
    
//   }
  
//   dispatchEvent() {
    
//   }
  
  _initLastValue() {
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError) {
      this.storeResult(value);
    } else {
      this.lastValue = NO_VALUE_YET;
    }
  }

  addToRegistry() {
    AExprRegistry.addAExpr(this);
  }
  
  hasCallbacks() {
    return this.callbacks.length !== 0;
  }

  /**
   * Executes the encapsulated expression with the given parameters.
   * aliases with 'now' (#TODO: caution, consider ambigous terminology: 'now' as in 'give me the value' or as in 'dataflow'?)
   * @public
   * @returns {*} the current value of the expression
   */
  getCurrentValue() {
    return this.func(...this.params);
  }

  /**
   * Safely executes the encapsulated expression with the given parameters.
   * @public
   * @returns {{ value: *, isError: Boolean}} the current value of the expression, or the thrown error if any
   */
  evaluateToCurrentValue() {
    try {
      const result = this.getCurrentValue();
      return { value: result, isError: false };
    } catch (e) {
      return { value: e, isError: true };
    }
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
  /**
   * @public
   * @param callback
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  // #TODO: should this remove all occurences of the callback?
  offChange(callback) {
    const index = this.callbacks.indexOf(callback);
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
    const { value, isError } = this.evaluateToCurrentValue();
    if(isError || this.compareResults(this.lastValue, value)) { return; }
    const lastValue = this.lastValue;
    this.storeResult(value);

    this.notify(value, {
      lastValue,
      expr: this.func ,
      aexpr: this
    });
  }
  
  setupMatcher(matchConfig) {
    // configure using existing matcher
    if(matchConfig && isString.call(matchConfig)) {
      if(!MATCHER_MAP.has(matchConfig)) {
        throw new Error(`No matcher of type '${matchConfig}' registered.`)
      }
      this.matcher = MATCHER_MAP.get(matchConfig);
      return;
    }
    
    // configure using a custom matcher
    if(typeof matchConfig === 'object') {
      if(matchConfig.hasOwnProperty('compare') && matchConfig.hasOwnProperty('store')) {
        this.matcher = matchConfig;
        return;
      }
      throw new Error(`Given matcher object does not provide 'compare' and 'store' methods.`)
    }
    
    // use smart default matcher
    this.matcher = DefaultMatcher;
  }

  // #TODO: extract into CompareAndStore classes
  compareResults(lastResult, newResult) {
    try {
      window.__compareAExprResults__ = true;
      return this.matcher.compare(lastResult, newResult);
    } finally {
      window.__compareAExprResults__ = false;
    }
  }
  
  storeResult(result) {
    try {
      window.__compareAExprResults__ = true;
      this.lastValue = this.matcher.store(result);
    } finally {
      window.__compareAExprResults__ = false;
    }
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
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError && value) { callback(); }

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
    const { value, isError } = this.evaluateToCurrentValue();
    if(!isError && !value) { callback(); }

    return this;
  }

  dataflow(callback) {
    // setup dependency
    this.onChange(callback);

    // call immediately
    // #TODO: duplicated code: we should extract this call
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError) {
      callback(value, {});
    }

    return this;
  }

  dispose() {
    this._isDisposed = true;
    AExprRegistry.removeAExpr(this);
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

  /**
   * Reflection information
   */

  name(...args) {
    if(args.length > 0) {
      this._annotations.add({ name: args[0] });
      return this;
    } else {
      return this._annotations.get('name');
    }
  }

  meta(annotation) {
    if(annotation) {
      this._annotations.add(annotation);
      return this;
    } else {
      return this._annotations;
    }
  }

  supportsDependencies() {
    return false;
  }
}

export function aexpr(func, ...args) {
  return new BaseActiveExpression(func, ...args);
}

export default BaseActiveExpression;
