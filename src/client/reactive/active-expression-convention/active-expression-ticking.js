import { BaseActiveExpression } from 'active-expression';

const TICKING_INSTANCES = new Set();

export function setExpressionOptionsForConventionStrategies(func, options = {}, ...rest) {
  return [func, Object.assign({
    checkImmediately: false
  }, options), ...rest];
}

export class TickingActiveExpression extends BaseActiveExpression {

    // each implementation strategy ensures to track changes of the given expression
    // in the case of ticking, we add the aexpr to a collection of tracked aexpr
    // which enables them to recognize changes (here, explicitly through the `check` method)
    constructor(func, ...args) {
        super(func, ...args);
        TICKING_INSTANCES.add(this);

        if(new.target === TickingActiveExpression) {
            this.addToRegistry();
        }
    }

    // TODO: refactor/extractMethod with InterpreterActiveExpression
    revoke() {
        this.removeListeners();
    }

    dispose() {
      TICKING_INSTANCES.delete(this);
      super.dispose();
    }
  
    disable2(...args) {
      return super.disable(...args)
    }

    enable2(...args) {
      return super.enable(...args)
    }
  
    disable(...args) {
      super.disable(...args)
      return this;
    }

    enable(...args) {
      super.enable(...args)
      return this;
    }
  
  /** the parameter `checkImmediately` is by default false for convention strategies */
  setExpression(...params) {
    return super.setExpression(...setExpressionOptionsForConventionStrategies(...params))
  }
}

export function aexpr(func, ...args) { return new TickingActiveExpression(func, ...args); }

// TODO: the concrete semantic of enabled and disabled aexprs are not clear yet.
// Instead, they are related to this concrete implementation.
// For example, what happens if a disabled aexpr is re-enabled AND the value of the aexpr
// has already changed? Should the callback be invoked with the new value and the lastValue
// before the disabling? or with the actual last value? Or should it not be invoked until
// something changes? If so, what is the last value? Or should aexprs simply not be able to be
// re-enabled again? Or should they not even be disable-able; then, it would be the duty of
// the callback/a built-upon concept to implement thiese functionalities appropriately
export function check(iterable = TICKING_INSTANCES) {
    iterable.forEach(aexpr => aexpr.checkAndNotify());
}

// Remove all active expressions of this type from the system
// afterward active expressions are only reachable by providing them explicitly in an iterable to `check`
// Caution: Do not use this function unless you know what you are doing!
export function clearDefaultActiveExpressions() {
    TICKING_INSTANCES.clear();
}
