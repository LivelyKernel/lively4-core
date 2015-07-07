module('users.timfelgentreff.layout.solver').requires('users.timfelgentreff.layout.core').toRun(function() {
    /**
     * Solver
     */
    LayoutObject.subclass("LayoutSolver", {
        initialize: function(algorithm) {
            this.cassowary = new ClSimplexSolver();
            this.cassowary.setAutosolve(false);
            this.reset();
        },
        
        reset: function() {
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
            if(value && value instanceof lively.morphic.Box) { // Box
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableBox);
            }
            if(value && ivarname === "shape") { // Shape
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableShape);
            }
            if(value && value instanceof lively.Point && (ivarname === "_Extent" || ivarname === "_Position")) {
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariablePoint);
            };
            if(typeof value === "number" && (ivarname === "x" || ivarname === "y")) { // x or y
                return this.createSpecificVariable(value, ivarname, bbbConstrainedVariable, LayoutConstraintVariableNumber);
            }
            return null;
        },
        
        createSpecificVariable: function(value, ivarname, bbbConstrainedVariable, variableClass) {
            var name = ivarname + "" + this.variables.length;
            var v = new (variableClass)(name, value, this, ivarname, bbbConstrainedVariable);
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
            this.cassowary.solve();
            
            this.rerender();
        },
        
        rerender: function() {
            this.variables.filter(function(constraintVariable) {
                return constraintVariable instanceof LayoutConstraintVariableBox;
            }).each(function(constraintVariable) {
                var morph = constraintVariable.value();
                //morph.setPosition(pt(constraintVariable.child("_Position").x, constraintVariable.child("_Position").y));
                morph.renderUsing(morph.renderContext());
            });
        }
    });
