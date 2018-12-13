import { BaseActiveExpression } from 'active-expression';
import Stack from 'src/client/reactive/utils/stack.js';
import { using } from 'utils';

let expressionAnalysisMode = false;
window.__expressionAnalysisMode__ = true;

const analysisModeManager = {
  __enter__() {
    expressionAnalysisMode = true;
  },
  __exit__() {
    expressionAnalysisMode = !!aexprStack.top();
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

class HookStorage {
    constructor() {
        // this.objPropsByAExpr = new Map();

        this.aexprsByObjProp = new Map();
    }

    associate(aexpr, obj, prop) {
        // if(!this.objPropsByAExpr.has(aexpr)) {
        //     this.objPropsByAExpr.set(aexpr, new Set());
        // }
        //
        // let objPropSet = this.objPropsByAExpr.get(aexpr);
        //
        // objPropSet.add(CompositeKey.get(obj, prop));

        // ---
        if(!aexpr) {
          throw new Error('aexpr is undefined');
        }

        const key = CompositeKey.for(obj, prop);
        if(!this.aexprsByObjProp.has(key)) {
            this.aexprsByObjProp.set(key, new Set());
        }

        this.aexprsByObjProp.get(key).add(aexpr);
    }

    disconnectAll(aexpr) {
        // this.objPropsByAExpr.delete(aexpr);

        // ---

        this.aexprsByObjProp.forEach(setOfAExprs => {
            setOfAExprs.delete(aexpr);
        });
    }

    getAExprsFor(obj, prop) {
        const key = CompositeKey.for(obj, prop);
        if(!this.aexprsByObjProp.has(key)) {
            return [];
        }
        return Array.from(this.aexprsByObjProp.get(key));

        // ---
        // let comp = CompositeKey.get(obj, prop);
        // return Array.from(this.objPropsByAExpr.keys()).filter(aexpr => {
        //     return this.objPropsByAExpr.get(aexpr).has(comp);
        // });
    }

    getCompKeysFor(aexpr) {
      let compKeys = [];

      this.aexprsByObjProp.forEach((aexprSet, compKey) => {
        if(aexprSet.has(aexpr)) {
          compKeys.push(compKey);
        }
      });

      return compKeys;
    }

    /*
     * Removes all associations.
     * As a result
     */
    clear() {
        this.aexprsByObjProp.clear();
    }
}

const aexprStorage = new HookStorage();
const aexprStorageForLocals = new HookStorage();
const aexprStack = new Stack();

export class RewritingActiveExpression extends BaseActiveExpression {
  constructor(func, ...args){
    super(func, ...args);
    this.meta({ strategy: 'Rewriting' });
    ExpressionAnalysis.check(this);

    if(new.target === RewritingActiveExpression) {
      this.addToRegistry();
    }
  }

  dispose() {
    super.dispose();
    aexprStorage.disconnectAll(this);
    aexprStorageForLocals.disconnectAll(this);
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
    const [ scope, name ] = CompositeKey.keysFor(compKey);
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
    const [ object, property ] = CompositeKey.keysFor(compKey);
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
      const [ object, name ] = CompositeKey.keysFor(compKey);
      if(object === self) {
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

function checkAndNotifyAExprs(aexprs) {
    aexprs.forEach(aexpr => {
        aexprStorage.disconnectAll(aexpr);
        aexprStorageForLocals.disconnectAll(aexpr);
        ExpressionAnalysis.check(aexpr);
    });
    aexprs.forEach(aexpr => aexpr.checkAndNotify());
}

function checkDependentAExprs(obj, prop) {
    const aexprs = aexprStorage.getAExprsFor(obj, prop);
    checkAndNotifyAExprs(aexprs);
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
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
}

export function getMember(obj, prop) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    const result = obj[prop];
    return result;
}

export function getAndCallMember(obj, prop, args = []) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    const result = obj[prop](...args);
    return result;
}

export function setMember(obj, prop, val) {
    const result = obj[prop] = val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberAddition(obj, prop, val) {
    const result = obj[prop] += val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberSubtraction(obj, prop, val) {
    const result = obj[prop] -= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberMultiplication(obj, prop, val) {
    const result = obj[prop] *= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberDivision(obj, prop, val) {
    const result = obj[prop] /= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberRemainder(obj, prop, val) {
    const result = obj[prop] %= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberExponentiation(obj, prop, val) {
    const result = obj[prop] **= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberLeftShift(obj, prop, val) {
    const result = obj[prop] <<= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberRightShift(obj, prop, val) {
    const result = obj[prop] >>= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberUnsignedRightShift(obj, prop, val) {
    const result = obj[prop] >>>= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseAND(obj, prop, val) {
    const result = obj[prop] &= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseXOR(obj, prop, val) {
    const result = obj[prop] ^= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseOR(obj, prop, val) {
    const result = obj[prop] |= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function deleteMember(obj, prop) {
    const result = delete obj[prop];
    checkDependentAExprs(obj, prop);
    return result;
}

export function getLocal(scope, varName, value) {
  if(expressionAnalysisMode) {
    scope[varName] = value;
    aexprStorageForLocals.associate(aexprStack.top(), scope, varName);
  }
}

export function setLocal(scope, varName, value) {
    scope[varName] = value;
    const affectedAExprs = aexprStorageForLocals.getAExprsFor(scope, varName);
    checkAndNotifyAExprs(affectedAExprs);
}

const globalRef = typeof window !== "undefined" ? window : // browser tab
    (typeof self !== "undefined" ? self : // web worker
        global); // node.js

export function getGlobal(globalName) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), globalRef, globalName);
    }
}
export function setGlobal(globalName) {
    checkDependentAExprs(globalRef, globalName);
}

export default aexpr;
