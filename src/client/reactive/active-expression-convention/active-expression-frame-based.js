import { BaseActiveExpression } from 'active-expression';
import { check } from "src/client/reactive/active-expression-convention/active-expression-ticking.js";
import { PausableLoop } from 'utils';

export class FrameBasedActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.meta({ strategy: 'Frame-based' });

    // needed for check function for aexpr-ticking
    this.enabled = true;

    // if(this.isAsync === true) {
    //   this.cachedCurrentValueUpdatedAt = 0;
    // }
    
    if(new.target === FrameBasedActiveExpression) {
      this.addToRegistry();
    }
  }

  getCurrentValue() {
    // if(this.isAsync !== true || this.cachingFetch.hasTraced()) {
    //   return super.getCurrentValue();
    // }

    let time = new Date().getTime();
    if((time - this.cachedCurrentValueUpdatedAt) > 5000) {
      let currentValue = super.getCurrentValue();
      this.cachedCurrentValue = currentValue;
      this.cachedCurrentValueUpdatedAt = time;
      return currentValue;
    } else {
      return this.cachedCurrentValue;
    }
  }

  onChange(...args) {
    super.onChange(...args);

    if(!this._isDisposed) {
      FRAME_BASED_AEXPRS.add(this);
      checkLoop.ensureRunning();
    }
  }

  offChange(...args) {
    super.offChange(...args);

    if(this.callbacks.length === 0) {
      this.revoke();
    }
  }

  dispose() {
    super.dispose();
    this.revoke();
  }

  // #TODO: unused!
  revoke() {
    FRAME_BASED_AEXPRS.delete(this);
    if(FRAME_BASED_AEXPRS.size === 0) {
      checkLoop.pause();
    }
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
