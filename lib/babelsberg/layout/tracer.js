module('users.timfelgentreff.layout.tracer').requires('users.timfelgentreff.layout.core').toRun(function() {
    LayoutObject.subclass("LayoutTracer", {
        initialize: function(algorithm) {
            this.variables = [];
            this.constraints = [];
            
            this.layoutConstraintVariablesByName = {};
            this.bbbConstraintVariablesByName = {};
        },
        
        always: function(opts, func)  {
            func.allowUnsolvableOperations = true;
            func.varMapping = opts.ctx;
            var constraint = new Constraint(func, this);
            constraint.enable();
            return constraint;
        },
        constraintVariableFor: function(value, ivarname, bbbConstrainedVariable) {
            if(typeof value == "undefined")
                return null;
            
            var cVar = this.createSpecificVariable(value, ivarname, bbbConstrainedVariable);
            // TODO: listen to everything
            console.log("VAR", cVar, value, ivarname, bbbConstrainedVariable);

            return  cVar;
        },
        
        createSpecificVariable: function(value, ivarname, bbbConstrainedVariable) {
            var name = ivarname + "" + this.variables.length;
            var v = new LayoutTracerVariable(name, value, this, ivarname, bbbConstrainedVariable);
            return v;
        },
        
        addVariable: function(layoutConstraintVariable, bbbConstraintVariable) {
            this.variables.push(layoutConstraintVariable);
            this.bbbConstraintVariablesByName[layoutConstraintVariable.name] = bbbConstraintVariable;
            this.layoutConstraintVariablesByName[layoutConstraintVariable.name] = layoutConstraintVariable;
            
        },
        
        addConstraint: function(constraint) {
            this.constraints.push(constraint);
            
        },
        
        removeConstraint: function(constraint) {
            this.constraints.remove(constraint);
            
        },
        
        solveOnce: function(constraint) {
            this.addConstraint(constraint);
            try {
                this.solve();
            } finally {
                this.removeConstraint(constraint);
            }
        },
        
        solve: function() {
            // TODO: delegate to cassowary
        }
    });
    LayoutTracer.addMethods({
        weight: 10000
    });
    LayoutObject.subclass("LayoutTracerVariable", {
        initialize: function(name, value, solver, ivarname, bbbConstrainedVariable) {
            this.name = name;
            this.setValue(value);
            this.solver = solver;
            this.ivarname = ivarname;
            this.__cvar__ = bbbConstrainedVariable;
            solver.addVariable(this, bbbConstrainedVariable);
        },
        value: function() {
            return this.__value__;
        },
        setValue: function(value) {
            this.__value__ = value;
        },
        setReadonly: function(bool) {
            // TODO: add some constraint to hold a constant value
            if (bool && !this.readonlyConstraint) {
            } else if (!bool && this.readonlyConstraint) {
            }
        },
        isReadonly: function() {
            return !!this.readonlyConstraint;
        },
        throwError: function() {
            throw {
                name: "NonPrimitiveError",
                message: "the given method is not the supported primitive",
                toString: function() { return this.name + ": " + this.message; } 
            }
        },
        getExtent: function() {
            console.log("CALL", "getExtent", this, arguments)
            this.throwError();
        },
        extent: function() {
            console.log("CALL", "extent", this, arguments)
            this.throwError();
        },
        getBounds: function() {
            console.log("CALL", "getBounds", this, arguments)
            this.throwError();
        },
        eqPt: function() {
            console.log("CALL", "eqPt", this, arguments)
            this.throwError();
        },
        cnEquals: function() {
            console.log("CALL", "cnEquals", this, arguments)
            return new LayoutTracerConstraint(this, "cnEquals", arguments, this.solver);
        },
        toString: function() {
            return "LayoutObject["+this.value().toString()+"]";
        }
    });
    LayoutObject.subclass('LayoutTracerConstraint', {
        initialize: function(left, operation, right, solver) {
            this.left = left;
            this.operation = operation;
            this.right = right;
            this.solver = solver;
        },
        enable: function (strength) {
            // TODO: consider strength
            this.solver.addConstraint(this);
        },
        disable: function () {
            this.solver.removeConstraint(this);
        },
        cnAnd: function() {
            return this;
        }
    });

}) // end of module
