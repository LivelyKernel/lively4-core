import Interpreter from './babelsberg/jsinterpreter/interpreter.js';

let bbb = {};

import ConstrainedVariable from './babelsberg/constrainedvariable.js';
import Constraint from './babelsberg/constraint.js';

import {recursionGuard, newUUID} from './babelsberg/util.js';

// import { copv2 as cop } from './ContextJS/copv2/Layers.js'

export function aexpr() {}

export class ConstraintInterpreter extends Interpreter {
    static newConstraint(func, solver) {
        return new Constraint(func, solver, this);
    }


    static runAndReturn(func, optScope) {
        var scope = optScope || {};
        var i = new ConstraintInterpreter(
            `var returnValue = (${func.toString()})();`,
            (self, rootScope) => {
                console.log(scope);
                Object.keys(scope).forEach((k) => {
                    var value = scope[k];
                    console.log(k, value);
                    self.setProperty(rootScope, k, self.createPseudoObject(value));
                });
                ["__lvVarRecorder", "jQuery", "$", "_", "lively"].forEach((k) => {
                    self.setProperty(rootScope, k, self.createPseudoObject(window[k]));
                });
            });
        i.run();
        return i.stateStack[0].scope.properties.returnValue.valueOf();
    }

    get binaryExpressionMap() {
        return {
            // operation: [method, reverseMethod (or undefined)]
            '+': ['plus', 'plus'],
            '-': ['minus'],
            '*': ['times', 'times'],
            '/': ['divide'],
            '%': ['modulo'],
            '==': ['cnEquals', 'cnEquals'],
            '===': ['cnIdentical', 'cnIdentical'],
            '<=': ['cnLeq', 'cnGeq'],
            '>=': ['cnGeq', 'cnLeq'],
            '<': ['cnLess', 'cnGreater'],
            '>': ['cnGreater', 'cnLess'],
            '||': ['cnOr', 'cnOr'],
            '!=': ['cnNeq', 'cnNeq'],
            '!==': ['cnNotIdentical', 'cnNotIdentical']
        };
    }

    get alternativeExpressionsMapTo() {
        return {
            '+': '-',
            '<=': '<',
            '>=': '>',
            '==': '==='
        };
    }

    get alternativeExpressionsMap() {
        var map = {};
        _.keys(this.alternativeExpressionsMapTo)(function(ea) {
            map[this.alternativeExpressionsMapTo[ea]] = ea;
            map[ea] = this.alternativeExpressionsMapTo[ea];
        }.bind(this));
        return map;
    }

    getGlobalScope() {
        return this.stateStack[0].scope.parentScope;
    }

    getConstraintObjectValue(o) {
        if (o === undefined || !o.isConstraintObject) return o;
        var value = o.value;
        if (typeof(value) == 'function') {
            return value.apply(o);
        } else {
            return value;
        }
    }
    errorIfUnsolvable(op, l, r, res) {
        if (typeof(res) == 'undefined') {
            res = r;
            r = undefined;
        }

        if (!(l.isConstraintObject || (r && r.isConstraintObject)) ||
            Constraint.current.allowUnsolvableOperations) {
            return ((typeof(res) == 'function') ? res() : res);
        } else {
            var msg = '`' + op + "'" + ' not allowed on ' + l,
                alternative;
            if (r !== undefined) {
                msg = 'Binary op ' + msg + ' and ' + r;

                var altOp = this.alternativeExpressionsMap[op];
                if (altOp) {
                    if (l[this.binaryExpressionMap[altOp][0]] ||
                        r[this.binaryExpressionMap[altOp][1]]) {
                        alternative = altOp;
                    }
                }
            }
            if (!alternative && Constraint.current.solver.alternativeOperationFor) {
                alternative = Constraint.current.solver.alternativeOperationFor(op);
            }

            msg += ". If you want to allow this, pass `allowUnsolvableOperations'" +
                'to the constraint.';
            if (alternative) {
                msg += ' You can also rewrite the code to use ' +
                    alternative + ' instead.';
            }
            throw new Error(msg);
        }
    }

