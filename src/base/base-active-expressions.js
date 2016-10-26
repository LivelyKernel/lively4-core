export class BaseActiveExpression {

    /**
     *
     * @param func (Function) the expression to be observed
     * @param ...params (Objects) the instances bound as parameters to the expression
     */
    constructor(func, ...params) {
        // console.log(func);
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
}

export default BaseActiveExpression;
