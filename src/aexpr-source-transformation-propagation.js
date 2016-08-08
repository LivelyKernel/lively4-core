import { BaseActiveExpression } from 'active-expressions';
import Stack from 'stack-es2015-modules';

let expressionAnalysisMode = false;

class ExpressionAnalysis {
    // Do the function execution in ExpressionAnalysisMode
    static check(aexpr) {
        aexprStack.withElement(aexpr, () => {
            // TODO: provide API for running the expression and returning its value, rather that relying on the instance property directly
            aexpr.func();
        });
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
}

class HookStorage {
    constructor() {
        this.objPropsByAExpr = new Map();
    }

    associate(aexpr, obj, prop) {
        if(!this.objPropsByAExpr.has(aexpr)) {
            this.objPropsByAExpr.set(aexpr, new Set());
        }

        let objPropSet = this.objPropsByAExpr.get(aexpr);

        objPropSet.add(CompositeKey.get(obj, prop));
        console.log('added', obj, prop);
    }

    disconnectAll(aexpr) {
        this.objPropsByAExpr.delete(aexpr);
    }

    getAExprsFor(obj, prop) {
        let comp = CompositeKey.get(obj, prop);
        return Array.from(this.objPropsByAExpr.keys()).filter(aexpr => {
            return this.objPropsByAExpr.get(aexpr).has(comp);
        });
    }
}

const aexprStorage = new HookStorage();
const aexprStack = new Stack();

class RewritingActiveExpression extends BaseActiveExpression {

    constructor(func){
        super(func);

        ExpressionAnalysis.check(this);
    }
}

export function aexpr(func) {
    console.log('aexpr', func);
    return new RewritingActiveExpression(func);
}

export function getMember(obj, prop) {
    console.log('getMember', obj, prop);
    let currentAExpr = aexprStack.top();
    if(currentAExpr) {
        aexprStorage.associate(currentAExpr, obj, prop);
    }
    return obj[prop];
}

export function getAndCallMember(obj, prop, args) {
    console.log('getAndCallMember', obj, prop, ...args);
    let currentAExpr = aexprStack.top();
    if(currentAExpr) {
        aexprStorage.associate(currentAExpr, obj, prop);
    }
    return obj[prop](...args);
}

export function setMember(obj, prop, operator, val) {
    console.log('setMember', obj, prop, operator, val);
    // TODO: check actual operator
    let result = obj[prop] = val;
    aexprStorage.getAExprsFor(obj, prop).forEach(aexpr => aexpr.checkAndNotify());
    return result;
}

export default aexpr;
