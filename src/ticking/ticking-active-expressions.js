import { BaseActiveExpression } from './../base/base-active-expressions.js';

const TICKING_INSTANCES = new Set();

class TickingActiveExpression extends BaseActiveExpression {

    constructor(func) {
        super(func);
        TICKING_INSTANCES.add(this);
    }

    revoke() {
        this.removeListeners();
    }
}

export function aexpr(func, scope) { return new TickingActiveExpression(func, scope); }

export function check(group = TICKING_INSTANCES) {
    group.forEach(aexpr => aexpr.checkAndNotify());
}
