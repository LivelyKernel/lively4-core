import 'lang';

import { BaseActiveExpression } from 'active-expression';
import Stack from 'src/client/reactive/utils/stack.js';
import { using } from 'utils';

let expressionAnalysisMode = false;
window.__expressionAnalysisMode__ = true;

const analysisModeManager = {
  __enter__() {
    expressionAnalysisMode = true;
    window.__expressionAnalysisMode__ = expressionAnalysisMode;
  },
  __exit__() {
    expressionAnalysisMode = !!aexprStack.top();
    window.__expressionAnalysisMode__ = expressionAnalysisMode;
  }
}
class ExpressionAnalysis {
  // Do the function execution in ExpressionAnalysisMode
  static check(aexpr) {
    using([analysisModeManager], () => {
      aexprStack.withElement(aexpr, () => aexpr.getCurrentValue());
    });
  }
}

import CompositeKey from './composite-key.js';

class BidirectionalMultiMap {

  constructor() {
    this.leftToRight = new Map();
    this.rightToLeft = new Map();
  }
  
  associate(left, right) {
    this.getRightsFor(left).add(right);
    this.getLeftsFor(right).add(left);
  }
  
  remove(left, right) {
    this.getRightsFor(left).delete(right);
    this.getLeftsFor(right).delete(left);
  }

  removeAllRightFor(left) {
    this.getRightsFor(left).forEach(right => this.remove(left, right));
  }

  removeAllLeftFor(right) {
    this.getLeftsFor(right).forEach(left => this.remove(left, right));
  }

  clear() {
    this.leftToRight.clear();
    this.rightToLeft.clear();
  }

  getRightsFor(left) {
    return this.leftToRight.getOrCreate(left, () => new Set());
  }

  getLeftsFor(right) {
    return this.rightToLeft.getOrCreate(right, () => new Set());
  }

}

class HookStorage {
  constructor() {
    // left: objProps; right: aexprs
    this.objPropsToAExprs = new BidirectionalMultiMap();
  }

  associate(aexpr, obj, prop) {
    if (!aexpr) {
      throw new Error('aexpr is undefined');
    }

    const key = CompositeKey.for(obj, prop);
    this.objPropsToAExprs.associate(key, aexpr);
  }

  disconnectAll(aexpr) {
    this.objPropsToAExprs.removeAllLeftFor(aexpr);
  }

  getAExprsFor(obj, prop) {
    const key = CompositeKey.for(obj, prop);
    return Array.from(this.objPropsToAExprs.getRightsFor(key));
  }

  getCompKeysFor(aexpr) {
    return Array.from(this.objPropsToAExprs.getLeftsFor(aexpr));
  }

  /*
   * Removes all associations.
   * As a result
   */
  clear() {
    this.objPropsToAExprs.clear();
  }
}

const aexprStorage = new HookStorage();
const aexprStorageForLocals = new HookStorage();
const aexprStack = new Stack();

export class RewritingActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.meta({ strategy: 'Rewriting' });
    ExpressionAnalysis.check(this);

    if (new.target === RewritingActiveExpression) {
      this.addToRegistry();
    }
  }

  dispose() {
    super.dispose();
    DependencyManager.disconnectAllFor(this);
  }

  supportsDependencies() {
    return true;
  }

  getDependencies() {
    return new DependencyAPI(this);
  }
}

class DependencyAPI {
  constructor(aexpr) {
    this._aexpr = aexpr;
  }

  static compositeKeyToLocal(compKey) {
    // #TODO: refactor
    const [scope, name] = CompositeKey.keysFor(compKey);
    return {
      scope,
      name,
      value: scope !== undefined ? scope[name] : undefined
    };
  }

  locals() {
    const compKeys = aexprStorageForLocals.getCompKeysFor(this._aexpr);

    return compKeys.map(DependencyAPI.compositeKeyToLocal);
  }

  static compositeKeyToMember(compKey) {
    // #TODO: refactor
    const [object, property] = CompositeKey.keysFor(compKey);
    return {
      object,
      property,
      value: object !== undefined ? object[property] : undefined
    };
  }

  members() {
    const compKeys = aexprStorage.getCompKeysFor(this._aexpr);

    return compKeys
      .map(DependencyAPI.compositeKeyToMember)
      .filter(member => member.object !== self);
  }

