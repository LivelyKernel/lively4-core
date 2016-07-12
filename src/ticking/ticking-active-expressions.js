import { BaseActiveExpression } from './../base/base-active-expressions.js';

const TICKING_INSTANCES = new Set();

class TickingActiveExpression extends BaseActiveExpression {

    // each implementation strategy ensures to track changes of the given expression
    // in the case of ticking, we add the aexpr to a collection of tracked aexpr
    // which enables them to recognize changes (here, explicitly through the `check` method)
    constructor(func) {
        super(func);
        this.enable();
    }

    // TODO: refactor/extractMethod with InterpreterActiveExpression
    revoke() {
        this.removeListeners();
    }

    disable() {
        this.enabled = false;
        TICKING_INSTANCES.delete(this);

        return this;
    }

    enable() {
        this.enabled = true;
        TICKING_INSTANCES.add(this);

        return this;
    }
}

export function aexpr(func, scope) { return new TickingActiveExpression(func, scope); }

// TODO: the concrete semantic of enabled and disabled aexprs are not clear yet.
// Instead, they are related to this concrete implementation.
// For example, what happens if a disabled aexpr is re-enabled AND the value of the aexpr
// has already changed? SHould the callback be invoked with the  new value and the lastValue
// before the disabling? or with the actual last value? Or should it not be invoked until
// something changes? If so, what is the last value? Or should aexprs simply not be able to be
// re-enabled again? Or should they not even be disable-able; then, it would be the duty of
// the callback/a built-upon concept to implement thiese functionalities appropriately
export function check(iterable = TICKING_INSTANCES) {
    iterable.forEach(aexpr => aexpr.enabled && aexpr.checkAndNotify());
}