LayoutSolver.addMethods({
    weight: 10000
});
    
    /**
     * ConstraintVariable
     */
    LayoutObject.subclass('LayoutConstraintVariable', {
        initialize: function(name, value, solver, ivarname, bbbConstrainedVariable) {
            this.name = name;
            this.setValue(value);
            this.solver = solver;
            this.ivarname = ivarname;
            this.__cvar__ = bbbConstrainedVariable;
            solver.addVariable(this, bbbConstrainedVariable);
            this.__children__ = {};
            this.initChildConstraints();
        },
        value: function() {
            return this.__value__;
        },
        setValue: function(value) {
            this.__value__ = value;
        },
        initChildConstraints: function() {},
        setReadonly: function(bool) {
            // TODO: add some constraint to hold a constant value
            if (bool && !this.readonlyConstraint) {
            } else if (!bool && this.readonlyConstraint) {
            }
        },
        isReadonly: function() {
            return !!this.readonlyConstraint;
        },
        changed: function(bool) {
            if(arguments.length == 0) return this.__changed__;
            this.__changed__ = bool;
            // propagate changed flag upwards
            if(this.parentConstraintVariable && this.parentConstraintVariable instanceof LayoutConstraintVariable) {
                this.parentConstraintVariable.changed(bool)
            }
        },
        child: function(ivarname, child) {
            if(arguments.length < 2)
                return this.__children__[ivarname];
            this.__children__[ivarname] = child;
            child.parentConstraintVariable = this;
        },
        
        // create a ConstrainedVariable for the property given by ivarname
        constrainProperty: function(ivarname) {
            var extentConstrainedVariable = ConstrainedVariable.newConstraintVariableFor(this.value(), ivarname, this.__cvar__);
            if (Constraint.current) {
                extentConstrainedVariable.ensureExternalVariableFor(Constraint.current.solver);
                extentConstrainedVariable.addToConstraint(Constraint.current);
            }
            var childConstraintVariable = extentConstrainedVariable.externalVariables(this.solver);
            this.child(ivarname, childConstraintVariable);
            //console.log("FOOOOOO", ivarname, childConstraintVariable, this, childConstraintVariable.parentConstraintVariable);
            return extentConstrainedVariable;
        }
    });
    LayoutConstraintVariable.subclass('LayoutConstraintVariableBox', {
        initChildConstraints: function() {
            this.position = this.constrainProperty("_Position");
            this.shape = this.constrainProperty("shape");
        },
        suggestValue: function(val) {
            return val;
            throw "suggestValue is not yet implemented on Morphs"
        },
        /*
         * accepted functions for Boxes
         */
        contains: function(rightHandSideBox, margin) {
            return new LayoutConstraintContains(this, rightHandSideBox, margin || 0, this.solver);
        },
        sameExtent: function(rightHandSideBox) {
            return this.getExtent().eqPt(rightHandSideBox.getExtent());
        },
        width: function() {
            return this
                .child("shape")
                .child("_Extent")
                .child("x");
        },
        height: function() {
            return this
                .child("shape")
                .child("_Extent")
                .child("y");
        },
        left: function() {
            return this
                .child("_Position")
                .child("x");
        },
        top: function() {
            return this
                .child("_Position")
                .child("y");
        },
        getExtent: function() {
            if(this.value().getExtent !== lively.morphic.Morph.prototype.getExtent) {
                throw {
                    name: "NonPrimitiveError",
                    message: "the given method is not the supported primitive",
                    toString: function() { return this.name + ": " + this.message; } 
                }
            }
            return this
                .child("shape")
                .child("_Extent");
        },
        aspectRatio: function(aspectRatio) {
            return new LayoutAccessorAspectRatio(this, this.solver);
        }
    });
    
    
    
    
    
    
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableShape', {
        initChildConstraints: function() {
            this.extent = this.constrainProperty("_Extent");
        },
        suggestValue: function(val) {
            return val;
            throw "suggestValue is not yet implemented on Shapes"
        }
        /*
         * accepted functions for Shapes
         */
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariablePoint', {
        initChildConstraints: function() {
            this.x = this.constrainProperty("x");
            this.y = this.constrainProperty("y");
        },
        
        suggestValue: function(val) {
            //if(this.parentConstraintVariable.value().isBeingDragged) return;
            var x = this.child("x");
            var y = this.child("y");
            x.suggestValue(val.x);
            y.suggestValue(val.y);
        },
        
        /*
         * accepted functions for Points
         */
        eqPt: function(rightHandSidePoint) {
            if(
                (this.ivarname === "_Extent" || this.ivarname === "_Position") &&
                (rightHandSidePoint.ivarname === "_Extent" || rightHandSidePoint.ivarname === "_Position")
            )
                return new LayoutConstraintBoxSameExtent(this, rightHandSidePoint, this.solver);

            throw "eqPt does only work for _Extent and _Position attributes for now. " + rightHandSidePoint.ivarname;
        }
    });
    
    LayoutConstraintVariable.subclass('LayoutConstraintVariableNumber', {
        initialize: function ($super, name, value, solver, ivarname, bbbConstrainedVariable) {
            $super(name, value, solver, ivarname, bbbConstrainedVariable);
            
            this.cassowary = new ClVariable(name, value);
            this.stayConstraint = new ClStayConstraint(this.cassowary);
            this.solver.cassowary.addConstraint(this.stayConstraint);
        },
        
        suggestValue: function(value) {
            //console.log("This is the new Number:", value, this);
    
            var c = this.cassowary.cnEquals(value),
                s = this.solver;
                
            s.cassowary.addConstraint(c);
            try {
                s.solve();
            } finally {
                s.cassowary.removeConstraint(c);
            }
        },
        value: function() {
            return this.cassowary.value();
        },
        /*
         * accepted functions for Numbers
         */
        plus: function(value) {
            if(value.cassowary)
                value = value.cassowary;
            return new LayoutConstraintLinearExpression(this.cassowary.plus(value), this.solver);
        },
    
        minus: function(value) {
            if(value.cassowary)
                value = value.cassowary;
            return new LayoutConstraintLinearExpression(this.cassowary.minus(value), this.solver);
        },
    
        times: function(value) {
            if(value.cassowary)
                value = value.cassowary;
            return new LayoutConstraintLinearExpression(this.cassowary.times(value), this.solver);
        },
    
        divide: function(value) {
            if(value.cassowary)
                value = value.cassowary;
            return new LayoutConstraintLinearExpression(this.cassowary.divide(value), this.solver);
        },
    
        cnGeq: function(value) {
            return new LayoutConstraintLinearEquation(this, value, "cnGeq", this.solver);
        },
    
        cnLeq: function(value) {
            return new LayoutConstraintLinearEquation(this, value, "cnLeq", this.solver);
        },
        
        cnOr: function(value) {
            throw "cnOr not yet implemented on LayoutConstraintVariableNumber";
        },
        cnEquals: function(right) {
            return new LayoutConstraintLinearEquation(this, right, "cnEquals", this.solver);
        },
        cnIdentical: function(value) {
            throw "cnIdentical not yet implemented on LayoutConstraintVariableNumber";
        }
    });
