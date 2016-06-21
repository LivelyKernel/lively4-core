import Interpreter from './babelsberg/jsinterpreter/interpreter.js';

import ConstrainedVariable from './babelsberg/constrainedvariable.js';
import Constraint from './babelsberg/constraint.js';

import { identity, isPrimitive, pushIfMissing, removeIfExisting, Stack } from './utils.js';
import { select, SelectionItem} from './property-accessor.js';

export { ConstraintInterpreter } from './constraint-interpreter.js';

class ActiveExpression {

    constructor(func, scope) {
        this.func = func;
        this.scope = scope;
        this.callbacks = [];
    }

    onChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * TODO
     * like a bind for AExpr
     * @param items
     */
    applyOn(...items) {
        throw new Error('Not yet implemented');
    }

    /**
     * TODO
     * uninstalls all listeners, so that the given callback is not called anymore
     */
    revoke() {
        throw new Error('Not yet implemented');
    }
}

export function aexpr(func, scope) { return new ActiveExpression(func, scope); }

export class ActiveExpressionInterpreter extends Interpreter {

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

    getConstraintObjectValue(o) {
        if (o === undefined || !o.isConstraintObject) return o;
        var value = o.value;
        if (typeof(value) == 'function') {
            return value.apply(o);
        } else {
            return value;
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
}
