import { BaseActiveExpression } from 'active-expression';
import { check, setExpressionOptionsForConventionStrategies } from "src/client/reactive/active-expression-convention/active-expression-ticking.js";
import { PausableLoop } from 'utils';

export class FrameBasedActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.meta({ strategy: 'Frame-based' });

    // needed for check function for aexpr-ticking
    this.enabled = true;

    if(new.target === FrameBasedActiveExpression) {
      this.addToRegistry();
    }
  }

  onChange(...args) {
    const result = super.onChange(...args);

    if(!this._isDisposed) {
      FRAME_BASED_AEXPRS.add(this);
      checkLoop.ensureRunning();
    }
    
    return result;
  }

  offChange(...args) {
    const result = super.offChange(...args);

    if(!this.hasCallbacks()) {
      this.revoke();
    }
    
    return result;
  }

  dispose(...args) {
    const result = super.dispose(...args);
    this.revoke();
    
    return result;
  }

  // #TODO: unused!
  revoke() {
    FRAME_BASED_AEXPRS.delete(this);
    if(FRAME_BASED_AEXPRS.size === 0) {
      checkLoop.pause();
    }
  }

  /** the parameter `checkImmediately` is by default false for convention strategies */
  setExpression(...params) {
    return super.setExpression(...setExpressionOptionsForConventionStrategies(...params))
  }

}

export function aexpr(func, ...args) {
  return new FrameBasedActiveExpression(func, ...args);
}

const FRAME_BASED_AEXPRS = new Set();

// update Active Expressions once per frame
const checkLoop = new PausableLoop(() => check(FRAME_BASED_AEXPRS));

export function __unload__() {
  checkLoop.pause();
}
