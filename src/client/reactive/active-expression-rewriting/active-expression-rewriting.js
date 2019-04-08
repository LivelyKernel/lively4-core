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

  getLeftFor(right) {
    return this.rightToLeft.get(right);
  }

}

class Dependency {
  static for(obj, prop, hookStorage) {
    const key = CompositeKey.for(obj, prop);
    const dependency = hookStorage.dependenciesByCompositeKey.getOrCreate(key, () => {
      const dep = new Dependency();
      hookStorage.compositeKeyByDependencies.set(dep, key);
      return dep;
    });
    return dependency;
  }
  
  static compositeKeyFor(dependency, hookStorage) {
    return hookStorage.compositeKeyByDependencies.get(dependency)
  }
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

class HookStorage {
  constructor() {
    // 1. (obj, prop) -> CompKey
    // - given via CompKey
    // 2. CompKey -> Dependency
    this.dependenciesByCompositeKey = new Map(); // main
    this.compositeKeyByDependencies = new Map();
    // 3. Dependency <-> AExpr
    DependenciesToAExprs
    // this.dependenciesToAExprs = new BidirectionalMultiMap();
  }

  associate(aexpr, obj, prop) {
    if (!aexpr) {
      throw new Error('aexpr is undefined');
    }

    const dependency = Dependency.for(obj, prop, this);
    // this.dependenciesToAExprs.associate(dependency, aexpr);
    DependenciesToAExprs.associate(dependency, aexpr);
  }

  disconnectAll(aexpr) {
    DependenciesToAExprs.disconnectAllForAExpr(aexpr);
  }

  getAExprsFor(obj, prop) {
    const dependency = Dependency.for(obj, prop, this);
    return DependenciesToAExprs.getAExprsForDep(dependency);
  }

  getCompKeysFor(aexpr) {
    return DependenciesToAExprs.getDepsForAExpr(aexpr)
      .filter(dep => this.compositeKeyByDependencies.has(dep))
      .map(dependency => Dependency.compositeKeyFor(dependency, this));
  }
}

const aexprStorageForMembers = new HookStorage();
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
    const compKeys = aexprStorageForMembers.getCompKeysFor(this._aexpr);

    return compKeys
      .map(DependencyAPI.compositeKeyToMember)
      .filter(member => member.object !== self);
  }

  globals() {
    const compKeys = aexprStorageForMembers.getCompKeysFor(this._aexpr);

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
    aexprStorageForMembers.disconnectAll(aexpr);
    aexprStorageForLocals.disconnectAll(aexpr);
  }

  /**
   * **************************************************************
   * ********************** associate *****************************
   * **************************************************************
   */
  static associateMember(obj, prop) {
    aexprStorageForMembers.associate(this.currentAExpr, obj, prop);
  }

  static associateGlobal(globalName) {
    this.associateMember(globalRef, globalName);
  }

  static associateLocal(scope, varName) {
    aexprStorageForLocals.associate(this.currentAExpr, scope, varName);
  }

  /**
   * **************************************************************
   * ********************** update ********************************
   * **************************************************************
   */
  static memberUpdated(obj, prop) {
    const aexprs = aexprStorageForMembers.getAExprsFor(obj, prop);
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
