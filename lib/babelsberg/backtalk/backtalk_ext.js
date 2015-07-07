module('users.timfelgentreff.backtalk.backtalk_ext').
requires(
    'users.timfelgentreff.backtalk.backtalk',
    'users.timfelgentreff.backtalk.constraints',
    'users.timfelgentreff.babelsberg.constraintinterpreter').
toRun(function() {

Object.subclass('BacktalkSolver', {
    initialize: function() {
        this.csp = new backtalk.CSP();
        this.solver = new backtalk.Solver(this.csp);
    },
    reset: function() {
        this.solver.reset();
    },

    constraintVariableFor: function(value, ivarname, cobj) {
        // skip syntax
        if (value === undefined && ivarname === 'is') return;
        return new BacktalkVariable(ivarname, value, this);
    },
    solve: function() {
        var solution = this.solver.firstSolution();
        if (!solution) {
            throw new Error('Backtalk constraint unsatisfiable.');
        }
    },
    always: function(opts, func) {
        var ctx = opts.ctx,
            needsFunc = false;
        Object.defineProperty(func, 'allowUnsolvableOperations', {
            get: function() {
                needsFunc = true;
                return true;
            }
        });
        func.allowUnsolvableOperations = true;
        func.varMapping = ctx;
        var cobj = new Constraint(func, this);
        debugger
        if (cobj.constraintobjects.length === 1 && needsFunc) {
            this.convertTestToFuncConstraint(cobj, func, opts);
        }
        
        return cobj;
    },
    convertTestToFuncConstraint: function(cobj, func, opts) {
        var constraint,
            solver = this,
            varA, varB,
            // This function receives the values to test
            // the predicate with
            test = (function (a, b) {
                var vA = varA.currentValue, vB;
                if (varB) vB = varB.currentValue;
                varA.currentValue = a;
                if (varB) varB.currentValue = b;
                try {
                    return func();
                } finally {
                    varA.currentValue = vA;
                    if (varB) varB.currentValue = vB;
                }
            });
        
        
        if (cobj.constraintvariables.length === 1) {
            varA = cobj.constraintvariables[0].externalVariables(this).variable;
            cobj.constraintobjects[0] = BacktalkConstraint.unaryFunc(
                varA,
                test
            );
        } else { //if (cobj.constraintvariables.length === 2) {
            var vars = cobj.constraintvariables.map(function (v) {
                return v.externalVariables(solver);
            });
            varA = vars[0].variable;
            varB = vars[1].variable;
            cobj.constraintobjects[0] = BacktalkConstraint.binaryFunc(
                varA,
                varB,
                test
            );
        }
    },
    weight: 200,
    isConstraintObject: true,
});

Object.subclass('BacktalkVariable', {
    initialize: function(name, value, solver) {
        var initialDomain;
        if (typeof(value) == "number" || value instanceof Number) {
            initialDomain = Array.range(-100, 500); // heuristic
        } else if (typeof(value) == "boolean" || value instanceof Boolean) {
            initialDomain = [true, false];
        } else {
            initialDomain = [value];
        }
        this.variable = backtalk.Variable.labelDomain(name, initialDomain);
        this.variable.currentValue = value;
        this.solver = solver;
        this.solver.csp.addVariable(this.variable);
    },
    
    isConstraintObject: true,
    suggestValue: function(v) {
        var rhs = this.ensureVariable(v),
            c = BacktalkConstraint.cnEquals(this.variable, rhs),
            oldValues = this.solver.csp.variables.map(function (v) {
                return [v, v.currentValue];
            });
        c.enable();
        try {
            this.solver.solve();
        } catch(e) {
            oldValues.each(function (v) {
                v[0].currentValue = v[1];
            });
            throw e;
        } finally {
            c.disable();
            this.solver.csp.removeVariable(rhs);
            this.variable.removeConstraint(c);
        }
    },
    value: function() {
        return this.variable.currentValue;
    },
    setReadonly: function(bool) {
        if (bool && !this.readonlyConstraint) {
            var c = this.cnEquals(this.value());
            this.readonlyConstraint = c;
        } else if (!bool && this.readonlyConstraint) {
            this.variable.removeConstraint(this.readonlyConstraint);
        }
    },
    isReadonly: function() {
        return !!this.readonlyConstraint;
    },
    
    cnEquals: function(v) {
        var rhs = this.ensureVariable(v);
        return BacktalkConstraint.cnEquals(this.variable, rhs);
    },
    cnNeq: function(v) {
        var rhs = this.ensureVariable(v);
        return BacktalkConstraint.cnNeq(this.variable, rhs);
    },
    cnNotIdentical: function(v) {
        return this.cnNeq(v);
    },
    cnIdentical: function(v) {
        return this.cnEquals(v);
    },
    cnIn: function(ary) {
        var domain;
        debugger
        if (ary instanceof this.constructor) {
            domain = ary.value();
        } else {
            domain = ary;
        }
        if (domain instanceof Array) {
            if (domain.length === 0) {
                throw new Error('Domain cannot be empty');
            }
            this.variable.domain = domain;
        } else {
            throw new Error('Domain has to be an array');
        }
        return BacktalkConstraint.true(this.variable);
    },
    ensureVariable: function(v) {
        var rhs = v;
        if (v instanceof this.constructor) {
            rhs = v.variable;
        } else if (!(v instanceof backtalk.Variable)) {
            rhs = new backtalk.Variable.labelDomain('constant' + v, [v]);
        }
        this.solver.csp.addVariable(rhs);
        return rhs;
    }
});

Object.subclass('BacktalkConstraint', {
    initialize: function(vars, constraint) {
        this.variables = vars;
        this.constraint = constraint;
        this.disable(); // do not initially enable the constraint
    },
    enable: function() {
        var constraint = this.constraint;
        if (!constraint) return;
        this.variables.each(function (v) {
            v.addConstraint(constraint);
        });
    },
    disable: function() {
        var constraint = this.constraint;
        if (!constraint) return;
        this.variables.each(function (v) {
            v.removeConstraint(constraint);
        });
    },
    isConstraintObject: true
});

Object.extend(BacktalkConstraint, {
    true: function(variable) {
        return new BacktalkConstraint(
            [variable],
            new backtalk.EqualityConstraint(variable, variable)
        );
    },
    binaryFunc: function(v1, v2, func) {
        return new BacktalkConstraint(
            [v1, v2],
            new backtalk.FunctionBinaryConstraint(v1, v2, func)
        );
    },
    unaryFunc: function(v, func) {
        return new BacktalkConstraint(
            [v],
            new backtalk.FunctionUnaryConstraint(v, func)
        );
    },
    cnEquals: function(v1, v2) {
        return new BacktalkConstraint(
            [v1, v2],
            new backtalk.EqualityConstraint(v1, v2)
        );
    },
    cnNeq: function(v1, v2) {
        return new BacktalkConstraint(
            [v1, v2],
            new backtalk.InequalityConstraint(v1, v2)
        );
    }
});

}) // end of module
