import { BaseActiveExpression } from 'active-expressions';
import Stack from 'stack-es2015-modules';

let expressionAnalysisMode = false;

class ExpressionAnalysis {
    // Do the function execution in ExpressionAnalysisMode
    static check(aexpr) {
        expressionAnalysisMode = true;
        aexprStack.withElement(aexpr, () => aexpr.getCurrentValue());
        expressionAnalysisMode = !!aexprStack.top();
    }
}

// TODO: CompositeKeyStore as separate Module
const compositeKeyStore = new Map();
class CompositeKey {
    static get(obj1, obj2) {
        if(!compositeKeyStore.has(obj1)) {
            compositeKeyStore.set(obj1, new Map());
        }

        let secondKeyMap = compositeKeyStore.get(obj1);

        if(!secondKeyMap.has(obj2)) {
            secondKeyMap.set(obj2, {});
        }

        return secondKeyMap.get(obj2);
    }
    static clear() {
        compositeKeyStore.clear();
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

        let key = CompositeKey.get(obj, prop);
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
        let key = CompositeKey.get(obj, prop);
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
  }

  dispose() {
    super.dispose();
    aexprStorage.disconnectAll(this);
    aexprStorageForLocals.disconnectAll(this);
  }
}

export function aexpr(func, ...params) {
    // console.log('aexpr', func);
    return new RewritingActiveExpression(func, ...params);
}

/*
 * Disconnects all associations between active expressions and object properties
 * As a result no currently enable active expression will be notified again,
 * effectively removing them from the system.
 *
 * TODO: Caution, this might break with some semantics, if we still have references to an aexpr!
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

export function getMember(obj, prop, ...params) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    return obj[prop];
}

export function getAndCallMember(obj, prop, args = []) {
    if(expressionAnalysisMode) {
        aexprStorage.associate(aexprStack.top(), obj, prop);
    }
    return obj[prop](...args);
}

function checkDependentAExprs(obj, prop) {
    let affectedAExprs = aexprStorage.getAExprsFor(obj, prop);
    affectedAExprs.forEach(aexpr => {
        aexprStorage.disconnectAll(aexpr);
        ExpressionAnalysis.check(aexpr);
    });
    affectedAExprs.forEach(aexpr => aexpr.checkAndNotify());
}

function checkDependentAExprsForLocals(obj, prop) {
    let affectedAExprs = aexprStorageForLocals.getAExprsFor(obj, prop);
    affectedAExprs.forEach(aexpr => {
        aexprStorageForLocals.disconnectAll(aexpr);
        ExpressionAnalysis.check(aexpr);
    });
    affectedAExprs.forEach(aexpr => aexpr.checkAndNotify());
}

export function setMember(obj, prop, val) {
    let result = obj[prop] = val;
    checkDependentAExprs(obj, prop);
    return result;

}

export function setMemberAddition(obj, prop, val) {
    let result = obj[prop] += val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberSubtraction(obj, prop, val) {
    let result = obj[prop] -= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberMultiplication(obj, prop, val) {
    let result = obj[prop] *= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberDivision(obj, prop, val) {
    let result = obj[prop] /= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberRemainder(obj, prop, val) {
    let result = obj[prop] %= val;
    checkDependentAExprs(obj, prop);
    return result;
}

/*
export function setMemberExponentiation(obj, prop, val) {
    let result = obj[prop] **= val;
    checkDependentAExprs(obj, prop);
    return result;
}
*/

export function setMemberLeftShift(obj, prop, val) {
    let result = obj[prop] <<= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberRightShift(obj, prop, val) {
    let result = obj[prop] >>= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberUnsignedRightShift(obj, prop, val) {
    let result = obj[prop] >>>= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseAND(obj, prop, val) {
    let result = obj[prop] &= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseXOR(obj, prop, val) {
    let result = obj[prop] ^= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function setMemberBitwiseOR(obj, prop, val) {
    let result = obj[prop] |= val;
    checkDependentAExprs(obj, prop);
    return result;
}

export function getLocal(scope, varName) {
    if(expressionAnalysisMode) {
        aexprStorageForLocals.associate(aexprStack.top(), scope, varName);
    }
}
export function setLocal(scope, varName) {
    checkDependentAExprsForLocals(scope, varName);
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
