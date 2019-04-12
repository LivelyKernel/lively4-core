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

class InjectiveMap {

  constructor() {
    this.leftToRight = new Map();
    this.rightToLeft = new Map();
  }
  
  associate(left, right) {
    this.leftToRight.set(left, right);
    this.rightToLeft.set(right, left);
  }
  
  getRightFor(left) {
    return this.leftToRight.get(left);
  }

  hasRightFor(left) {
    return this.leftToRight.has(left);
  }

  getOrCreateRightFor(left, constructorCallback) {
    if (!this.hasRightFor(left)) {
      this.associate(left, constructorCallback(left));
    }
    return this.leftToRight.get(left);
  }

  getLeftFor(right) {
    return this.rightToLeft.get(right);
  }

  hasLeftFor(right) {
    return this.rightToLeft.has(right);
  }

  getOrCreateLeftFor(right, constructorCallback) {
    if (!this.hasLeftFor(right)) {
      this.associate(constructorCallback(right), right);
    }
    return this.rightToLeft.get(right);
  }

}

class Dependency {
  
}

class LocalDependency extends Dependency {
  
}

class MemberDependency extends Dependency {
  
}

class GlobalDependency extends Dependency {
  
}

const DependenciesToAExprs = {
  depsToAExprs: new BidirectionalMultiMap(),
  associate(dep, aexpr) {
    this.depsToAExprs.associate(dep, aexpr);
  },
  disconnectAllForAExpr(aexpr) {
    this.depsToAExprs.removeAllLeftFor(aexpr);
  },
  getAExprsForDep(dep) {
    return Array.from(this.depsToAExprs.getRightsFor(dep));
  },
  getDepsForAExpr(aexpr) {
    return Array.from(this.depsToAExprs.getLeftsFor(aexpr));
  },
  
  /*
   * Removes all associations.
   */
  clear() {
    this.depsToAExprs.clear();
  }
};

// 1. (obj, prop) -> CompositeKey
// - given via CompositeKey
// 2. CompositeKey 1<->1 Dependency
// - membersToDependencies, localsToDependencies
// 3. Dependency *<->* AExpr
// - DependenciesToAExprs

const membersToDependencies = new InjectiveMap();
const localsToDependencies = new InjectiveMap();
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
    const compKeys = DependenciesToAExprs.getDepsForAExpr(this._aexpr)
      .filter(dep => localsToDependencies.hasLeftFor(dep))
      .map(dependency => localsToDependencies.getLeftFor(dependency));

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
    const compKeys = DependenciesToAExprs.getDepsForAExpr(this._aexpr)
      .filter(dep => membersToDependencies.hasLeftFor(dep))
      .map(dependency => membersToDependencies.getLeftFor(dependency));

    return compKeys
      .map(DependencyAPI.compositeKeyToMember)
      .filter(member => member.object !== self);
  }

  globals() {
    const compKeys = DependenciesToAExprs.getDepsForAExpr(this._aexpr)
      .filter(dep => membersToDependencies.hasLeftFor(dep))
      .map(dependency => membersToDependencies.getLeftFor(dependency));

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
    DependenciesToAExprs.disconnectAllForAExpr(aexpr);
  }

  /**
   * **************************************************************
   * ********************** associate *****************************
   * **************************************************************
   */
  static associateMember(obj, prop) {
    const key = CompositeKey.for(obj, prop);
    const dependency = membersToDependencies.getOrCreateRightFor(key, () => new Dependency());
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  static associateGlobal(globalName) {
    this.associateMember(globalRef, globalName);
  }

  static associateLocal(scope, varName) {
    const key = CompositeKey.for(scope, varName);
    const dependency = localsToDependencies.getOrCreateRightFor(key, () => new Dependency());
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  /**
   * **************************************************************
   * ********************** update ********************************
   * **************************************************************
   */
  static memberUpdated(obj, prop) {
    const key = CompositeKey.for(obj, prop);
    const dependency = membersToDependencies.getOrCreateRightFor(key, () => new Dependency());
    const aexprs = DependenciesToAExprs.getAExprsForDep(dependency);
    this.checkAndNotifyAExprs(aexprs);
  }

  static globalUpdated(globalName) {
    this.memberUpdated(globalRef, globalName);
  }

  static localUpdated(scope, varName) {
    const key = CompositeKey.for(scope, varName);
    const dependency = localsToDependencies.getOrCreateRightFor(key, () => new Dependency());
    const affectedAExprs = DependenciesToAExprs.getAExprsForDep(dependency);
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
  DependenciesToAExprs.clear();
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