    stepConditionalExpression() {
        var state = this.stateStack[0];
        if (!state.test || state.done) return super.stepConditionalExpression();

        // we are not done but have run the test
        if (state.value.valueOf().isConstraintObject) {
            // leave the resolved value on the stack
            state.value = this.getConstraintObjectValue(state.value.valueOf());
            if (!condVal) {
                // if the solver did not produce a value
                cop.withoutLayers([ConstraintConstructionLayer], () => {
                    // We don't want constrained variables from the conditional
                    // in this case, so we put the condition back on the stack
                    // and run it again this time without constraint construction
                    this.stateStack.unshift({node: state.node.test});
                    super.stepConditionalExpression();
                });
            }
        }
        // we have left a good value on the stack, the superclass deals with the rest
        return super.stepConditionalExpression();
    }

    stepUnaryExpression() {
        var state = this.stateStack[0];
        var node = state.node;
        if (!state.done) {
            super.stepUnaryExpression();
        } else {
            this.stateStack.shift();
            var value,
                val = state.value.valueOf(),
                rVal = this.getConstraintObjectValue(val),
                msg = 'Unary op `' + node.name + "'";
            switch (node.operator) {
                case '-':
                    if (val && val.isConstraintObject && val.times) {
                        value = this.createPseudoObject(val.times(-1));
                    } else {
                        value = this.createPseudoObject(this.errorIfUnsolvable(msg, val, -rVal));
                    }
                    break;
                case '!':
                    if (val && val.isConstraintObject && val.not) {
                        value = this.createPseudoObject(val.not());
                    } else {
                        value = this.createPseudoObject(!rVal);
                        // value = this.createPseudoObject(this.errorIfUnsolvable(msg, val, !rVal));
                    }
                    break;
                case '~':
                    value = this.createPseudoObject(this.errorIfUnsolvable(msg, val, ~rVal));
                    break;
                case 'typeof':
                    value = this.createPseudoObject(this.errorIfUnsolvable(msg, val, typeof(rVal)));
                    break;
                default:
                    throw new SyntaxError('No semantics for unary op ' + node.name);
            }
            this.stateStack[0].value = value;
        }
    }



    stepCallExpression() {
        var state = this.stateStack[0],
            node = state.node,
            n = state.n_ || 0;
        if (state.doneCallee_ &&
            state.func_ &&
            state.arguments &&
            state.arguments.length == node.arguments.length &&
            !(node.arguments[n]) &&
            !state.doneExec) {
            // only when all arguments are prepared do we come here
            if (state.func_.nativeFunc) {
                debugger
                // only check if the receiver is Math, to get special functions
                var firstArg = state.arguments[0].valueOf();
                if (func === Math.sqrt && firstArg.pow || firstArg.sqrt) {
                    if (firstArg.pow) {
                        state.value = this.createPseudoObject(firstArg.pow.apply(firstArg, [0.5]));
                    } else {
                        state.value = this.createPseudoObject(firstArg.sqrt.apply(firstArg, []));
                    }
                } else if (func === Math.pow && firstArg.pow) {
                    state.value = this.createPseudoObject(
                        firstArg.pow.apply(firstArg, [state.arguments[1].valueOf()]));
                } else if (func === Math.sin && firstArg.sin) {
                    state.value = this.createPseudoObject(firstArg.sin.apply(firstArg, []));
                } else if (func === Math.cos && firstArg.cos) {
                    state.value = this.createPseudoObject(firstArg.cos.apply(firstArg, []));
                } else {
                    super.stepCallExpression();
                }
            } else if (state.func.node &&
                state.funcThis_.valueOf() &&
                state.funcThis_.valueOf().isConstraintObject) {
                debugger
                if (func) {
                    var forInterpretation = func.forInterpretation;
                    func.forInterpretation = undefined;
                    var prevNode = bbb.currentNode,
                        prevInterp = bbb.currentInterpreter;
                    bbb.currentInterpreter = this;
                    bbb.currentNode = node;
                    try {
                        return cop.withoutLayers([ConstraintConstructionLayer], function() {
                            return $super(node, recv, func, argValues);
                        });
                    } catch (e) {
                        // TIM: send doesNotUnderstand to solver variable?
                        return this.errorIfUnsolvable(
                            (node.property && node.property.value),
                            recv,
                            (function() {
                                var value = this.getConstraintObjectValue(recv);
                                var prop = this.visit(node.property);
                                return this.invoke(node, value, value[prop], argValues);
                            }).bind(this)
                        );
                    } finally {
                        func.forInterpretation = forInterpretation;
                        bbb.currentInterpreter = prevInterp;
                        bbb.currentNode = prevNode;
                    }
                } else {
                    return this.errorIfUnsolvable(
                        (node.property && node.property.value),
                        recv,
                        (function() {
                            var value = this.getConstraintObjectValue(recv);
                            var prop = this.visit(node.property);
                            return this.invoke(node, value, value[prop], argValues);
                        }).bind(this)
                    );
                }
            } else {
                super.stepCallExpression();
            }
        } else {
            super.stepCallExpression();
        }
    }

