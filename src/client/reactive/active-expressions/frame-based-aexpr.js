import { BaseActiveExpression } from "active-expressions";
import { checkTicking as check } from "aexpr-ticking";
import { PausableLoop } from 'utils';

export class FrameBasedActiveExpression extends BaseActiveExpression {
  constructor(func, ...params) {
    super(func, ...params);
    this.meta({ strategy: 'Frame-based' });

    // needed for check function for aexpr-ticking
    this.enabled = true;

    if(this.isAsync === true) {
      this.cachedCurrentValueUpdatedAt = 0;
    }
  }

  getCurrentValue() {
    if(this.isAsync !== true || this.cachingFetch.hasTraced()) {
      return super.getCurrentValue();
    }

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

export function aexpr(func, ...params) {
  return new FrameBasedActiveExpression(func, ...params);
}

const FRAME_BASED_AEXPRS = new Set();

// update Active Expressions once per frame
const checkLoop = new PausableLoop(() => check(FRAME_BASED_AEXPRS));

export function __unload__() {
  checkLoop.pause();
}
