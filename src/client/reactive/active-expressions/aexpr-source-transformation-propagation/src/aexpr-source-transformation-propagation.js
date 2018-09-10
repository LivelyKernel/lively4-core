import { BaseActiveExpression } from 'active-expressions';
import Stack from 'src/client/reactive/utils/stack.js';
import { using } from 'utils';

let expressionAnalysisMode = false;

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

// #TODO: CompositeKeyStore as separate Module
const compositeKeyStore = new Map();
const compositeKeyStoreReverse = new Map();
class CompositeKey {
  static _getByPrimaryKey(obj1) {
    if(!compositeKeyStore.has(obj1)) {
      compositeKeyStore.set(obj1, new Map());
    }

    return compositeKeyStore.get(obj1);
  }
  static _get(obj1, obj2) {
    const secondKeyMap = this._getByPrimaryKey(obj1);
    if(!secondKeyMap.has(obj2)) {
      const compKey = {};
      secondKeyMap.set(obj2, compKey);
      compositeKeyStoreReverse.set(compKey, [obj1, obj2]);
    }
    return secondKeyMap.get(obj2);
  }
  
  static for(obj1, obj2) {
    return this._get(obj1, obj2);
  }
  
  /**
   * Reverse operation of @link(for)
   */
  static keysFor(compKey) {
    return compositeKeyStoreReverse.get(compKey) || [];
  }
  
  static clear() {
    compositeKeyStore.clear();
    compositeKeyStoreReverse.clear();
  }
}

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
      
        if(aexpr == undefined)
            throw new Error('aexpr is undefined');

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

class RewritingActiveExpression extends BaseActiveExpression {
  constructor(func, ...params){
    super(func, ...params);
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

    return compKeys.map(DependencyAPI.compositeKeyToMember);
  }
}

export function aexpr(func, ...params) {
    return new RewritingActiveExpression(func, ...params);
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
    transactionContext.tryToTrigger(obj, aexprs);
}

class TransactionContext {
    constructor() {
        this.suppressed = new Map();
    }
  
    retain(obj) {
        if(!this.suppressed.has(obj))
            this.suppressed.set(obj, {count:1, aexprs: new Set()});
        else
            ++this.suppressed.get(obj).count;
    }
  
    release(obj) {
        const supressed = this.suppressed.get(obj);
        if(!supressed)
            console.error('Tried to release object which is not supressed');
        if(supressed.count == 1) {
            checkAndNotifyAExprs(supressed.aexprs);
            this.suppressed.delete(obj);
        }
        --supressed.count;
    }
  
    tryToTrigger(obj, aexprs) {
        const supressed = this.suppressed.get(obj);
        if(supressed) {
            aexprs.forEach(aexpr => {
                supressed.aexprs.add(aexpr);
            });
        } else {
          checkAndNotifyAExprs(aexprs);
        }
    }
}
const transactionContext = new TransactionContext();

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

export function traceMember(obj, prop) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
}

export function getMember(obj, prop) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    transactionContext.retain(obj);
    const result = obj[prop];
    transactionContext.release(obj);
    return result;
}

export function getAndCallMember(obj, prop, args = []) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    transactionContext.retain(obj);
    const result = obj[prop](...args);
    transactionContext.release(obj);
    return result;
}

export function setMember(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] = val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberAddition(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] += val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberSubtraction(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] -= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberMultiplication(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] *= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberDivision(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] /= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberRemainder(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] %= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberExponentiation(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] **= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberLeftShift(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] <<= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberRightShift(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] >>= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberUnsignedRightShift(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] >>>= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberBitwiseAND(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] &= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberBitwiseXOR(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] ^= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
    return result;
}

export function setMemberBitwiseOR(obj, prop, val) {
    transactionContext.retain(obj);
    const result = obj[prop] |= val;
    checkDependentAExprs(obj, prop);
    transactionContext.release(obj);
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