    stepLogicalExpression() {
        var state = this.stateStack[0];
        var node = state.node;

        if (!state.doneLeft_) {
            state.doneLeft_ = true;
            this.stateStack.unshift({node: node.left});
        } else if (!state.doneRight_) {
            // we don't do shortcut evaluation
            state.leftValue = state.value;
            state.doneRight_ = true;
            this.stateStack.unshift({node: node.right});
        } else {
            this.stateStack.shift();
            var leftVal = state.leftValue.valueOf(),
                rightVal = state.value.valueOf();
            switch (node.operator) {
                case '&&':
                    // If the left value is just undefined/falsy, there is nothing we can do
                    if (!leftVal) {
                        state.value = state.leftValue;
                    } else if (leftVal.isConstraintObject && typeof(leftVal.cnAnd) == 'function') {
                        state.value = this.createPseudoObject(leftVal.cnAnd(rightVal));
                    } else if (rightVal.isConstraintObject && typeof(rightVal.cnAnd) == 'function') {
                        state.value = this.createPseudoObject(rightVal.cnAnd(leftVal));
                    } else if (leftVal === true) {
                        // do nothing, return right hand side
                    } else {
                        Constraint.current.addPrimitiveConstraint(leftVal);
                    }
                    break;
                case '||':
                    if (leftVal.isConstraintObject && typeof(leftVal.cnOr) == 'function') {
                        state.value = this.createPseudoObject(leftVal.cnAnd(rightVal));
                    } else if (rightVal.isConstraintObject && typeof(rightVal.cnOr) == 'function') {
                        state.value = this.createPseudoObject(rightVal.cnOr(leftVal));
                    } else {
                        var rLeftVal = this.getConstraintObjectValue(leftVal),
                            rRightVal = this.getConstraintObjectValue(rightVal);
                        state.value = this.errorIfUnsolvable(
                            '||',
                            leftVal,
                            rightVal,
                            rLeftVal || rRightVal);
                    }
                    break;
                default:
                    throw new SyntaxError('Unknown logical operator: ' + node.operator);
            }
            this.stateStack[0].value = state.value;
        }
    }

    stepBinaryExpression() {
        var state = this.stateStack[0],
            node = state.node;
        if (state.doneLeft && state.doneRight) {
            this.stateStack.shift();
            var prevNode = bbb.currentNode,
                prevInterp = bbb.currentInterpreter;
            bbb.currentInterpreter = this;
            bbb.currentNode = node;
            try {
                var value = this.pvtStepBinaryExpression(state, node);
                if (value === undefined) {
                    // pass
                } else {
                    debugger
                    this.stateStack[0].value = this.createPseudoObject(value);
                }
            } finally {
                bbb.currentInterpreter = prevInterp;
                bbb.currentNode = prevNode;
            }
        } else {
            super.stepBinaryExpression();
        }
    }