LayoutObject.subclass('LayoutConstraintLinearExpression', {
    initialize: function(cassowary, solver) {
        this.cassowary = cassowary;
        this.solver = solver;
    },
    plus: function(value) {
        if(value.cassowary)
            value = value.cassowary;
        return new LayoutConstraintLinearExpression(this.cassowary.plus(value), this.solver);
    },

    minus: function(value) {
        if(value.cassowary)
            value = value.cassowary;
        return new LayoutConstraintLinearExpression(this.cassowary.minus(value), this.solver);
    },

    times: function(value) {
        if(value.cassowary)
            value = value.cassowary;
        return new LayoutConstraintLinearExpression(this.cassowary.times(value), this.solver);
    },

    divide: function(value) {
        if(value.cassowary)
            value = value.cassowary;
        return new LayoutConstraintLinearExpression(this.cassowary.divide(value), this.solver);
    },

    cnGeq: function(value) {
        return new LayoutConstraintLinearEquation(this, value, "cnGeq", this.solver);
    },

    cnLeq: function(value) {
        return new LayoutConstraintLinearEquation(this, value, "cnLeq", this.solver);
    },
    
    cnEquals: function(right) {
        return new LayoutConstraintLinearEquation(this, right, "cnEquals", this.solver);
    }
});    
        // TODO: add further types of constraint variables
    // for Submorphs array (to enable jQuery style of definitions)
    /**
     * Constraint
     */
    LayoutObject.subclass('LayoutConstraint', {
        enable: function (strength) {
            // TODO: consider strength
            this.solver.addConstraint(this);
        },
        disable: function () {
            this.solver.removeConstraint(this);
        }
    });
    LayoutConstraint.subclass('LayoutConstraintBoxSameExtent', {
        initialize: function(left, right, solver) {
            this.left = left;
            this.right = right;
            this.solver = solver;
            
            this.cnX = this.left.child("x").cnEquals(this.right.child("x"));
            this.cnY = this.left.child("y").cnEquals(this.right.child("y"));
        }
    });
LayoutConstraint.subclass('LayoutConstraintLinearEquation', {
        initialize: function(left, right, operator, solver) {
            this.left = typeof left.cassowary == "undefined" ? left : left.cassowary;
            this.right = typeof right.cassowary == "undefined" ? right : right.cassowary;
            this.solver = solver;
            
            this.cassowary = this.left[operator](this.right);
            this.solver.cassowary.addConstraint(this.cassowary);
        }
});
LayoutConstraint.subclass('LayoutConstraintContains', {
        initialize: function(parent, child, margin, solver) {
            this.parentWidth = parent.width().cassowary;
            this.parentHeight = parent.height().cassowary;

            this.childLeft = child.left().cassowary;
            this.childTop = child.top().cassowary;
            this.childWidth = child.width().cassowary;
            this.childHeight = child.height().cassowary;
            
            this.margin = margin;
            this.solver = solver;
            
            var i1 = this.childLeft.cnGeq(this.margin);
            var i2 = this.childTop.cnGeq(this.margin);
            var i3 = this.childLeft.plus(this.childWidth).plus(this.margin).cnLeq(this.parentWidth);
            var i4 = this.childTop.plus(this.childHeight).plus(this.margin).cnLeq(this.parentHeight);
            
            this.solver.cassowary.addConstraint(i1);
            this.solver.cassowary.addConstraint(i2);
            this.solver.cassowary.addConstraint(i3);
            this.solver.cassowary.addConstraint(i4);
            this.solver.cassowary.addConstraint(this.childWidth.cnGeq(0));
            this.solver.cassowary.addConstraint(this.childHeight.cnGeq(0));
        }
});
    LayoutConstraint.subclass('LayoutConstraintAspectRatio', {
        initialize: function(box, aspectRatio, operation, solver) {
            this.box = box;
            this.aspectRatio = aspectRatio;
            this.solver = solver;
            var width = this.box.getExtent().x
                .externalVariables(this.solver);
            var height = this.box.getExtent().y
                .externalVariables(this.solver);
            
            this.cassowary = (width.cassowary).times(1/aspectRatio)[operation](height.cassowary);
            this.solver.cassowary.addConstraint(this.cassowary);
        }
    });
LayoutObject.subclass('LayoutAccessorAspectRatio', {
    initialize: function(morph, solver) {
        this.morph = morph;
        this.solver = solver;
    },
    
    cnGeq: function(right) {
        return new LayoutConstraintAspectRatio(this.morph, right, "cnGeq", this.solver);
    },

    cnLeq: function(right) {
        return new LayoutConstraintAspectRatio(this.morph, right, "cnLeq", this.solver);
    },
    
    cnEquals: function(right) {
        return new LayoutConstraintAspectRatio(this.morph, right, "cnEquals",this.solver);
    }
});}) // end of module
