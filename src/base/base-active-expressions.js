export class BaseActiveExpression {

    /**
     *
     * @param func (Function) the expression to be observed
     */
    constructor(func) {
        // console.log(func);
        this.func = func;
        this.lastValue = this.getCurrentValue();
        this.callbacks = [];
    }

    /**
     * aliases with 'now'
     * @returns {*} the current value of the expression
     */
    getCurrentValue() {
        return this.func();
    }

    onChange(callback) {
        this.callbacks.push(callback);

        return this;
    }

    checkAndNotify() {
        let currentValue = this.getCurrentValue();
        if(this.lastValue === currentValue) { return; }

        this.lastValue = currentValue;
        this.notify();

    }

    notify() {
        this.callbacks.forEach(callback => callback());
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
