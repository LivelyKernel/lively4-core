module('users.timfelgentreff.babelsberg.csp_ext').
    requires('users.timfelgentreff.csp.csp').toRun(function() {

    JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

    Object.subclass('csp.Solver', {
        isConstraintObject: true,

        initialize: function() {
            this.p = new _csp.DiscreteProblem();
        },
        newDomain: function(obj, varname, domain) {
            if (domain.length === 0) {
                throw 'Empty domain not allowed';
            }

            var temp = Constraint.current;
            Constraint.current = { solver: this };

            this._current = {
                varname: varname,
                domain: domain
            };

            var bbbConstraintVariable = ConstrainedVariable.newConstraintVariableFor(
                obj,
                varname
            );
            bbbConstraintVariable.ensureExternalVariableFor(this);
            Constraint.current = temp;

            var cspConstraintVariable = bbbConstraintVariable.externalVariables(this);

            delete this._current;
        },
        constraintVariableFor: function(value, ivarname, cobj) {
            if (ivarname === csp.Solver.DomainMethod) {
                if (!cobj.parentConstrainedVariable) {
                    debugger;
                    throw 'can only assign a domain to a property!';
                } else {
                    // we actually want to constraint the parent of this property
                    theParent = cobj.obj;
                    this.__takeNext__ = true;
                    cParent = this.constraintVariableFor(
                        cobj.obj,
                        cobj.parentConstrainedVariable.ivarname,
                        cobj.parentConstrainedVariable
                    );
                    cobj.parentConstrainedVariable.externalVariables(this, cParent);
                    // XXX HACK?
                    delete cParent.__cvar__;
                    return cParent;
                }
            }

            if (this.__takeNext__) {
                delete this.__takeNext__;
                return new csp.Variable(
                    this,
                    ivarname,
                    value,
                    [value]
                );
            }

            if (!this._current) {
                return null;
            }

            var vari = new csp.Variable(
                this,
                this._current.varname,
                value,
                this._current.domain
            );
            return vari;
        },
        weight: 1000,
        always: function(opts, func) {
            func.varMapping = opts.ctx;
            func.allowTests = true;
            func.allowUnsolvableOperations = true;
            var cobj = new Constraint(func, this);
            cobj.allowFailing = true;
            if (!this.__domainDefinition__) {
                var constraint = this.p.addConstraint([], func);
                var satisfiable = this.p.getSolution({});
                if (!satisfiable) {
                    this.p.removeConstraint(constraint);
                    throw new Error('constraint cannot be satisfied');
                }
            } else {
                delete this.__domainDefinition__;
            }
            return cobj;
        },
        solve: function() { /* ignored */ }
    });
    Object.extend(csp.Solver, {
        weight: 1000,
        DomainMethod: 'is',
        uniqueName: 42,
        getUniqueName: function() {
            return 'var' + csp.Solver.uniqueName++;
        }
    });

    Object.subclass('csp.Variable', {
        isConstraintObject: true,

        initialize: function(solver, varname, value, domain) {
            this.solver = solver;
            this.varname = varname;
            this.setDomain(domain, value);
        },

        setDomain: function(domain, currentValue) {
            if (this.domain) {
                if (!this.cspname) throw 'inconsistent csp.Variable';
                currentValue = currentValue || this.value();
                this.solver.p.removeVariable(this.cspname, this.domain);
            }
            this.domain = domain;
            this.cspname = csp.Solver.getUniqueName();
            this.cspvariable = this.solver.p.addVariable(this.cspname, domain);

            var valueToAssign = this.domain.indexOf(currentValue) > -1 ?
                currentValue :
                this.domain[0];
            this.solver.p.solver.assignments[this.cspname] = valueToAssign;
        },

        suggestValue: function(value) {
            // throw error if assigned value does not match the corresponding domain
            var inDomain = this.domain.indexOf(value) > -1;
            if (!inDomain) {
                throw new Error('assigned value is not contained in domain');
            }

            // save previous assignments for possible later restoration.
            var save = _.clone(this.solver.p.solver.assignments);

            // add a restricted domain with a fake Variable-object
            var restrictedDomains = {};
            restrictedDomains[this.cspname] = {domain: [value]};

            // try to satisfy all constraint
            var satisfiable = this.solver.p.getSolution(restrictedDomains);
            if (!satisfiable) {
                // restore assignments
                _.extend(this.solver.p.solver.assignments, save);
                throw new Error('assignment makes constraints not satisfiable');
            }
        },

        value: function() {
            return this.solver.p.getAssignmentFor(this.cspname);
        },

        setReadonly: function(bool) { /* ignored */ },
        isReadonly: function() {
            return false;
        },

        cnIn: function(domain) {
            this.setDomain(domain);
            this.solver.__domainDefinition__ = true;
            return true;
        }
    });

    Number.prototype.__defineGetter__(csp.Solver.DomainMethod, function() {
        return this;
    });
    String.prototype.__defineGetter__(csp.Solver.DomainMethod, function() {
        return this;
    });

}); // end of module
