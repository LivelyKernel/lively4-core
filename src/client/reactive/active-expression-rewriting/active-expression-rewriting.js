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
import InjectiveMap from './injective-map.js';
import BidirectionalMultiMap from './bidirectional-multi-map.js';

const dependencyCompositeKey = new CompositeKey();

class Dependency {
  constructor(type) {
    this.type = type;
  }

  isMemberDependency() {
    return this.type === 'member' && !this.isGlobal();
  }
  isGlobalDependency() {
    return this.type === 'member' && this.isGlobal();
  }
  isLocalDependency() {
    return this.type === 'local';
  }
  isGlobal() {
    const compKey = membersToDependencies.getLeftFor(this);
    if (!compKey) {
      return false;
    }
    const [object] = dependencyCompositeKey.keysFor(compKey);
    return object === self;
  }

  getAsDependencyDescription() {
    if (this.isMemberDependency()) {
      const compKey = membersToDependencies.getLeftFor(this);
      const [object, property] = dependencyCompositeKey.keysFor(compKey);
      return {
        object,
        property,
        value: object !== undefined ? object[property] : undefined
      };
    } else if (this.isGlobalDependency()) {
      const compKey = membersToDependencies.getLeftFor(this);
      const [object, name] = dependencyCompositeKey.keysFor(compKey);
      return {
        name,
        value: object[name]
      };
    } else if (this.isLocalDependency()) {
      const compKey = localsToDependencies.getLeftFor(this);
      const [scope, name] = dependencyCompositeKey.keysFor(compKey);
      return {
        scope,
        name,
        value: scope !== undefined ? scope[name] : undefined
      };
    } else {
      throw new Error('Dependency is neighter local, member, nor global.');
    }
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

// 1. (obj, prop) -> dependencyCompositeKey
// - given via dependencyCompositeKey
// 2. dependencyCompositeKey 1<->1 Dependency
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

  dependencies() {
    return new DependencyAPI(this);
  }
}

class DependencyAPI {
  constructor(aexpr) {
    this._aexpr = aexpr;
  }
  
  getDependencies() {
    return DependenciesToAExprs.getDepsForAExpr(this._aexpr);
  }

  locals() {
    return this.getDependencies()
      .filter(dependency => dependency.isLocalDependency())
      .map(dependency => dependency.getAsDependencyDescription());
  }

  members() {
    return this.getDependencies()
      .filter(dependency => dependency.isMemberDependency())
      .map(dependency => dependency.getAsDependencyDescription());
  }

  globals() {
    return this.getDependencies()
      .filter(dependency => dependency.isGlobalDependency())
      .map(dependency => dependency.getAsDependencyDescription());
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
    const key = dependencyCompositeKey.for(obj, prop);
    const dependency = membersToDependencies.getOrCreateRightFor(key, () => new Dependency('member'));
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  static associateGlobal(globalName) {
    this.associateMember(globalRef, globalName);
  }

  static associateLocal(scope, varName) {
    const key = dependencyCompositeKey.for(scope, varName);
    const dependency = localsToDependencies.getOrCreateRightFor(key, () => new Dependency('local'));
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  /**
   * **************************************************************
   * ********************** update ********************************
   * **************************************************************
   */
  static memberUpdated(obj, prop) {
    const key = dependencyCompositeKey.for(obj, prop);
    const dependency = membersToDependencies.getOrCreateRightFor(key, () => new Dependency('member'));
    const aexprs = DependenciesToAExprs.getAExprsForDep(dependency);
    this.checkAndNotifyAExprs(aexprs);
  }

  static globalUpdated(globalName) {
    this.memberUpdated(globalRef, globalName);
  }

  static localUpdated(scope, varName) {
    const key = dependencyCompositeKey.for(scope, varName);
    const dependency = localsToDependencies.getOrCreateRightFor(key, () => new Dependency('local'));
    const affectedAExprs = DependenciesToAExprs.getAExprsForDep(dependency);
    this.checkAndNotifyAExprs(affectedAExprs);
  }

  // #TODO, #REFACTOR: extract into configurable dispatcher class
  static checkAndNotifyAExprs(aexprs) {
    aexprs.forEach(aexpr => {
      // #TODO: compute diff of Dependencies
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
  dependencyCompositeKey.clear();
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
