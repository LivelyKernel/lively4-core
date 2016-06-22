import Interpreter from './babelsberg/jsinterpreter/interpreter.js';
import { PropertyAccessor, SelectionItem, stack} from './property-accessor.js';

export { ConstraintInterpreter } from './constraint-interpreter.js';

class ActiveExpression {

    constructor(func, scope) {
        this.func = func;
        this.scope = scope;
        this.callbacks = [];
        this.propertyAccessors = new Set();
        
        stack.with(this, () => {
            ActiveExpressionInterpreter.runAndReturn(this.func, this.scope);
        });
    }
    
    expressionChanged() {
        this.callbacks.forEach(callback => callback());
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
        var i = new ActiveExpressionInterpreter(
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

    getProperty(obj, name) {
        let object = obj.valueOf(),
            prop = name.valueOf();

        PropertyAccessor
            .wrapProperties(object, prop)
            .addCallback(stack.current());

        return super.getProperty(obj, name);
    }
}