    pvtStepBinaryExpression(state, node) {
        var op = node.operator;

        // /* Only supported */ if (node.name.match(/[\*\+\/\-]|==|<=|>=|===|<|>|\|\|/)) {
        var leftVal = state.leftValue.valueOf(),
            rightVal = state.value.valueOf();

        if (leftVal === undefined) leftVal = 0;
        if (rightVal === undefined) rightVal = 0;

        var rLeftVal = (leftVal && leftVal.isConstraintObject) ?
                this.getConstraintObjectValue(leftVal) :
                leftVal,
            rRightVal = (rightVal && rightVal.isConstraintObject) ?
                this.getConstraintObjectValue(rightVal) :
                rightVal;
        switch (node.name) {
            case 'in':
                if (leftVal.isConstraintObject && leftVal.cnIn) {
                    return leftVal.cnIn(rightVal);
                } else if (this.$finiteDomainProperty) {
                    var lV = this.$finiteDomainProperty;
                    delete this.$finiteDomainProperty;
                    if (lV.cnIn) {
                        return lV.cnIn(rightVal);
                    }
                }
                return this.errorIfUnsolvable(
                    op, leftVal, rightVal, super.stepBinaryExpression());
            case '-':
                if (rightVal.isConstraintObject &&
                    rightVal.plus &&
                    _.isNumber(leftVal)) {
                    return rightVal.plus(-leftVal);
                } // special case for reversing minus - allowed to fall through to default
            default:
                var method = this.binaryExpressionMap[node.operator];
                if (method) {
                    if (leftVal && leftVal.isConstraintObject &&
                        typeof(leftVal[method[0]]) == 'function') {
                        return leftVal[method[0]](rightVal);
                    } else if (rightVal && rightVal.isConstraintObject &&
                        typeof(rightVal[method[1]]) == 'function') {
                        return rightVal[method[1]](leftVal);
                    } else {
                        return this.errorIfUnsolvable(
                            op,
                            leftVal,
                            rightVal,
                            eval('rLeftVal ' + node.operator + ' rRightVal')
                        );
                    }
                } else {
                    return this.errorIfUnsolvable(
                        op, leftVal, rightVal, super.stepBinaryExpression());
                }
        }
    }

    safeToString(obj) {
        var toS = Object.prototype.toString,
            str;
        try {
            if (obj.toString) str = obj.toString();
        } catch (e) {
            str = toS.apply(obj);
        }
        return str;
    }

