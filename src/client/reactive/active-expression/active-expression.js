import Annotations from '../utils/annotations.js';
import EventTarget from '../utils/event-target.js';
import { shallowEqualsArray, shallowEqualsSet, shallowEqualsMap, shallowEquals, deepEquals } from '../utils/equality.js';
import { isString, clone, cloneDeep } from 'utils';

import sourcemap from 'src/external/source-map.min.js';

// #TODO: this is use to keep SystemJS from messing up scoping
// (BaseActiveExpression would not be defined in aexpr)
const HACK = {};

window.__compareAExprResults__ = false;

self.__aexprRegistry_eventTarget__ = self.__aexprRegistry_eventTarget__ || new EventTarget();
self.__aexprRegistry_aexprs__ = self.__aexprRegistry_aexprs__ || new Set();
self.__aexprRegistry_idCounters__ = self.__aexprRegistry_idCounters__ || new Map();
self.__aexprRegistry_callbackStack__ = self.__aexprRegistry_callbackStack__ || [];
self.__aexprRegistry_evaluationStack__ = self.__aexprRegistry_evaluationStack__ || [];

/*MD ## Registry of Active Expressions MD*/
export const AExprRegistry = {

  /**
   * Handling membership
   */
  addAExpr(aexpr) {
    self.__aexprRegistry_aexprs__.add(aexpr);
    this.buildIdFor(aexpr);
    self.__aexprRegistry_eventTarget__.dispatchEvent('add', aexpr);
  },
  removeAExpr(aexpr) {
    const deleted = self.__aexprRegistry_aexprs__.delete(aexpr);
    if (deleted) {
      self.__aexprRegistry_eventTarget__.dispatchEvent('remove', aexpr);
    }
  },
  updateAExpr(aexpr) {
    self.__aexprRegistry_eventTarget__.dispatchEvent('update', aexpr);
  },

  on(type, callback) {
    return self.__aexprRegistry_eventTarget__.addEventListener(type, callback);
  },
  off(type, callback) {
    return self.__aexprRegistry_eventTarget__.removeEventListener(type, callback);
  },
  
  addToCallbackStack(ae, callback) {
    self.__aexprRegistry_callbackStack__.push({ae, callback});
  },

  popCallbackStack() {
    self.__aexprRegistry_callbackStack__.pop();  
  },  
  
  callbackStack() {
    return self.__aexprRegistry_callbackStack__;
  },
  
  
  addToEvaluationStack(ae) {
    self.__aexprRegistry_evaluationStack__.push(ae);
  },  

  popEvaluationStack() {
    self.__aexprRegistry_evaluationStack__.pop();  
  },
  
  evaluationStack() {
    return self.__aexprRegistry_evaluationStack__;
  },
  
  buildIdFor(ae) {
    let locationId;
    if (ae.meta().has('location')) {
      let location = ae.meta().get('location');
      let file = location.file.replace(lively4url + '/', '');
      locationId = file + '@' + location.start.line + ':' + location.start.column;
    } else {
      locationId = 'unknown_location';
    }
    self.__aexprRegistry_idCounters__.set(locationId, self.__aexprRegistry_idCounters__.get(locationId) + 1 || 0);
    ae.meta({ id: locationId + '#' + self.__aexprRegistry_idCounters__.get(locationId) });
  },

  /**
   * For Development purpose if the registry gets into inconsistent state
   */
  purge() {
    for (let each of self.__aexprRegistry_aexprs__) {
      each._isDisposed = true;
    }
    self.__aexprRegistry_eventTarget__.callbacks.clear();
    self.__aexprRegistry_aexprs__.clear();
    self.__aexprRegistry_idCounters__.clear();
  },

  /**
   * Access
   */
  allAsArray() {
    return Array.from(self.__aexprRegistry_aexprs__);
  },

  addEventListener(reference, callback) {
    if(!this.listeners) this.listeners = []
    this.listeners.push({ reference, callback });
  },

  removeEventListener(reference) {
    if(!this.listeners) return;
    this.listeners = this.listeners.filter(listener => listener.reference !== reference);
  },

  eventListeners() {
    if(!this.listeners) return [];
    return this.listeners;
  }
};

