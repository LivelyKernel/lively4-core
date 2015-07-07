module('users.timfelgentreff.cassowary.DwarfCassowary').
    requires('users.timfelgentreff.cassowary.HashSet').toRun(function() {
        // FILE: EDU.Washington.grad.gjb.cassowary
        // package EDU.Washington.grad.gjb.cassowary;

        Object.extend(Global, {
            ExCLError: function() {
                return new Error('(ExCLError) An error has occured in CL');
            }
        });
        Object.extend(ExCLError, {
            subclass: function(name, category, obj) {
                Global[name] = function() {
                    return new Error(obj.description());
                };
            }
        });

        ExCLError.subclass('ExCLConstraintNotFound', 'default category', {
            //Extends: ExCLError,
            description: function() {
                return '(ExCLConstraintNotFound) ' +
                    'Tried to remove a constraint never added to the tableu';
            }
        });


        ExCLError.subclass('ExCLInternalError', 'default category', {
            //Extends: ExCLError,
            /* FIELDS:
               private String description_
            */
            initialize: function(s /*String*/) {
                description_ = s;
            },
            description: function() {
                return '(ExCLInternalError) ' + description_;
            }
        });

        ExCLError.subclass('ExCLNonlinearExpression', 'default category', {
            //Extends: ExCLError,
            description: function() {
                return '(ExCLNonlinearExpression) ' +
                    'The resulting expression would be nonlinear';
            }
        });

        ExCLError.subclass('ExCLNotEnoughStays', 'default category', {
            //Extends: ExCLError,
            description: function() {
                return '(ExCLNotEnoughStays) ' +
                    'There are not enough stays to give specific values to all variables';
            }
        });

        ExCLError.subclass('ExCLRequiredFailure', 'default category', {
            //Extends: ExCLError,
            description: function() {
                return '(ExCLRequiredFailure) A required constraint cannot be satisfied';
            }
        });

        ExCLError.subclass('ExCLTooDifficult', 'default category', {
            //Extends: ExCLError,
            description: function() {
                return '(ExCLTooDifficult) The constraints are too difficult to solve';
            }
        });



        Object.subclass('ClSymbolicWeight', 'default category', {
            initialize: function(w1, w2, w3) {
                this._values = new Array(w1, w2, w3);
            },
            times: function(n) {
                return new ClSymbolicWeight(this._values[0] * n,
                                            this._values[1] * n,
                                            this._values[2] * n);
            },
            divideBy: function(n) {
                return new ClSymbolicWeight(this._values[0] / n,
                                            this._values[1] / n,
                                            this._values[2] / n);
            },
            add: function(c) {
                return new ClSymbolicWeight(this._values[0] + c._values[0],
                                            this._values[1] + c._values[1],
                                            this._values[2] + c._values[2]);
            },

            subtract: function(c) {
                return new ClSymbolicWeight(this._values[0] - c._values[0],
                                            this._values[1] - c._values[1],
                                            this._values[2] - c._values[2]);
            },

            lessThan: function(c) {
                for (var i = 0; i < this._values.length; ++i) {
                    if (this._values[i] < c._values[i]) {
                        return true;
                    } else if (this._values[i] > c._values[i]) {
                        return false;
                    }
                }
                return false; // equal
            },

            lessThanOrEqual: function(c) {
                for (var i = 0; i < this._values.length; ++i) {
                    if (this._values[i] < c._values[i]) {
                        return true;
                    } else if (this._values[i] > c._values[i]) {
                        return false;
                    }
                }
                return true; // equal
            },

            equal: function(c) {
                for (var i = 0; i < this._values.length; ++i) {
                    if (this._values[i] != c._values[i]) {
                        return false;
                    }
                }
                return true;
            },

            greaterThan: function(c) {
                return !this.lessThanOrEqual(c);
            },

            greaterThanOrEqual: function(c) {
                return !this.lessThan(c);
            },

            isNegative: function() {
                return this.lessThan(ClSymbolicWeight.clsZero);
            },

            toDouble: function() {
                sum = 0;
                factor = 1;
                multiplier = 1000;
                for (var i = this._values.length - 1; i >= 0; --i) {
                    sum += this._values[i] * factor;
                    factor *= multiplier;
                }
                return sum;
            },

            toString: function() {
                return '[' + this._values[0] + ',' +
                    this._values[1] + ',' +
                    this._values[2] + ']';
            },

            cLevels: function() { return 3; }

        });

        ClSymbolicWeight.clsZero = new ClSymbolicWeight(0, 0, 0);
        // FILE: EDU.Washington.grad.gjb.cassowary
        // package EDU.Washington.grad.gjb.cassowary;

        Object.subclass('ClStrength', 'default category', {

            /* FIELDS:
               private String _name
               private ClSymbolicWeight _symbolicWeight
            */
            initialize: function(name /*String*/, symbolicWeight, w2, w3) {
                this._name = name;
                if (symbolicWeight instanceof ClSymbolicWeight) {
                    this._symbolicWeight = symbolicWeight;
                } else {
                    this._symbolicWeight = new ClSymbolicWeight(symbolicWeight, w2, w3);
                }
            },

            isRequired: function() {
                return (this == ClStrength.required);
            },

            toString: function() {
                return this._name + (!this.isRequired() ?
                                     (':' + this.symbolicWeight()) :
                                     '');
            },

            symbolicWeight: function() {
                return this._symbolicWeight;
            },

            name: function() {
                return this._name;
            },
            set_name: function(name /*String*/) {
                this._name = name;
            },
            set_symbolicWeight: function(symbolicWeight) {
                this._symbolicWeight = symbolicWeight;
            }
        });

        /* public static final */
        ClStrength.required = new ClStrength('<Required>', 1000, 1000, 1000);
        /* public static final  */
        ClStrength.strong = new ClStrength('strong', 1.0, 0.0, 0.0);
        /* public static final  */
        ClStrength.medium = new ClStrength('medium', 0.0, 1.0, 0.0);
        /* public static final  */
        ClStrength.weak = new ClStrength('weak', 0.0, 0.0, 1.0);


        Object.subclass('ClAbstractVariable', 'default category', {
            initialize: function(a1, a2) {
                this.hash_code = ClAbstractVariable.iVariableNumber++;
                if (typeof(a1) == 'string' || (a1 == null)) {
                    this._name = a1 || 'v' + this.hash_code;
                } else {
                    var varnumber = a1, prefix = a2;
                    this._name = prefix + varnumber;
                }
            },

            hashCode: function() {
                return this.hash_code;
            },

            name: function() {
                return this._name;
            },

            setName: function(name) {
                this._name = name;
            },

            isDummy: function() {
                return false;
            },

            isExternal: function() {
                throw 'abstract isExternal';
            },

            isPivotable: function() {
                throw 'abstract isPivotable';
            },

            isRestricted: function() {
                throw 'abstract isRestricted';
            },

            toString: function() {
                return 'ABSTRACT[' + this._name + ']';
            }
        });

        ClAbstractVariable.iVariableNumber = 1;

        ClAbstractVariable.subclass('ClVariable', 'default category', {
            //Extends: ClAbstractVariable,
            initialize: function($super, name_or_val, value) {
                this._name = '';
                this._value = 0.0;
                if (typeof(name_or_val) == 'string') {
                    $super(name_or_val);
                    this._value = value || 0.0;
                } else if (typeof(name_or_val) == 'number') {
                    $super();
                    this._value = name_or_val;
                } else {
                    $super();
                }
                if (ClVariable._ourVarMap) {
                    ClVariable._ourVarMap[this._name] = this;
                }
            },  // (number, prefix, value)

            isDummy: function() {
                return false;
            },

            isExternal: function() {
                return true;
            },

            isPivotable: function() {
                return false;
            },

            isRestricted: function() {
                return false;
            },

            toString: function() {
                return '[' + this.name() + ':' + this._value + ']';
            },

            value: function() {
                return this._value;
            },

            set_value: function(value) {
                this._value = value;
            },

            change_value: function(value) {
                this._value = value;
            },

            setAttachedObject: function(o) {
                this._attachedObject = o;
            },

            getAttachedObject: function() {
                return this._attachedObject;
            }
        });


        /* static */
        ClVariable.setVarMap = function(map) {
            this._ourVarMap = map;
        };

        ClVariable.getVarMap = function(map) {
            return this._ourVarMap;
        };


        ClAbstractVariable.subclass('ClDummyVariable', 'default category', {
            //Extends: ClAbstractVariable,
            initialize: function($super, name_or_val, prefix) {
                $super(name_or_val, prefix);
            },

            isDummy: function() {
                return true;
            },

            isExternal: function() {
                return false;
            },

            isPivotable: function() {
                return false;
            },

            isRestricted: function() {
                return true;
            },

            toString: function() {
                return '[' + this.name() + ':dummy]';
            }
        });

        ClAbstractVariable.subclass('ClObjectiveVariable', 'default category', {
            //Extends: ClAbstractVariable,
            initialize: function($super, name_or_val, prefix) {
                $super(name_or_val, prefix);
            },

            isExternal: function() {
                return false;
            },

            isPivotable: function() {
                return false;
            },

            isRestricted: function() {
                return false;
            },

            toString: function() {
                return '[' + this.name() + ':obj]';
            }
        });


        ClAbstractVariable.subclass('ClSlackVariable', 'default category', {
            //Extends: ClAbstractVariable,
            initialize: function($super, name_or_val, prefix) {
                $super(name_or_val, prefix);
            },

            isExternal: function() {
                return false;
            },

            isPivotable: function() {
                return true;
            },

            isRestricted: function() {
                return true;
            },

            toString: function() {
                return '[' + this.name() + ':slack]';
            }
        });

        Object.subclass('ClPoint', 'default category', {
            initialize: function(x, y, suffix) {
                if (x instanceof ClVariable) {
                    this.x = x;
                } else {
                    if (suffix != null) {
                        this.x = new ClVariable('x' + suffix, x);
                    } else {
                        this.x = new ClVariable(x);
                    }
                }
                if (y instanceof ClVariable) {
                    this.y = y;
                } else {
                    if (suffix != null) {
                        this.y = new ClVariable('y' + suffix, y);
                    } else {
                        this.y = new ClVariable(y);
                    }
                }
            },

            SetXY: function(x, y) {
                if (x instanceof ClVariable) {
                    this.x = x;
                } else {
                    this.x.set_value(x);
                }
                if (y instanceof ClVariable) {
                    this.y = y;
                } else {
                    this.y.set_value(y);
                }
            },

            X: function() { return this.x; },

            Y: function() { return this.y; },

            Xvalue: function() {
                return this.x.value();
            },

            Yvalue: function() {
                return this.y.value();
            },

            toString: function() {
                return '(' + this.x + ', ' + this.y + ')';
            }
        });
        // FILE: EDU.Washington.grad.gjb.cassowary
        // package EDU.Washington.grad.gjb.cassowary;

        Object.subclass('ClLinearExpression', 'default category', {
            /* FIELDS:
               private ClDouble _constant
               private Hashtable _terms
            */
            initialize: function(clv, value, constant) {
                if (CL.fGC) print('new ClLinearExpression');
                this._constant = constant || 0;
                this._terms = new Hashtable();
                if (clv instanceof ClAbstractVariable) this._terms.put(clv, value || 1);
                else if (typeof(clv) == 'number') this._constant = clv;
            },

            initializeFromHash: function(constant, terms /*Hashtable*/) {
                if (CL.fGC) print('clone ClLinearExpression');
                this._constant = constant;
                this._terms = terms.clone();
                return this;
            },

            multiplyMe: function(x) {
                var that = this;
                this._constant *= x;
                this._terms.each(function(clv, coeff) {
                    that._terms.put(clv, coeff * x);
                });
                return this;
            },

            clone: function() {
                return new ClLinearExpression().
                    initializeFromHash(this._constant, this._terms);
            },

            times: function(x) {
                if (typeof(x) == 'number') {
                    return (this.clone()).multiplyMe(x);
                } else {
                    if (this.isConstant()) {
                        return x.times(this._constant);
                    } else if (x.isConstant()) {
                        return this.times(x._constant);
                    } else {
                        throw new ExCLNonlinearExpression();
                    }
                }
            },

            plus: function(expr) {
                if (expr instanceof ClLinearExpression) {
                    return this.clone().addExpression(expr, 1.0);
                } else if (expr instanceof ClVariable) {
                    return this.clone().addVariable(expr, 1.0);
                }
            },

            minus: function(expr) {
                if (expr instanceof ClLinearExpression) {
                    return this.clone().addExpression(expr, -1.0);
                } else if (expr instanceof ClVariable) {
                    return this.clone().addVariable(expr, -1.0);
                }
            },


            divide: function(x) {
                if (typeof(x) == 'number') {
                    if (CL.approx(x, 0.0)) {
                        throw new ExCLNonlinearExpression();
                    }
                    return this.times(1.0 / x);
                } else if (x instanceof ClLinearExpression) {
                    if (!x.isConstant) {
                        throw new ExCLNonlinearExpression();
                    }
                    return this.times(1.0 / x._constant);
                }
            },

            divFrom: function(expr) {
                if (!this.isConstant() || CL.approx(this._constant, 0.0)) {
                    throw new ExCLNonlinearExpression();
                }
                return x.divide(this._constant);
            },

            subtractFrom: function(expr) {
                return expr.minus(this);
            },

            addExpression: function(expr, n, subject, solver) {
                if (expr instanceof ClAbstractVariable) {
                    expr = new ClLinearExpression(expr);
                    print('addExpression: Had to cast a var to an expression');
                }
                this.incrementConstant(n * expr.constant());
                n = n || 1;
                var that = this;
                expr.terms().each(function(clv, coeff) {
                    that.addVariable(clv, coeff * n, subject, solver);
                });
                return this;
            },

            addVariable: function(v, c, subject, solver) {
                c = c || 1.0;
                if (CL.fTraceOn) {
                    CL.fnenterprint('CLE: addVariable:' + v + ', ' + c);
                }
                coeff = this._terms.get(v);
                if (coeff) {
                    new_coefficient = coeff + c;
                    if (CL.approx(new_coefficient, 0.0)) {
                        if (solver) {
                            solver.noteRemovedVariable(v, subject);
                        }
                        this._terms.remove(v);
                    } else {
                        this._terms.put(v, new_coefficient);
                    }
                } else {
                    if (!CL.approx(c, 0.0)) {
                        this._terms.put(v, c);
                        if (solver) {
                            solver.noteAddedVariable(v, subject);
                        }
                    }
                }
                return this;
            },

            setVariable: function(v, c) {
                this._terms.put(v, c);
                return this;
            },

            anyPivotableVariable: function() {
                if (this.isConstant()) {
                    throw new ExCLInternalError(
                        'anyPivotableVariable called on a constant'
                    );
                }

                var pivotable = null;
                try {
                    this._terms.each(function(clv, c) {
                        if (clv.isPivotable()) {
                            pivotable = clv;
                            throw 'NLR';
                        }
                    });
                } catch (e) {
                    if (e === 'NLR') {
                        return pivotable;
                    } else {
                        throw e;
                    }
                }
                return null;
            },

            substituteOut: function(outvar, expr, subject, solver) {
                var that = this;
                if (CL.fTraceOn) {
                    CL.fnenterprint('CLE:substituteOut: ' + outvar + ', ' +
                                    expr + ', ' + subject + ', ...');
                    CL.traceprint('this = ' + this);
                }
                var multiplier = this._terms.remove(outvar);
                this.incrementConstant(multiplier * expr.constant());
                expr.terms().each(function(clv, coeff) {
                    var old_coeff = that._terms.get(clv);
                    if (old_coeff) {
                        var newCoeff = old_coeff + multiplier * coeff;
                        if (CL.approx(newCoeff, 0.0)) {
                            solver.noteRemovedVariable(clv, subject);
                            that._terms.remove(clv);
                        } else {
                            that._terms.put(clv, newCoeff);
                        }
                    } else {
                        that._terms.put(clv, multiplier * coeff);
                        solver.noteAddedVariable(clv, subject);
                    }
                });
                if (CL.fTraceOn) CL.traceprint('Now this is ' + this);
            },

            changeSubject: function(old_subject, new_subject) {
                this._terms.put(old_subject, this.newSubject(new_subject));
            },

            newSubject: function(subject) {
                if (CL.fTraceOn) CL.fnenterprint('newSubject:' + subject);

                var reciprocal = 1.0 / this._terms.remove(subject);
                this.multiplyMe(-reciprocal);
                return reciprocal;
            },

            coefficientFor: function(clv) {
                return this._terms.get(clv) || 0;
            },

            constant: function() {
                return this._constant;
            },

            set_constant: function(c) {
                this._constant = c;
            },

            terms: function() {
                return this._terms;
            },

            incrementConstant: function(c) {
                this._constant += c;
            },

            isConstant: function() {
                return this._terms.size() == 0;
            },

            toString: function() {
                var bstr = ''; // answer
                var needsplus = false;
                if (!CL.approx(this._constant, 0.0) || this.isConstant()) {
                    bstr += this._constant;
                    if (this.isConstant()) {
                        return bstr;
                    } else {
                        needsplus = true;
                    }
                }
                this._terms.each(function(clv, coeff) {
                    if (needsplus) {
                        bstr += ' + ';
                    }
                    bstr += coeff + '*' + clv;
                    needsplus = true;
                });
                return bstr;
            },

            Plus: function(e1, e2) {
                return e1.plus(e2);
            },
            Minus: function(e1, e2) {
                return e1.minus(e2);
            },
            Times: function(e1, e2) {
                return e1.times(e2);
            },
            Divide: function(e1, e2) {
                return e1.divide(e2);
            }
        });


        // FILE: EDU.Washington.grad.gjb.cassowary
        // package EDU.Washington.grad.gjb.cassowary;
        // Has ClConstraint <- ClEditOrStayConstraint
        // and     ClEditConstraint, ClStayConstraint
        // Linear constraints are in ClLinearConstraint.js


        Object.subclass('ClConstraint', 'default category', {
            /* FIELDS:
               var _strength
               var _weight
               var _attachedObject
               var _times_added
            */
            initialize: function(strength, weight) {
                this.hash_code = ClConstraint.iConstraintNumber++;
                this._strength = strength || ClStrength.required;
                this._weight = weight || 1.0;
                this._times_added = 0;
            },
            // abstract expression()

            hashCode: function() {
                return this.hash_code;
            },

            isEditConstraint: function() {
                return false;
            },

            isInequality: function() {
                return false;
            },

            isRequired: function() {
                return this._strength.isRequired();
            },

            isStayConstraint: function() {
                return false;
            },

            strength: function() {
                return this._strength;
            },

            weight: function() {
                return this._weight;
            },

            toString: function() {
                // this is abstract -- it intentionally leaves the
                // parens unbalanced for the subclasses to complete
                // (e.g., with ' = 0', etc.
                return this._strength + ' {' + this._weight + '} (' +
                    this.expression() + ')';
            },

            setAttachedObject: function(o /*Object*/) {
                this._attachedObject = o;
            },

            getAttachedObject: function() {
                return this._attachedObject;
            },

            changeStrength: function(strength) {
                if (this._times_added == 0) {
                    this.setStrength(strength);
                } else {
                    throw new ExCLTooDifficult();
                }
            },

            addedTo: function(solver) {
                ++this._times_added;
            },

            removedFrom: function(solver) {
                --this._times_added;
            },

            setStrength: function(strength) {
                this._strength = strength;
            },

            setWeight: function(weight) {
                this._weight = weight;
            }
        });


        ClConstraint.subclass('ClEditOrStayConstraint', 'default category', {
            //Extends: ClConstraint,
            /* FIELDS:
               var _variable
               var _expression
            */
            initialize: function($super, clv, strength, weight) {
                $super(strength, weight);
                this._variable = clv;
                this._expression = new ClLinearExpression(this._variable, -1.0,
                                                          this._variable.value());
            },

            variable: function() {
                return this._variable;
            },

            expression: function() {
                return this._expression;
            },

            setVariable: function(v) {
                this._variable = v;
            }
        });


        ClEditOrStayConstraint.subclass('ClEditConstraint', 'default category', {
            //Extends: ClEditOrStayConstraint,

            initialize: function($super, clv, strength, weight) {
                $super(clv, strength, weight);
            },

            isEditConstraint: function() {
                return true;
            },

            toString: function() {
                return 'edit' + $super();
            }
        });

        ClEditOrStayConstraint.subclass('ClStayConstraint', 'default category', {
            //Extends: ClEditOrStayConstraint,

            initialize: function($super, clv, strength, weight) {
                $super(clv, strength || ClStrength.weak, weight);
            },

            isStayConstraint: function() {
                return true;
            },

            toString: function() {
                return 'stay ' + $super();
            }
        });

        ClConstraint.iConstraintNumber = 1;

        // ABSTRACT
        ClConstraint.subclass('ClLinearConstraint', 'default category', {
            //Extends: ClConstraint,
            /* FIELDS:
               var _expression
            */
            initialize: function($super, cle, strength, weight) {
                $super(strength, weight);
                this._expression = cle;
            },

            expression: function() {
                return this._expression;
            },

            setExpression: function(expr) {
                this._expression = expr;
            }
        });


        ClLinearConstraint.subclass('ClLinearInequality', 'default category', {
            // Extends: ClLinearConstraint,

            initialize: function($super, a1, a2, a3, a4, a5) {
                if (a1 instanceof ClLinearExpression &&
                    a3 instanceof ClAbstractVariable) {
                    var cle = a1, op = a2, clv = a3, strength = a4, weight = a5;
                    $super(cle.clone(), strength, weight);
                    if (op == CL.LEQ) {
                        this._expression.multiplyMe(-1);
                        this._expression.addVariable(clv);
                    } else if (op == CL.GEQ) {
                        this._expression.addVariable(clv, -1);
                    } else {
                        throw new ExCLInternalError(
                            'Invalid operator in ClLinearInequality constructor'
                        );
                    }
                } else if (a1 instanceof ClLinearExpression) {
                    return $super(a1, a2, a3);
                } else if (a2 == CL.GEQ) {
                    $super(new ClLinearExpression(a3), a4, a5);
                    this._expression.multiplyMe(-1.0);
                    this._expression.addVariable(a1);
                } else if (a2 == CL.LEQ) {
                    $super(new ClLinearExpression(a3), a4, a5);
                    this._expression.addVariable(a1, -1.0);
                } else {
                    throw new ExCLInternalError(
                        'Invalid operator in ClLinearInequality constructor'
                    );
                }
            },

            isInequality: function() {
                return true;
            },

            toString: function($super) {
                return $super() + ' >= 0)';
            }
        });


        ClLinearConstraint.subclass('ClLinearEquation', 'default category', {
            //Extends: ClLinearConstraint,

            initialize: function($super, a1, a2, a3, a4) {
                if (a1 instanceof ClLinearExpression &&
                    !a2 ||
                    a2 instanceof ClStrength) {
                    $super(a1, a2, a3);
                } else if ((a1 instanceof ClAbstractVariable) &&
                           (a2 instanceof ClLinearExpression)) {
                    var clv = a1, cle = a2, strength = a3, weight = a4;
                    $super(cle, strength, weight);
                    this._expression.addVariable(clv, -1);
                } else if ((a1 instanceof ClAbstractVariable) &&
                           (typeof(a2) == 'number')) {
                    var clv = a1, val = a2, strength = a3, weight = a4;
                    $super(new ClLinearExpression(val), strength, weight);
                    this._expression.addVariable(clv, -1);
                } else if ((a1 instanceof ClLinearExpression) &&
                           (a2 instanceof ClAbstractVariable)) {
                    var cle = a1, clv = a2, strength = a3, weight = a4;
                    $super(cle.clone(), strength, weight);
                    this._expression.addVariable(clv, -1);
                } else if (((a1 instanceof ClLinearExpression) ||
                            (a1 instanceof ClAbstractVariable) ||
                            (typeof(a1) == 'number')) &&
                           ((a2 instanceof ClLinearExpression) ||
                            (a2 instanceof ClAbstractVariable) ||
                            (typeof(a2) == 'number'))) {
                    if (a1 instanceof ClLinearExpression) {
                        a1 = a1.clone();
                    } else {
                        a1 = new ClLinearExpression(a1);
                    }
                    if (a2 instanceof ClLinearExpression) {
                        a2 = a2.clone();
                    } else {
                        a2 = new ClLinearExpression(a2);
                    }
                    $super(a1, a3, a4);
                    this._expression.addExpression(a2, -1);
                } else {
                    throw 'Bad initializer to ClLinearEquation';
                }
                CL.Assert(this._strength instanceof ClStrength, '_strength not set');
            },

            toString: function() {
                return $super() + ' = 0)';
            }
        });

        Object.subclass('ClEditInfo', 'default category', {
            /* FIELDS:
               var cn //ClConstraint
               var clvEditPlus //ClSlackVariable
               var clvEditMinus //ClSlackVariable
               var prevEditConstant //double
               var i //int
            */
            initialize: function(cn_, eplus_, eminus_, prevEditConstant_, i_) {
                this.cn = cn_;
                this.clvEditPlus = eplus_;
                this.clvEditMinus = eminus_;
                this.prevEditConstant = prevEditConstant_;
                this.i = i_;
            },
            Index: function() {
                return this.i;
            },
            Constraint: function() {
                return this.cn;
            },
            ClvEditPlus: function() {
                return this.clvEditPlus;
            },
            ClvEditMinus: function() {
                return this.clvEditMinus;
            },
            PrevEditConstant: function() {
                return this.prevEditConstant;
            },
            SetPrevEditConstant: function(prevEditConstant_) {
                this.prevEditConstant = prevEditConstant_;
            },

            toString: function() {
                return '<cn=' + this.cn + ',ep=' + this.clvEditPlus + ',em=' +
                    this.clvEditMinus + ',pec=' + this.prevEditConstant + ',i=' + i + '>';
            }
        });

        Object.subclass('ClTableau', 'default category', {
            /* FIELDS:
               var _columns //Hashtable of vars -> set of vars
               var _rows //Hashtable of vars -> expr
               var _infeasibleRows //Set of vars
               var _externalRows //Set of vars
               var _externalParametricVars //Set of vars
            */
            initialize: function() {
                this._columns = new Hashtable(); // values are sets
                this._rows = new Hashtable(); // values are ClLinearExpressions
                this._infeasibleRows = new HashSet();
                this._externalRows = new HashSet();
                this._externalParametricVars = new HashSet();
            },
            noteRemovedVariable: function(v, subject) {
                if (CL.fVerboseTraceOn) {
                    CL.fnenterprint('noteRemovedVariable: ' + v + ', ' + subject);
                }
                if (subject != null) {
                    this._columns.get(v).remove(subject);
                }
            },
            noteAddedVariable: function(v, subject) {
                if (CL.fVerboseTraceOn) {
                    CL.fnenterprint('noteAddedVariable: ' + v + ', ' + subject);
                }
                if (subject) {
                    this.insertColVar(v, subject);
                }
            },
            getInternalInfo: function() {
                var retstr = 'Tableau Information:\n';
                retstr += 'Rows: ' + this._rows.size();
                retstr += ' (= ' + (this._rows.size() - 1) + ' constraints)';
                retstr += '\nColumns: ' + this._columns.size();
                retstr += '\nInfeasible Rows: ' + this._infeasibleRows.size();
                retstr += '\nExternal basic variables: ' + this._externalRows.size();
                retstr += '\nExternal parametric variables: ';
                retstr += this._externalParametricVars.size();
                retstr += '\n';
                return retstr;
            },
            toString: function() {
                var bstr = 'Tableau:\n';
                this._rows.each(function(clv, expr) {
                    bstr += clv;
                    bstr += ' <==> ';
                    bstr += expr;
                    bstr += '\n';
                });
                bstr += '\nColumns:\n';
                bstr += CL.hashToString(this._columns);
                bstr += '\nInfeasible rows: ';
                bstr += CL.setToString(this._infeasibleRows);
                bstr += 'External basic variables: ';
                bstr += CL.setToString(this._externalRows);
                bstr += 'External parametric variables: ';
                bstr += CL.setToString(this._externalParametricVars);
                return bstr;
            },

            // Convenience function to insert a variable into
            // the set of rows stored at _columns[param_var],
            // creating a new set if needed
            insertColVar: function(param_var, rowvar) {
                var rowset = /* Set */this._columns.get(param_var);
                if (!rowset)
                    this._columns.put(param_var, rowset = new HashSet());
                rowset.add(rowvar);
                //    print("rowvar =" + rowvar);
                //    print("rowset = " + CL.setToString(rowset));
                //    print("this._columns = " + CL.hashToString(this._columns));
            },

            addRow: function(aVar, expr) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('addRow: ' + aVar + ', ' + expr);
                this._rows.put(aVar, expr);
                expr.terms().each(function(clv, coeff) {
                    //      print("insertColVar(" + clv + ", " + aVar + ")");
                    that.insertColVar(clv, aVar);
                    if (clv.isExternal()) {
                        that._externalParametricVars.add(clv);
                        // print("External parametric variables added to: " +
                        //        CL.setToString(that._externalParametricVars));
                    }
                });
                if (aVar.isExternal()) {
                    this._externalRows.add(aVar);
                }
                if (CL.fTraceOn) CL.traceprint(this.toString());
            },

            removeColumn: function(aVar) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('removeColumn:' + aVar);
                var rows = /* Set */ this._columns.remove(aVar);
                if (rows) {
                    rows.each(function(clv) {
                        var expr = /* ClLinearExpression */that._rows.get(clv);
                        expr.terms().remove(aVar);
                    });
                } else if (CL.fTraceOn) {
                    CL.debugprint('Could not find var ' + aVar + ' in _columns');
                }
                if (aVar.isExternal()) {
                    this._externalRows.remove(aVar);
                    this._externalParametricVars.remove(aVar);
                }
            },
            removeRow: function(aVar) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('removeRow:' + aVar);
                var expr = /* ClLinearExpression */this._rows.get(aVar);
                CL.Assert(expr != null);
                expr.terms().each(function(clv, coeff) {
                    var varset = that._columns.get(clv);
                    if (varset != null) {
                        if (CL.fTraceOn) CL.debugprint('removing from varset ' + aVar);
                        varset.remove(aVar);
                    }
                });
                this._infeasibleRows.remove(aVar);
                if (aVar.isExternal()) {
                    this._externalRows.remove(aVar);
                }
                this._rows.remove(aVar);
                if (CL.fTraceOn) CL.fnexitprint('returning ' + expr);
                return expr;
            },
            substituteOut: function(oldVar, expr) {
                var that = this;
                if (CL.fTraceOn) {
                    CL.fnenterprint('substituteOut:' + oldVar + ', ' + expr);
                    CL.traceprint(this.toString());
                }
                var varset = /* Set */this._columns.get(oldVar);
                varset.each(function(v) {
                    var row = /* ClLinearExpression */that._rows.get(v);
                    row.substituteOut(oldVar, expr, v, that);
                    if (v.isRestricted() && row.constant() < 0.0) {
                        that._infeasibleRows.add(v);
                    }
                });
                if (oldVar.isExternal()) {
                    this._externalRows.add(oldVar);
                    this._externalParametricVars.remove(oldVar);
                }
                this._columns.remove(oldVar);
            },
            columns: function() {
                return this._columns;
            },
            rows: function() {
                return this._rows;
            },
            columnsHasKey: function(subject) {
                return (this._columns.get(subject) != null);
            },
            rowExpression: function(v) {
                return /* ClLinearExpression */this._rows.get(v);
            }
        });



        ClTableau.subclass('ClSimplexSolver', 'default category', {
            //Extends: ClTableau,
            /* FIELDS:
               var _stayMinusErrorVars //Vector
               var _stayPlusErrorVars //Vector
               var _errorVars //Hashtable
               var _markerVars //Hashtable
               var _objective //ClObjectiveVariable
               var _editVarMap //Hashtable
               var _slackCounter //long
               var _artificialCounter //long
               var _dummyCounter //long
               var _resolve_pair //Vector
               var _epsilon //double
               var _fOptimizeAutomatically //boolean
               var _fNeedsSolving //boolean
               var _stkCedcns //Stack
            */
            initialize: function($super) {
                $super();
                this._stayMinusErrorVars = new Array();
                this._stayPlusErrorVars = new Array();
                this._errorVars = new Hashtable(); // cn -> Set of clv
                this._markerVars = new Hashtable(); // cn -> Set of clv
                this._resolve_pair = new Array(0, 0);
                this._objective = new ClObjectiveVariable('Z');
                this._editVarMap = new Hashtable(); // clv -> ClEditInfo
                this._slackCounter = 0;
                this._artificialCounter = 0;
                this._dummyCounter = 0;
                this._epsilon = 1e-8;
                this._fOptimizeAutomatically = true;
                this._fNeedsSolving = false;
                this._rows = new Hashtable(); // clv -> expression
                this._rows.put(this._objective, new ClLinearExpression());
                this._stkCedcns = new Array(); // Stack
                this._stkCedcns.push(0);
                if (CL.fTraceOn) {
                    CL.traceprint('objective expr == ' +
                                  this.rowExpression(this._objective));
                }
            },
            addLowerBound: function(v, lower) {
                var cn = new ClLinearInequality(v, CL.GEQ, new ClLinearExpression(lower));
                return this.addConstraint(cn);
            },
            addUpperBound: function(v, upper) {
                var cn = new ClLinearInequality(v, CL.LEQ, new ClLinearExpression(upper));
                return this.addConstraint(cn);
            },
            addBounds: function(v, lower, upper) {
                this.addLowerBound(v, lower);
                this.addUpperBound(v, upper);
                return this;
            },
            addConstraint: function(cn) {
                if (CL.fTraceOn) CL.fnenterprint('addConstraint: ' + cn);
                var eplus_eminus = new Array(2);
                var prevEConstant = new Array(1); // so it can be output to
                var expr = this.newExpression(cn, eplus_eminus, prevEConstant);
                prevEConstant = prevEConstant[0];
                var fAddedOkDirectly = false;
                fAddedOkDirectly = this.tryAddingDirectly(expr);
                if (!fAddedOkDirectly) {
                    this.addWithArtificialVariable(expr);
                }
                this._fNeedsSolving = true;
                if (cn.isEditConstraint()) {
                    var i = this._editVarMap.size();
                    var clvEplus = eplus_eminus[0];
                    var clvEminus = eplus_eminus[1];
                    if (!clvEplus instanceof ClSlackVariable) {
                        print('clvEplus not a slack variable = ' + clvEplus);
                    }
                    if (!clvEminus instanceof ClSlackVariable) {
                        print('clvEminus not a slack variable = ' + clvEminus);
                    }
                    this._editVarMap.put(
                        cn.variable(),
                        new ClEditInfo(cn, clvEplus, clvEminus, prevEConstant, i)
                    );
                }
                if (this._fOptimizeAutomatically) {
                    this.optimize(this._objective);
                    this.setExternalVariables();
                }
                cn.addedTo(this);
                return cn;
            },
            addConstraintNoException: function(cn) {
                if (CL.fTraceOn) CL.fnenterprint('addConstraintNoException: ' + cn);
                try {
                    this.addConstraint(cn);
                    return true;
                }
                catch (e) {
                    return false;
                }
            },
            addEditVar: function(v, strength) {
                if (CL.fTraceOn) CL.fnenterprint('addEditVar: ' + v + ' @ ' + strength);
                strength = strength || ClStrength.strong;
                var cnEdit = new ClEditConstraint(v, strength);
                return this.addConstraint(cnEdit);
            },
            removeEditVar: function(v) {
                var cei = this._editVarMap.get(v);
                var cn = cei.Constraint();
                this.removeConstraint(cn);
                return this;
            },
            beginEdit: function() {
                this.solve();
                CL.Assert(this._editVarMap.size() > 0, '_editVarMap.size() > 0');
                this._infeasibleRows.clear();
                this.resetStayConstants();
                this._stkCedcns.push(this._editVarMap.size());
                return this;
            },
            endEdit: function() {
                CL.Assert(this._editVarMap.size() > 0, '_editVarMap.size() > 0');
                this.resolve();
                this._stkCedcns.pop();
                var n = this._stkCedcns[this._stkCedcns.length - 1]; // top
                this.removeEditVarsTo(n);
                return this;
            },
            removeAllEditVars: function() {
                return this.removeEditVarsTo(0);
            },
            removeEditVarsTo: function(n) {
                try {
                    var that = this;
                    this._editVarMap.each(function(v, cei) {
                        if (cei.Index() >= n) {
                            that.removeEditVar(v);
                        }
                    });
                    CL.Assert(this._editVarMap.size() == n, '_editVarMap.size() == n');
                    return this;
                }
                catch (e) {
                    throw new ExCLInternalError(
                        'Constraint not found in removeEditVarsTo'
                    );
                }
            },
            addPointStays: function(listOfPoints) {
                if (CL.fTraceOn) CL.fnenterprint('addPointStays' + listOfPoints);
                var weight = 1.0;
                var multiplier = 2.0;
                for (var i = 0; i < listOfPoints.length; i++)
                {
                    this.addPointStay(listOfPoints[i], weight);
                    weight *= multiplier;
                }
                return this;
            },
            addPointStay: function(a1, a2, a3) {
                if (a1 instanceof ClPoint) {
                    var clp = a1, weight = a2;
                    this.addStay(clp.X(), ClStrength.weak, weight || 1.0);
                    this.addStay(clp.Y(), ClStrength.weak, weight || 1.0);
                } else { //
                    var vx = a1, vy = a2, weight = a3;
                    this.addStay(vx, ClStrength.weak, weight || 1.0);
                    this.addStay(vy, ClStrength.weak, weight || 1.0);
                }
                return this;
            },
            addStay: function(v, strength, weight) {
                var cn = new ClStayConstraint(
                    v,
                    strength || ClStrength.weak,
                    weight || 1.0
                );
                return this.addConstraint(cn);
            },
            removeConstraint: function(cn) {
                this.removeConstraintInternal(cn);
                cn.removedFrom(this);
                return this;
            },
            removeConstraintInternal: function(cn) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('removeConstraint: ' + cn);
                if (CL.fTraceOn) CL.traceprint(this.toString());
                this._fNeedsSolving = true;
                this.resetStayConstants();
                var zRow = this.rowExpression(this._objective);
                var eVars = this._errorVars.get(cn);
                if (CL.fTraceOn) CL.traceprint('eVars == ' + CL.setToString(eVars));
                if (eVars != null) {
                    eVars.each(function(clv) {
                        var expr = that.rowExpression(clv);
                        if (expr == null) {
                            zRow.addVariable(
                                clv,
                                -cn.weight() * cn.strength().symbolicWeight().toDouble(),
                                that._objective,
                                that
                            );
                        } else {
                            zRow.addExpression(
                                expr,
                                -cn.weight() * cn.strength().symbolicWeight().toDouble(),
                                that._objective,
                                that
                            );
                        }
                        if (CL.fTraceOn) {
                            CL.traceprint('now eVars == ' + CL.setToString(eVars));
                        }
                    });
                }
                var marker = this._markerVars.remove(cn);
                if (marker == null) {
                    throw new ExCLConstraintNotFound();
                }
                if (CL.fTraceOn) CL.traceprint('Looking to remove var ' + marker);
                if (this.rowExpression(marker) == null) {
                    var col = this._columns.get(marker);
                    if (CL.fTraceOn) CL.traceprint('Must pivot -- columns are ' + col);
                    var exitVar = null;
                    var minRatio = 0.0;
                    col.each(function(v) {
                        if (v.isRestricted()) {
                            var expr = that.rowExpression(v);
                            var coeff = expr.coefficientFor(marker);
                            if (that.fTraceOn) {
                                that.traceprint(
                                    'Marker ' + marker + "'s coefficient in " +
                                        expr + ' is ' + coeff
                                );
                            }
                            if (coeff < 0.0) {
                                var r = -expr.constant() / coeff;
                                if (exitVar == null ||
                                    r < minRatio ||
                                    (CL.approx(r, minRatio) &&
                                     v.hashCode() < exitVar.hashCode())) {
                                    minRatio = r;
                                    exitVar = v;
                                }
                            }
                        }
                    });
                    if (exitVar == null) {
                        if (CL.fTraceOn) CL.traceprint('exitVar is still null');
                        col.each(function(v) {
                            if (v.isRestricted()) {
                                var expr = that.rowExpression(v);
                                var coeff = expr.coefficientFor(marker);
                                var r = expr.constant() / coeff;
                                if (exitVar == null || r < minRatio) {
                                    minRatio = r;
                                    exitVar = v;
                                }
                            }
                        });
                    }
                    if (exitVar == null) {
                        if (col.size() == 0) {
                            this.removeColumn(marker);
                        }
                        else {
                            col.escapingEach(function(v) {
                                if (v != that._objective) {
                                    exitVar = v;
                                    return {brk: true};
                                }
                            });
                        }
                    }
                    if (exitVar != null) {
                        this.pivot(marker, exitVar);
                    }
                }
                if (this.rowExpression(marker) != null) {
                    var expr = this.removeRow(marker);
                    expr = null;
                }
                if (eVars != null) {
                    eVars.each(function(v) {
                        if (v != marker) {
                            that.removeColumn(v);
                            v = null;
                        }
                    });
                }
                if (cn.isStayConstraint()) {
                    if (eVars != null) {
                        for (var i = 0; i < this._stayPlusErrorVars.length; i++)
                        {
                            eVars.remove(this._stayPlusErrorVars[i]);
                            eVars.remove(this._stayMinusErrorVars[i]);
                        }
                    }
                }
                else if (cn.isEditConstraint()) {
                    CL.Assert(eVars != null, 'eVars != null');
                    var cnEdit = cn;
                    var clv = cnEdit.variable();
                    var cei = this._editVarMap.get(clv);
                    var clvEditMinus = cei.ClvEditMinus();
                    this.removeColumn(clvEditMinus);
                    this._editVarMap.remove(clv);
                }
                if (eVars != null) {
                    this._errorVars.remove(eVars);
                }
                marker = null;
                if (this._fOptimizeAutomatically) {
                    this.optimize(this._objective);
                    this.setExternalVariables();
                }
                return this;
            },
            reset: function() {
                if (CL.fTraceOn) CL.fnenterprint('reset');
                throw new ExCLInternalError('reset not implemented');
            },
            resolveArray: function(newEditConstants) {
                if (CL.fTraceOn) CL.fnenterprint('resolveArray' + newEditConstants);
                var that = this;
                this._editVarMap.each(function(v, cei) {
                    var i = cei.Index();
                    if (i < newEditConstants.length) {
                        that.suggestValue(v, newEditConstants[i]);
                    }
                });
                this.resolve();
            },
            resolvePair: function(x, y) {
                this._resolve_pair[0] = x;
                this._resolve_pair[1] = y;
                this.resolveArray(this._resolve_pair);
            },

            resolve: function() {
                if (CL.fTraceOn) CL.fnenterprint('resolve()');
                this.dualOptimize();
                this.setExternalVariables();
                this._infeasibleRows.clear();
                this.resetStayConstants();
            },

            suggestValue: function(v, x) {
                if (CL.fTraceOn) {
                    CL.fnenterprint('suggestValue(' + v + ', ' + x + ')');
                }
                var cei = this._editVarMap.get(v);
                if (cei == null) {
                    print('suggestValue for variable ' + v +
                          ', but var is not an edit variable\n');
                    throw new ExCLError();
                }
                var i = cei.Index();
                var clvEditPlus = cei.ClvEditPlus();
                var clvEditMinus = cei.ClvEditMinus();
                var delta = x - cei.PrevEditConstant();
                cei.SetPrevEditConstant(x);
                this.deltaEditConstant(delta, clvEditPlus, clvEditMinus);
                return this;
            },
            setAutosolve: function(f) {
                this._fOptimizeAutomatically = f;
                return this;
            },
            FIsAutosolving: function() {
                return this._fOptimizeAutomatically;
            },
            solve: function() {
                if (this._fNeedsSolving) {
                    this.optimize(this._objective);
                    this.setExternalVariables();
                }
                return this;
            },
            setEditedValue: function(v, n) {
                if (!this.FContainsVariable(v)) {
                    v.change_value(n);
                    return this;
                }
                if (!CL.approx(n, v.value())) {
                    this.addEditVar(v);
                    this.beginEdit();
                    try {
                        this.suggestValue(v, n);
                    }
                    catch (e) {
                        throw new ExCLInternalError('Error in setEditedValue');
                    }
                    this.endEdit();
                }
                return this;
            },
            FContainsVariable: function(v) {
                return this.columnsHasKey(v) || (this.rowExpression(v) != null);
            },
            addVar: function(v) {
                if (!this.FContainsVariable(v)) {
                    try {
                        this.addStay(v);
                    }
                    catch (e) {
                        throw new ExCLInternalError(
                            'Error in addVar -- required failure is impossible'
                        );
                    }
                    if (CL.fTraceOn) {
                        CL.traceprint('added initial stay on ' + v);
                    }
                }
                return this;
            },
            getInternalInfo: function($super) {
                var retstr = $super();
                retstr += '\nSolver info:\n';
                retstr += 'Stay Error Variables: ';
                retstr += this._stayPlusErrorVars.length +
                    this._stayMinusErrorVars.length;
                retstr += ' (' + this._stayPlusErrorVars.length + ' +, ';
                retstr += this._stayMinusErrorVars.length + ' -)\n';
                retstr += 'Edit Variables: ' + this._editVarMap.size();
                retstr += '\n';
                return retstr;
            },
            getDebugInfo: function() {
                var bstr = this.toString();
                bstr += this.getInternalInfo();
                bstr += '\n';
                return bstr;
            },
            toString: function($super) {
                var bstr = $super();
                bstr += '\n_stayPlusErrorVars: ';
                bstr += '[' + this._stayPlusErrorVars + ']';
                bstr += '\n_stayMinusErrorVars: ';
                bstr += '[' + this._stayMinusErrorVars + ']';
                bstr += '\n';
                bstr += '_editVarMap:\n' + CL.hashToString(this._editVarMap);
                bstr += '\n';
                return bstr;
            },
            getConstraintMap: function() {
                return this._markerVars;
            },
            addWithArtificialVariable: function(expr) {
                if (CL.fTraceOn) {
                    CL.fnenterprint('addWithArtificialVariable: ' + expr);
                }
                var av = new ClSlackVariable(++this._artificialCounter, 'a');
                var az = new ClObjectiveVariable('az');
                var azRow = /* ClLinearExpression */expr.clone();
                if (CL.fTraceOn) CL.traceprint('before addRows:\n' + this);
                this.addRow(az, azRow);
                this.addRow(av, expr);
                if (CL.fTraceOn) CL.traceprint('after addRows:\n' + this);
                this.optimize(az);
                var azTableauRow = this.rowExpression(az);
                if (CL.fTraceOn) {
                    CL.traceprint('azTableauRow.constant() == ' +
                                  azTableauRow.constant());
                }
                if (!CL.approx(azTableauRow.constant(), 0.0)) {
                    this.removeRow(az);
                    this.removeColumn(av);
                    throw new ExCLRequiredFailure();
                }
                var e = this.rowExpression(av);
                if (e != null) {
                    if (e.isConstant()) {
                        this.removeRow(av);
                        this.removeRow(az);
                        return;
                    }
                    var entryVar = e.anyPivotableVariable();
                    this.pivot(entryVar, av);
                }
                CL.Assert(this.rowExpression(av) == null, 'rowExpression(av) == null');
                this.removeColumn(av);
                this.removeRow(az);
            },
            tryAddingDirectly: function(expr) {
                if (CL.fTraceOn) CL.fnenterprint('tryAddingDirectly: ' + expr);
                var subject = this.chooseSubject(expr);
                if (subject == null) {
                    if (CL.fTraceOn) CL.fnexitprint('returning false');
                    return false;
                }
                expr.newSubject(subject);
                if (this.columnsHasKey(subject)) {
                    this.substituteOut(subject, expr);
                }
                this.addRow(subject, expr);
                if (CL.fTraceOn) CL.fnexitprint('returning true');
                return true;
            },
            chooseSubject: function(expr) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('chooseSubject: ' + expr);
                var subject = null;
                var foundUnrestricted = false;
                var foundNewRestricted = false;
                var terms = expr.terms();
                var rv = terms.escapingEach(function(v, c) {
                    if (foundUnrestricted) {
                        if (!v.isRestricted()) {
                            if (!that.columnsHasKey(v)) {
                                return {retval: v};
                            }
                        }
                    } else {
                        if (v.isRestricted()) {
                            if (!foundNewRestricted && !v.isDummy() && c < 0.0) {
                                var col = that._columns.get(v);
                                if (col == null ||
                                    (col.size() == 1 &&
                                     that.columnsHasKey(that._objective))) {
                                    subject = v;
                                    foundNewRestricted = true;
                                }
                            }
                        } else {
                            subject = v;
                            foundUnrestricted = true;
                        }
                    }
                });
                if (rv !== undefined) return rv;

                if (subject != null)
                    return subject;

                var coeff = 0.0;

                // subject is nil.
                // Make one last check -- if all of the variables in expr are dummy
                // variables, then we can pick a dummy variable as the subject
                var rv = terms.escapingEach(function(v, c) {
                    if (!v.isDummy()) {
                        return {retval: null};
                    }
                    if (!that.columnsHasKey(v)) {
                        subject = v;
                        coeff = c;
                    }
                });
                if (rv !== undefined) return rv;

                if (!CL.approx(expr.constant(), 0.0)) {
                    throw new ExCLRequiredFailure();
                }
                if (coeff > 0.0) {
                    expr.multiplyMe(-1);
                }
                return subject;
            },

            deltaEditConstant: function(delta, plusErrorVar, minusErrorVar) {
                var that = this;
                if (CL.fTraceOn) {
                    CL.fnenterprint('deltaEditConstant :' + delta + ', ' +
                                    plusErrorVar + ', ' + minusErrorVar);
                }
                var exprPlus = this.rowExpression(plusErrorVar);
                if (exprPlus != null) {
                    exprPlus.incrementConstant(delta);
                    if (exprPlus.constant() < 0.0) {
                        this._infeasibleRows.add(plusErrorVar);
                    }
                    return;
                }
                var exprMinus = this.rowExpression(minusErrorVar);
                if (exprMinus != null) {
                    exprMinus.incrementConstant(-delta);
                    if (exprMinus.constant() < 0.0) {
                        this._infeasibleRows.add(minusErrorVar);
                    }
                    return;
                }
                var columnVars = this._columns.get(minusErrorVar);
                if (!columnVars) {
                    print('columnVars is null -- tableau is:\n' + this);
                }
                columnVars.each(function(basicVar) {
                    var expr = that.rowExpression(basicVar);
                    var c = expr.coefficientFor(minusErrorVar);
                    expr.incrementConstant(c * delta);
                    if (basicVar.isRestricted() && expr.constant() < 0.0) {
                        that._infeasibleRows.add(basicVar);
                    }
                });
            },

            dualOptimize: function() {
                if (CL.fTraceOn) CL.fnenterprint('dualOptimize:');
                var zRow = this.rowExpression(this._objective);
                while (!this._infeasibleRows.isEmpty()) {
                    var exitVar = this._infeasibleRows.values()[0];
                    this._infeasibleRows.remove(exitVar);
                    var entryVar = null;
                    var expr = this.rowExpression(exitVar);
                    if (expr != null) {
                        if (expr.constant() < 0.0) {
                            var ratio = Number.MAX_VALUE;
                            var r;
                            var terms = expr.terms();
                            terms.each(function(v, c) {
                                if (c > 0.0 && v.isPivotable()) {
                                    var zc = zRow.coefficientFor(v);
                                    r = zc / c;
                                    if (r < ratio ||
                                        (CL.approx(r, ratio) &&
                                         v.hashCode() < entryVar.hashCode())) {
                                        entryVar = v;
                                        ratio = r;
                                    }
                                }
                            });
                            if (ratio == Number.MAX_VALUE) {
                                throw new ExCLInternalError(
                                    'ratio == nil (MAX_VALUE) in dualOptimize'
                                );
                            }
                            this.pivot(entryVar, exitVar);
                        }
                    }
                }
            },
            newExpression: function(cn, eplus_eminus, prevEConstant) {
                var that = this;
                if (CL.fTraceOn) {
                    CL.fnenterprint('newExpression: ' + cn);
                    CL.traceprint('cn.isInequality() == ' + cn.isInequality());
                    CL.traceprint('cn.isRequired() == ' + cn.isRequired());
                }
                var cnExpr = cn.expression();
                var expr = new ClLinearExpression(cnExpr.constant());
                var slackVar = new ClSlackVariable();
                var dummyVar = new ClDummyVariable();
                var eminus = new ClSlackVariable();
                var eplus = new ClSlackVariable();
                var cnTerms = cnExpr.terms();
                cnTerms.each(function(v, c) {
                    var e = that.rowExpression(v);
                    if (e == null) expr.addVariable(v, c);
                    else expr.addExpression(e, c);
                });
                if (cn.isInequality()) {
                    ++this._slackCounter;
                    slackVar = new ClSlackVariable(this._slackCounter, 's');
                    expr.setVariable(slackVar, -1);
                    this._markerVars.put(cn, slackVar);
                    if (!cn.isRequired()) {
                        ++this._slackCounter;
                        eminus = new ClSlackVariable(this._slackCounter, 'em');
                        expr.setVariable(eminus, 1.0);
                        var zRow = this.rowExpression(this._objective);
                        var sw = cn.strength().symbolicWeight().times(cn.weight());
                        zRow.setVariable(eminus, sw.toDouble());
                        this.insertErrorVar(cn, eminus);
                        this.noteAddedVariable(eminus, this._objective);
                    }
                } else {
                    if (cn.isRequired()) {
                        ++this._dummyCounter;
                        dummyVar = new ClDummyVariable(this._dummyCounter, 'd');
                        expr.setVariable(dummyVar, 1.0);
                        this._markerVars.put(cn, dummyVar);
                        if (CL.fTraceOn) {
                            CL.traceprint('Adding dummyVar == d' + this._dummyCounter);
                        }
                    } else {
                        ++this._slackCounter;
                        eplus = new ClSlackVariable(this._slackCounter, 'ep');
                        eminus = new ClSlackVariable(this._slackCounter, 'em');
                        expr.setVariable(eplus, -1.0);
                        expr.setVariable(eminus, 1.0);
                        this._markerVars.put(cn, eplus);
                        var zRow = this.rowExpression(this._objective);
                        var sw = cn.strength().symbolicWeight().times(cn.weight());
                        var swCoeff = sw.toDouble();
                        if (swCoeff == 0 && CL.fTraceOn) {
                            CL.traceprint('sw == ' + sw);
                            CL.traceprint('cn == ' + cn);
                            CL.traceprint('adding ' + eplus + ' and ' + eminus +
                                          ' with swCoeff == ' + swCoeff);
                        }
                        zRow.setVariable(eplus, swCoeff);
                        this.noteAddedVariable(eplus, this._objective);
                        zRow.setVariable(eminus, swCoeff);
                        this.noteAddedVariable(eminus, this._objective);
                        this.insertErrorVar(cn, eminus);
                        this.insertErrorVar(cn, eplus);
                        if (cn.isStayConstraint()) {
                            this._stayPlusErrorVars.push(eplus);
                            this._stayMinusErrorVars.push(eminus);
                        } else if (cn.isEditConstraint()) {
                            eplus_eminus[0] = eplus;
                            eplus_eminus[1] = eminus;
                            prevEConstant[0] = cnExpr.constant();
                        }
                    }
                }
                if (expr.constant() < 0) expr.multiplyMe(-1);
                if (CL.fTraceOn) CL.fnexitprint('returning ' + expr);
                return expr;
            },
            optimize: function(zVar) {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('optimize: ' + zVar);
                if (CL.fTraceOn) CL.traceprint(this.toString());
                var zRow = this.rowExpression(zVar);
                CL.Assert(zRow != null, 'zRow != null');
                var entryVar = null;
                var exitVar = null;
                while (true) {
                    var objectiveCoeff = 0;
                    var terms = zRow.terms();
                    terms.escapingEach(function(v, c) {
                        if (v.isPivotable() && c < objectiveCoeff) {
                            objectiveCoeff = c;
                            entryVar = v;
                            return {brk: true};
                        }
                    });
                    if (objectiveCoeff >= -this._epsilon)
                        return;
                    if (CL.fTraceOn) {
                        CL.traceprint('entryVar == ' + entryVar +
                                      ', objectiveCoeff == ' + objectiveCoeff);
                    }
                    var minRatio = Number.MAX_VALUE;
                    var columnVars = this._columns.get(entryVar);
                    var r = 0.0;
                    columnVars.each(function(v) {
                        if (that.fTraceOn) that.traceprint('Checking ' + v);
                        if (v.isPivotable()) {
                            var expr = that.rowExpression(v);
                            var coeff = expr.coefficientFor(entryVar);
                            if (that.fTraceOn) {
                                that.traceprint('pivotable, coeff = ' + coeff);
                            }
                            if (coeff < 0.0) {
                                r = -expr.constant() / coeff;
                                if (r < minRatio ||
                                    (CL.approx(r, minRatio) &&
                                     v.hashCode() < exitVar.hashCode())) {
                                    minRatio = r;
                                    exitVar = v;
                                }
                            }
                        }
                    });
                    if (minRatio == Number.MAX_VALUE) {
                        throw new ExCLInternalError(
                            'Objective function is unbounded in optimize'
                        );
                    }
                    this.pivot(entryVar, exitVar);
                    if (CL.fTraceOn) CL.traceprint(this.toString());
                }
            },
            pivot: function(entryVar, exitVar) {
                if (CL.fTraceOn) CL.fnenterprint('pivot: ' + entryVar + ', ' + exitVar);
                if (entryVar == null) {
                    console.log('pivot: entryVar == null');
                    debugger;
                }
                if (exitVar == null) {
                    console.log('pivot: exitVar == null');
                }
                var pexpr = this.removeRow(exitVar);
                pexpr.changeSubject(exitVar, entryVar);
                this.substituteOut(entryVar, pexpr);
                this.addRow(entryVar, pexpr);
            },
            resetStayConstants: function() {
                if (CL.fTraceOn) CL.fnenterprint('resetStayConstants');
                for (var i = 0; i < this._stayPlusErrorVars.length; i++)
                {
                    var expr = this.rowExpression(this._stayPlusErrorVars[i]);
                    if (expr == null) {
                        expr = this.rowExpression(this._stayMinusErrorVars[i]);
                    }
                    if (expr != null) {
                        expr.set_constant(0.0);
                    }
                }
            },
            setExternalVariables: function() {
                var that = this;
                if (CL.fTraceOn) CL.fnenterprint('setExternalVariables:');
                if (CL.fTraceOn) CL.traceprint(this.toString());
                this._externalParametricVars.each(function(v) {
                    if (that.rowExpression(v) != null) {
                        print('Error: variable' + v +
                              ' in _externalParametricVars is basic');
                    } else {
                        v.change_value(0.0);
                    }
                });
                this._externalRows.each(function(v) {
                    var expr = that.rowExpression(v);
                    if (CL.fTraceOn) CL.debugprint('v == ' + v);
                    if (CL.fTraceOn) CL.debugprint('expr == ' + expr);
                    v.change_value(expr.constant());
                });
                this._fNeedsSolving = false;
            },
            insertErrorVar: function(cn, aVar) {
                if (CL.fTraceOn) {
                    CL.fnenterprint('insertErrorVar:' + cn + ', ' + aVar);
                }
                var cnset = this._errorVars.get(aVar);
                if (cnset == null) {
                    this._errorVars.put(cn, cnset = new HashSet());
                }
                cnset.add(aVar);
            }
        });
        // FILE: EDU.Washington.grad.gjb.cassowary
        // package EDU.Washington.grad.gjb.cassowary;


        // bunch of global functions
        /*var*/
        // ATTENTION THIS IS REALLY GLOBAL!
        CL = {
            debugprint: function(s /*String*/) {
                if (CL.fVerboseTraceOn) {
                    print(s);
                }
            },
            traceprint: function(s /*String*/) {
                if (CL.fVerboseTraceOn) {
                    print(s);
                }
            },
            fnenterprint: function(s /*String*/) {
                print('* ' + s);
            },
            fnexitprint: function(s) {
                print('- ' + s);
            },
            Assert: function(f, description) {
                if (!f) {
                    throw new ExCLInternalError('Assertion failed:' + description);
                }
            },
            Plus: function(e1, e2) {
                if (!(e1 instanceof ClLinearExpression)) {
                    e1 = new ClLinearExpression(e1);
                }
                if (!(e2 instanceof ClLinearExpression)) {
                    e2 = new ClLinearExpression(e2);
                }
                return e1.plus(e2);
            },

            Minus: function(e1, e2) {
                if (!(e1 instanceof ClLinearExpression)) {
                    e1 = new ClLinearExpression(e1);
                }
                if (!(e2 instanceof ClLinearExpression)) {
                    e2 = new ClLinearExpression(e2);
                }
                return e1.minus(e2);
            },

            Times: function(e1, e2) {
                if (e1 instanceof ClLinearExpression &&
                    e2 instanceof ClLinearExpression) {
                    return e1.times(e2);
                } else if (e1 instanceof ClLinearExpression &&
                           e2 instanceof ClVariable) {
                    return e1.times(new ClLinearExpression(e2));
                } else if (e1 instanceof ClVariable &&
                           e2 instanceof ClLinearExpression) {
                    return (new ClLinearExpression(e1)).times(e2);
                } else if (e1 instanceof ClLinearExpression &&
                           typeof(e2) == 'number') {
                    return e1.times(new ClLinearExpression(e2));
                } else if (typeof(e1) == 'number' &&
                           e2 instanceof ClLinearExpression) {
                    return (new ClLinearExpression(e1)).times(e2);
                } else if (typeof(e1) == 'number' &&
                           e2 instanceof ClVariable) {
                    return (new ClLinearExpression(e2, e1));
                } else if (e1 instanceof ClVariable &&
                           typeof(e2) == 'number') {
                    return (new ClLinearExpression(e1, e2));
                } else if (e1 instanceof ClVariable &&
                           e2 instanceof ClLinearExpression) {
                    return (new ClLinearExpression(e2, n));
                }
            },

            Divide: function(e1, e2) {
                return e1.divide(e2);
            },

            approx: function(a, b) {
                if (a instanceof ClVariable) {
                    a = a.value();
                }
                if (b instanceof ClVariable) {
                    b = b.value();
                }
                epsilon = 1.0e-8;
                if (a == 0.0) {
                    return (Math.abs(b) < epsilon);
                } else if (b == 0.0) {
                    return (Math.abs(a) < epsilon);
                } else {
                    return (Math.abs(a - b) < Math.abs(a) * epsilon);
                }
            },

            hashToString: function(h) {
                var answer = '';
                CL.Assert(h instanceof Hashtable);
                h.each(function(k, v) {
                    answer += k + ' => ';
                    if (v instanceof Hashtable) {
                        answer += CL.hashToString(v);
                    } else if (v instanceof HashSet) {
                        answer += CL.setToString(v);
                    } else {
                        answer += v + '\n';
                    }
                });
                return answer;
            },

            setToString: function(s) {
                CL.Assert(s instanceof HashSet);
                var answer = s.size() + ' {';
                var first = true;
                s.each(function(e) {
                    if (!first) {
                        answer += ', ';
                    } else {
                        first = false;
                    }
                    answer += e;
                });
                answer += '}\n';
                return answer;
            }
        };

        CL.fDebugOn = false;
        CL.fVerboseTraceOn = false;
        CL.fTraceOn = false;
        CL.fTraceAdded = false;
        CL.fGC = false;
        //CL.fTraceOn = true;
        //CL.fTraceAdded = true;
        CL.GEQ = 1;
        CL.LEQ = 2;


        Object.subclass('Timer', 'default category', {
            initialize: function() {
                this._timerIsRunning = false;
                this._elapsedMs = 0;
            },

            Start: function() {
                this._timerIsRunning = true;
                this._startReading = new Date();
            },

            Stop: function() {
                this._timerIsRunning = false;
                this._elapsedMs += (new Date()) - this._startReading;
            },

            Reset: function() {
                this._timerIsRunning = false;
                this._elapsedMs = 0;
            },

            IsRunning: function() {
                return this._timerIsRunning;
            },

            ElapsedTime: function() {
                if (!this._timerIsRunning) {
                    return this._elapsedMs / 1000;
                } else {
                    return (this._elapsedMs +
                            (new Date() - this._startReading)) / 1000;
                }
            }

        });
    }); // end of module