    getProperty(obj, name) {
        if (obj.valueOf() === window /*||
            // (obj instanceof Interpreter.Object) ||
            // (obj instanceof Interpreter.Primitive) ||
         (obj instanceof lively.Module) || (typeof(obj) == "string")*/) {
            return super.getProperty(obj, name);
        }
        obj = obj.valueOf();
        var cobj = (obj ? obj[ConstrainedVariable.ThisAttrName] : undefined),
            cvar;
        name = name.valueOf();
        if (name && name.isConstraintObject) {
            name = this.getConstraintObjectValue(name);
        }
        if (obj && obj.isConstraintObject) {
            if (obj['cn' + name]) {
                return obj['cn' + name]; // XXX: TODO: Document this
            } else if (name === 'is') {
                // possibly a finite domain definition
                this.$finiteDomainProperty = obj;
            } else {
                cobj = obj.__cvar__;
                obj = this.getConstraintObjectValue(obj);
            }
        }
        cvar = ConstrainedVariable.newConstraintVariableFor(obj, name, cobj);
        if (Constraint.current) {
            cvar.ensureExternalVariableFor(Constraint.current.solver);
            cvar.addToConstraint(Constraint.current);
        }
        if (cvar && cvar.isSolveable()) {
            return cvar.externalVariable;
        } else {
            var retval = obj[name];
            if (!retval || !retval.isConstraintObject) {
                var objStr = this.safeToString(obj),
                    retStr = this.safeToString(retval);
                if (Constraint.current) {
                    console.log(
                        Constraint.current.solver.constructor.name +
                        ' cannot reason about the variable ' + objStr + '[' +
                        name + '], a ' + retStr + ' of type ' +
                        (typeof(retval) == 'object' ?
                            retval.constructor.name :
                            typeof(retval))
                    );
                    Constraint.current.haltIfDebugging();
                }
            }
            if (retval) {
                switch (typeof(retval)) {
                    case 'object':
                    case 'function':
                        retval[ConstrainedVariable.ThisAttrName] = cvar;
                        break;
                    case 'number':
                        new Number(retval)[ConstrainedVariable.ThisAttrName] = cvar;
                        break;
                    case 'string':
                        new String(retval)[ConstrainedVariable.ThisAttrName] = cvar;
                        break;
                    case 'boolean': break;
                    default: throw 'Error - ' +
                    'we cannot store the constrained var attribute on ' +
                    retval + ' of type ' + typeof(retval);
                }
            }
            return retval;
        }
    }

    stepReturnStatement() {
        super.stepReturnStatement();
        var state = this.stateStack[0];
        if (state.done) {
            var stateThis = state.funcThis_,
                func = state.func_,
                retVal = (state.value || this.UNDEFINED).valueOf();
            if (retVal) {
                var cvar = retVal[ConstrainedVariable.ThisAttrName];
                if (retVal.isConstraintObject) {
                    cvar = retVal.__cvar__;
                }
                if (cvar) {
                    if (func) {
                        cvar.getter = func.toString();
                        cvar.recv = state.funcThis_;
                    }
                }
            }
        }
    }

    // shouldInterpret(frame, func) {
    //     if (func.sourceModule ===
    //             Global.users.timfelgentreff.babelsberg.constraintinterpreter) {
    //         return false;
    //     }
    //     if (func.declaredClass === 'Babelsberg') {
    //         return false;
    //     }
    //     var nativeClass = lively.Class.isClass(func) && func.superclass === undefined;
    //     return (!(this.isNative(func) || nativeClass)) &&
    //             typeof(func.forInterpretation) == 'function';
    // }
    // newObject($super, func) {
    //     if (func.original) {
    //         return $super(func.original);
    //     } else {
    //         return $super(func);
    //     }
    // }

}

class PrimitiveCObjectRegistry {
    // stores last seen cvars for objects weakly
    static set(obj, cobj) {
        PrimitiveCObjectRegistry.registry[obj] = cobj;
    }
    static get(obj) {
        return PrimitiveCObjectRegistry.registry[obj];
    }
}
PrimitiveCObjectRegistry.registry = {};

// Number.prototype.__defineGetter__(ConstrainedVariable.ThisAttrName, function() {
//     return PrimitiveCObjectRegistry.get(this + 0 /* coerce back into prim */);
// }
// Number.prototype.__defineGetter__(ConstrainedVariable.AttrName, function() {
//     return {};
// }
// Number.prototype.__defineSetter__(ConstrainedVariable.ThisAttrName, function(v) {
//     PrimitiveCObjectRegistry.set(this + 0 /* coerce back into prim */, v);
// }
// String.prototype.__defineGetter__(ConstrainedVariable.ThisAttrName, function() {
//     return PrimitiveCObjectRegistry.get(this + '' /* coerce back into prim */);
// }
// String.prototype.__defineGetter__(ConstrainedVariable.AttrName, function() {
//     return {};
// }
// String.prototype.__defineSetter__(ConstrainedVariable.ThisAttrName, function(v) {
//     PrimitiveCObjectRegistry.set(this + '' /* coerce back into prim */, v);
// }