  globals() {
    const compKeys = aexprStorage.getCompKeysFor(this._aexpr);

    const globals = [];
    compKeys.forEach(compKey => {
      const [object, name] = CompositeKey.keysFor(compKey);
      if (object === self) {
        globals.push({
          name,
          value: object[name]
        });
      }
    });

    return globals;
  }
}

export function aexpr(func, ...args) {
  return new RewritingActiveExpression(func, ...args);
}

const globalRef = typeof window !== "undefined" ? window : // browser tab
  (typeof self !== "undefined" ? self : // web worker
    global); // node.js

class DependencyManager {
  static get currentAExpr() {
    return aexprStack.top();
  }

  static disconnectAllFor(aexpr) {
    aexprStorage.disconnectAll(aexpr);
    aexprStorageForLocals.disconnectAll(aexpr);
  }

  static associateMember(obj, prop) {
    aexprStorage.associate(this.currentAExpr, obj, prop);
  }

  static associateGlobal(globalName) {
    this.associateMember(globalRef, globalName);
  }

  static associateLocal(scope, varName) {
    aexprStorageForLocals.associate(this.currentAExpr, scope, varName);
  }

  static memberUpdated(obj, prop) {
    const aexprs = aexprStorage.getAExprsFor(obj, prop);
    this.checkAndNotifyAExprs(aexprs);
  }

  static globalUpdated(globalName) {
    this.memberUpdated(globalRef, globalName);
  }

  static localUpdated(scope, varName) {
    const affectedAExprs = aexprStorageForLocals.getAExprsFor(scope, varName);
    this.checkAndNotifyAExprs(affectedAExprs);
  }

  // #TODO, #REFACTOR: extract into configurable dispatcher class
  static checkAndNotifyAExprs(aexprs) {
    aexprs.forEach(aexpr => {
      this.disconnectAllFor(aexpr);
      ExpressionAnalysis.check(aexpr);
    });
    aexprs.forEach(aexpr => aexpr.checkAndNotify());
  }

}

/*
 * Disconnects all associations between active expressions and object properties
 * As a result no currently enable active expression will be notified again,
 * effectively removing them from the system.
 *
 * #TODO: Caution, this might break with some semantics, if we still have references to an aexpr!
 */
export function reset() {
  aexprStorage.clear();
  aexprStorageForLocals.clear();
  CompositeKey.clear();
}

/**
 * (C)RUD for member attributes
 */
export function traceMember(obj, prop) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
}

export function getMember(obj, prop) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
  const result = obj[prop];
  return result;
}

export function getAndCallMember(obj, prop, args = []) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
  const result = obj[prop](...args);
  return result;
}

export function setMember(obj, prop, val) {
  const result = obj[prop] = val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberAddition(obj, prop, val) {
  const result = obj[prop] += val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberSubtraction(obj, prop, val) {
  const result = obj[prop] -= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberMultiplication(obj, prop, val) {
  const result = obj[prop] *= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberDivision(obj, prop, val) {
  const result = obj[prop] /= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberRemainder(obj, prop, val) {
  const result = obj[prop] %= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberExponentiation(obj, prop, val) {
  const result = obj[prop] **= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberLeftShift(obj, prop, val) {
  const result = obj[prop] <<= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberRightShift(obj, prop, val) {
  const result = obj[prop] >>= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberUnsignedRightShift(obj, prop, val) {
  const result = obj[prop] >>>= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseAND(obj, prop, val) {
  const result = obj[prop] &= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseXOR(obj, prop, val) {
  const result = obj[prop] ^= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseOR(obj, prop, val) {
  const result = obj[prop] |= val;
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function deleteMember(obj, prop) {
  const result = delete obj[prop];
  DependencyManager.memberUpdated(obj, prop);
  return result;
}

export function getLocal(scope, varName, value) {
  if (expressionAnalysisMode) {
    scope[varName] = value;
    DependencyManager.associateLocal(scope, varName);
  }
}

export function setLocal(scope, varName, value) {
  scope[varName] = value;
  DependencyManager.localUpdated(scope, varName);
}

export function getGlobal(globalName) {
  if (expressionAnalysisMode) {
    DependencyManager.associateGlobal(globalName);
  }
}
export function setGlobal(globalName) {
  DependencyManager.globalUpdated(globalName);
}

export default aexpr;
