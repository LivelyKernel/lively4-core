// TODO: this is use to keep SystemJS from messing up scoping
// (BaseActiveExpression would not be defined in aexpr)
const HACK = {};

export class BaseActiveExpression {

    /**
     *
     * @param func (Function) the expression to be observed
     * @param ...params (Objects) the instances bound as parameters to the expression
     */
    constructor(func, ...params) {
        this.func = func;
        this.params = params;
        this.lastValue = this.getCurrentValue();
        this.callbacks = [];
    }

    /**
     * Executes the encapsulated expression with the given parameters.
     * aliases with 'now'
     * @public
     * @returns {*} the current value of the expression
     */
    getCurrentValue() {
        return this.func(...(this.params));
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
      
      return this;
    }

    /**
     * Signals the active expression that a state change might have happened.
     * Mainly for implementation strategies.
     * @public
     */
    checkAndNotify() {
        let currentValue = this.getCurrentValue();
        if(this.lastValue === currentValue) { return; }

        let lastValue = this.lastValue;
        this.lastValue = currentValue;

        this.notify(currentValue, {
            lastValue
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
    if(this.getCurrentValue()) {
      callback();
    }

    return this;
  }

  onBecomeFalse(callback) {
    this.onChange(bool => {
      if(!bool) {
        callback();
      }
    });
    if(!this.getCurrentValue()) {
      callback();
    }

    return this;
  }

  /**
   * #TODO: implement
   * disposeOnLastCallbackDetached
   * chainable
   * for some auto-cleanup
   * (only triggers, when a callback is detached; not initially, if there are no callbacks)
   */
  disposeOnLastCallbackDetached() {
    throw new Error('Not yet implemented.')
  }
}

export function aexpr(func, ...params) {
    return new BaseActiveExpression(func, ...params);
}

export default BaseActiveExpression;

