export class BaseActiveExpression {

    /**
     *
     * @param func (Function) the expression to be observed
     */
    constructor(func) {}

    /**
     * aliases with 'now'
     * @returns {*} the current value of the expression
     */
    getCurrentValue() {}

    onChange(callback) {
        this.callbacks.push(callback);

        return this;
    }

    /**
     * TODO
     * like a bind for AExpr
     * @param items
     */
    applyOn(...items) {
        throw new Error('Not yet implemented');
    }

    revoke() {
        this.removeListeners();
    }
}

export default BaseActiveExpression;
