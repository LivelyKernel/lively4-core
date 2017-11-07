import { BaseActiveExpression } from "active-expressions";
import { checkTicking as check } from "aexpr-ticking";
import { PausableLoop } from 'utils';

export class FrameBasedActiveExpression extends BaseActiveExpression {
  constructor(func, ...params) {
    super(func, ...params);
    
    this.enabled = true;
  }

  onChange(...args) {
    super.onChange(...args);

    FRAME_BASED_AEXPRS.add(this);
    checkLoop.ensureRunning();
  }

  offChange(...args) {
    super.offChange(...args);
    
    if(this.callbacks.length === 0) {
      FRAME_BASED_AEXPRS.delete(this);
      if(FRAME_BASED_AEXPRS.size === 0) {
        checkLoop.pause();
      }
    }
  }
  
  // #TODO: unused!
  revoke() {
    FRAME_BASED_AEXPRS.delete(this);
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