/*MD # Equality Matchers MD*/
class DefaultMatcher {
  static compare(lastResult, newResult) {
    // array
    if (Array.isArray(lastResult) && Array.isArray(newResult)) {
      return shallowEqualsArray(lastResult, newResult);
    }

    // set
    if (lastResult instanceof Set && newResult instanceof Set) {
      return shallowEqualsSet(lastResult, newResult);
    }

    // map
    if (lastResult instanceof Map && newResult instanceof Map) {
      return shallowEqualsMap(lastResult, newResult);
    }

    return lastResult === newResult;
  }

  static store(result) {
    // array
    if (Array.isArray(result)) {
      return Array.prototype.slice.call(result);
    }

    // set
    if (result instanceof Set) {
      return new Set(result);
    }

    // map
    if (result instanceof Map) {
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
    if (Array.isArray(lastResult) && Array.isArray(newResult)) {
      return shallowEqualsArray(lastResult, newResult);
    }

    // set
    if (lastResult instanceof Set && newResult instanceof Set) {
      return shallowEqualsSet(lastResult, newResult);
    }

    // map
    if (lastResult instanceof Map && newResult instanceof Map) {
      return shallowEqualsMap(lastResult, newResult);
    }

    return shallowEquals(lastResult, newResult);
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

const MATCHER_MAP = new Map([['default', DefaultMatcher], ['identity', IdentityMatcher], ['shallow', ShallowMatcher], ['deep', DeepMatcher]]);

const NO_VALUE_YET = Symbol('No value yet');

/*MD # ACTIVE EXPRESSIONS MD*/
export class BaseActiveExpression {

  /**
   *
   * @param func (Function) the expression to be observed
   * #TODO: incorrect parameter list, how to specify spread arguments in jsdoc?
   * @param ...params (Objects) the instances bound as parameters to the expression
   */
  constructor(func, {
    params = [], match,
    errorMode = 'silent',
    disabled = false,
    location,
    sourceCode
  } = {}) {
    this._eventTarget = new EventTarget(), this.func = func;
    this.params = params;
    this.errorMode = errorMode;
    this._isEnabled = !disabled;
    this.setupMatcher(match);
    this.callbacks = [];

    this._isDisposed = false;
    this._shouldDisposeOnLastCallbackDetached = false;

    this._annotations = new Annotations();
    if (location) {
      this.meta({ location });
    }
    if (sourceCode) {
      this.meta({ sourceCode });
    }

    this.initializeEvents();

    this.addToRegistry();
    this._initLastValue();
    this.logEvent('created', {ae: this, stack: lively.stack(), value: this.lastValue});
  }

  _initLastValue() {
    this.lastValue = NO_VALUE_YET;
    this.updateLastValue();
  }

  updateLastValue() {
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError) {
      this.storeResult(value);
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
   * @private
   * @returns {*} the current value of the expression
   */
  getCurrentValue() {
    AExprRegistry.addToEvaluationStack(this);
    let returnValue;
    try {
       returnValue = this.func(...this.params);
    } finally {
      AExprRegistry.popEvaluationStack();
    }
    return returnValue;
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
      this.logEvent('evaluation failed', e);
      return { value: e, isError: true };
    }
  }

  /*MD ## EventTarget Interface MD*/
  on(type, callback) {
    this._eventTarget.addEventListener(type, callback);
    return this;
  }

  off(type, callback) {
    this._eventTarget.removeEventListener(type, callback);
    return this;
  }

  emit(type, ...params) {
    this._eventTarget.dispatchEvent(type, ...params);
  }

  getEventListeners(type) {
    return this._eventTarget.getEventListeners(type);
  }

  /*MD ## --- MD*/
  /**
   * @public
   * @param callback
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  onChange(callback, originalSource) {
    this.callbacks.push(callback);
    this.logEvent('callback added', {callback, originalSource});
    AExprRegistry.updateAExpr(this);
    return this;
  }
  /**
   * @public
   * @param callback
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  // #TODO: should this remove all occurences of the callback?
  offChange(callback, originalSource) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
      this.logEvent('callback removed', {callback, originalSource});
      AExprRegistry.updateAExpr(this);
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
  checkAndNotify(location, dependency, hook) {
    if (!this._isEnabled) {
      return;
    }

    const { value, isError } = this.evaluateToCurrentValue();
    if (isError || this.compareResults(this.lastValue, value)) {
      return;
    }
    const lastValue = this.lastValue;
    this.storeResult(value);
    const callbackStackTop = AExprRegistry.callbackStack()[AExprRegistry.callbackStack().length - 1];
    const timestamp = new Date();
    if(dependency) {
      if(dependency.context instanceof HTMLElement) {
        if(!dependency.context.changedAEs) {
          dependency.context.changedAEs = new Set();
        }
        dependency.context.changedAEs.add(this);
      }
    }
    Promise.resolve(location)
      .then(trigger => 
            this.logEvent('changed value', { 
      value, 
      trigger, 
      dependency,
      hook,
      lastValue,
      parentAE: callbackStackTop && callbackStackTop.ae,
      callback: callbackStackTop && callbackStackTop.callback}, 
                          timestamp));

    this.notify(value, {
      lastValue,
      expr: this.func,
      aexpr: this
    });
  }

  async findCallee() {
    const stack = lively.stack();
    const frames = stack.frames;

    for (let frame of frames) {
      if (!frame.file.includes("active-expression") && frame.file !== "<anonymous>") {
        return await frame.getSourceLocBabelStyle();
      }
    }
    return undefined;
  }

  async extractSourceMap(code) {
    var m = code.match(/\/\/# sourceMappingURL=(.*)(\n|$)/);
    if (!m) return false;
    var sourceMappingURL = m[1];
    return (await fetch(sourceMappingURL)).json();
  }

  extractSourceURL(code) {
    var m = code.match(/\/\/# sourceURL=(.*)(\n|$)/);
    if (!m) return false;
    return m[1];
  }

  setupMatcher(matchConfig) {
    // configure using existing matcher
    if (matchConfig && isString.call(matchConfig)) {
      if (!MATCHER_MAP.has(matchConfig)) {
        throw new Error(`No matcher of type '${matchConfig}' registered.`);
      }
      this.matcher = MATCHER_MAP.get(matchConfig);
      return;
    }

    // configure using a custom matcher
    if (typeof matchConfig === 'object') {
      if (matchConfig.hasOwnProperty('compare') && matchConfig.hasOwnProperty('store')) {
        this.matcher = matchConfig;
        return;
      }
      throw new Error(`Given matcher object does not provide 'compare' and 'store' methods.`);
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
    this.callbacks.forEach(callback => {
      AExprRegistry.addToCallbackStack(this, callback);
      callback(...args)
      AExprRegistry.popCallbackStack();
    });
    AExprRegistry.updateAExpr(this);
  }

  updateDependencies() {}

  /**
   * Change the expression to be monitored.
   * @public
   * @param func (Function) the new function to be monitored.
   * @param options ({ checkImmediately = true }) whether `notify` will be executed if the current value of the expression is different from the last on, defaults to true.
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  setExpression(func, { checkImmediately = true } = {}) {
    if (!(func instanceof Function)) {
      throw new TypeError('no function given to .setExpression');
    }

    this.func = func;
    this.updateDependencies();
    if (checkImmediately) {
      this.checkAndNotify();
    }

    return this;
  }

  /*MD ## Convenience Methods MD*/
  onBecomeTrue(callback) {
    // setup dependency
    this.onChange(bool => {
      if (bool) {
        callback();
      }
    });

    // check initial state
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError && value) {
      this.storeResult(value);
      callback();
    }

    return this;
  }

  onBecomeFalse(callback) {
    // setup dependency
    this.onChange(bool => {
      if (!bool) {
        callback();
      }
    });

    // check initial state
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError && !value) {
      this.storeResult(value);
      callback();
    }

    return this;
  }

  dataflow(callback, orignalSource) {
    // setup dependency
    this.onChange(callback, orignalSource);

    // call immediately
    // #TODO: duplicated code: we should extract this call
    const { value, isError } = this.evaluateToCurrentValue();
    if (!isError) {
      this.storeResult(value);
      callback(value, {});
    }

    return this;
  }

  /*MD ## Disposing MD*/
  dispose() {
    if (!this._isDisposed) {
      this._isDisposed = true;
      this.removeAllCallbacks();
      AExprRegistry.removeAExpr(this);
      this.emit('dispose');
      this.logEvent('disposed');
    }
  }

  removeAllCallbacks() {
    for(const callback of this.callbacks) {
      this.offChange(callback);
    }
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

  gotDisposed() {
    if (this._disposedPromise) {
      return this._disposedPromise;
    }

    return this._disposedPromise = new Promise(resolve => {
      if (this.isDisposed()) {
        resolve();
      } else {
        this.on('dispose', resolve);
      }
    });
  }

  /*MD ## Scoping: Enable, Disable 
  
    In contrast to scoping with respect to applying a single expression to multiple subjects
  MD*/

  enable({ check = true } = {}) {
    if (!this._isEnabled) {
      this._isEnabled = true;
      this.emit('enable');

      this.updateDependencies();
      if (check) {
        this.checkAndNotify();
      } else {
        this.updateLastValue();
      }
    }
  }

  disable() {
    if (this._isEnabled) {
      this._isEnabled = false;
      this.emit('disable');
    }
  }

  isEnabled() {
    return this._isEnabled;
  }

  isDisabled() {
    return !this._isEnabled;
  }

  /*MD ## Reflection Information MD*/
  meta(annotation) {
    if (annotation) {
      this._annotations.add(annotation);
      return this;
    } else {
      return this._annotations;
    }
  }

  supportsDependencies() {
    return false;
  }

  initializeEvents() {
    this.meta({ events: new Array() });
  }

  logEvent(type, value, overrideTimestamp = undefined) {
    if (this.isMeta()) return;
    //if(!this.meta().has('events'))this.meta({events : new Array()});
    let events = this.meta().get('events');
    const timestamp = overrideTimestamp || new Date();
    const event = { timestamp , type, value, id: this.meta().get('id') + "-" + events.length };
    AExprRegistry.eventListeners().forEach(listener => listener.callback(this, event));
    events.push(event);
    if (events.length > 5000) events.shift();
  }
  
  // Migrates the events from another event to this one. 
  // It is advisable to only call this, when we know that this AE replaces "other" and when other was disposed before this AE was created..
  migrateEvents(other) {
    let otherEvents = other.meta().get('events');
    let events = this.meta().get('events');
    
    events.unshift(...otherEvents);
  }

  isMeta(value) {
    if (value !== undefined) this.meta({ isMeta: value });else return this.meta().has('isMeta') && this.meta().get('isMeta');
  }

  /*MD ## Iterators and Utility Methods MD*/

  // #Discussion: should this reject, if the aexpr gets disposed?
  nextValue() {
    return new Promise(resolve => {
      const callback = value => {
        this.offChange(callback);
        resolve(value);
      };
      this.onChange(callback);
    });
  }

  values() {
    const gotDisposed = this.gotDisposed();

    const valueQueue = [];

    let gotNewValue;
    let waitForValue;
    function resetWaitForValue() {
      waitForValue = new Promise(resolve => {
        gotNewValue = resolve;
      });
    }
    resetWaitForValue();

    this.onChange(v => {
      valueQueue.push(v);
      const temp = gotNewValue;
      resetWaitForValue();
      temp();
    });

    return {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (valueQueue.length > 0) {
              return {
                value: valueQueue.shift(),
                done: false
              };
            } else {
              return Promise.race([waitForValue.then(() => this.next()), gotDisposed.then(() => ({ done: true }))]);
            }
          }
        };
      }
    };
  }
}

export function aexpr(func, ...args) {
  return new BaseActiveExpression(func, ...args);
}

export default BaseActiveExpression;

// #TODO: migrate aexpr object to new/reloaded classes