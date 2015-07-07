module('users.timfelgentreff.backtalk.backtalk').requires().toRun(function() {

if (typeof(Set) == 'undefined') {
    Global.Set = function() {
        throw 'Set not supported';
    }
}

Object.subclass('backtalk.Object', {
    get uuid() {
        return this._uuid || (this._uuid = Strings.newUUID());
    }
});

backtalk.Object.subclass('backtalk.Variable', {
    addConstraint: function (cnstr) {
        if (this.constraints.indexOf(cnstr) !== -1) return;
        this.constraints.push(cnstr);
    },
    removeConstraint: function (cnstr) {
        this.constraints.remove(cnstr);
    },
    nextValue: function () {
        if (this.currentValue) {
            this.valuesToExplore.remove(this.currentValue);
        }
        var nextValue = this.valuesToExplore[0];
        this.currentValue = nextValue;
        return nextValue;
    },
    resetCurrentValue: function () {
        this.currentValue = undefined;
    },
    domainWipedOut: function () {
        return this.valuesToExplore.length === 0
    },
    isInstantiated: function () {
        return this.currentValue !== undefined && this.currentValue !== null
    },
    filterToReject: function (filter) {
        this.valuesToExplore = this.valuesToExplore.reject(filter);
    },
    filterToSelect: function (filter) {
        this.valuesToExplore = this.valuesToExplore.filter(filter);
    },
    get valuesToExplore() {
        return this._valuesToExplore;
    },
    set valuesToExplore(ary) {
        if (ary instanceof Set) {
            ary = Array.from(ary.values());
        } else {
            ary = ary.uniq();
        }
        this._valuesToExplore = ary;
        if (this._valuesToExplore.length === 0) {
            this.resetCurrentValue();
        }
    },
    initialize: function() {
        this.constraints = [];
        this.valuesToExplore = [];
    },
    reset: function() {
        var idx = this.domain.indexOf(this.currentValue);
        if (idx !== -1) {
            // try the current value first...
            var d = this.domain.slice();
            d.splice(idx, 1);
            d = [this.currentValue].concat(d);
            this.valuesToExplore = d
        } else {
            this.valuesToExplore = this.domain;
        }
        this.resetCurrentValue();
    },
    get domain() {
        return this._domain;
    },
    set domain(d) {
        if (d instanceof Set) {
            d = Array.from(d.values());
        } else {
            d = d.uniq();
        }
        this._domain = d;
        this.valuesToExplore = d;
    }
});

Object.extend(backtalk.Variable, {
    labelDomain: function (l, d) {
        var v = new backtalk.Variable();
        v.label = l;
        v.domain = d;
        return v;
    },
    labelFromTo: function (l, lower, upper) {
        var v = new backtalk.Variable();
        v.label = l;
        v.domain = Array.range(lower, upper);
        return v;
    }
});

backtalk.Object.subclass('backtalk.Solver', {
    allSolutions: function() {
        this.reset();
        var allSolutions = [];
        while (!this.explorationFinished()) {
            this.exploreCspStep();
            if (this.solutionFound()) {
                var solution = this.solution();
                if (allSolutions.indexOf(solution) === -1) {
                    allSolutions.push(solution);
                }
                this.stepBackward();
            }
        }
        return allSolutions.uniq();
    },
    chooseAPreviousContext: function() {
        return this.contexts.last();
    },
    chooseAVariable: function() {
        if (this.backTrackFlag) {
            return this.currentVariable;
        } else {
            return this.variables().detect(function (v) {
                return !v.isInstantiated()
            });
        }
    },
    chooseVariableAndValue: function() {
        this.currentVariable = this.chooseAVariable();
        this.currentVariable.nextValue();
    },
    exploreCspStep: function() {
        while (!this.domainWipedOut()) {
            this.stepForward();
            if (this.solutionFound()) {
                return this;
            }
        }
        this.stepBackward();
    },
    firstSolution: function() {
        this.reset();
        while (!(this.solutionFound() || this.explorationFinished())) {
            this.exploreCspStep();
        }
        return this.solution();
    },
    propagateInstantiationFor: function(constraint) {
        return constraint.filter();
    },
    propagateInstantiationOfCurrentVariable: function() {
        if (this.currentVariable.currentValue) {
            this.currentVariable.valuesToExplore = [this.currentVariable.currentValue];
        }
        this.sortedConstraintsForPropagation().detect(function (constraint) {
            this.propagateInstantiationFor(constraint);
		    if (constraint.domainWipedOut()) {
		        return true;
		    }
        }.bind(this));
    },
    sortedConstraintsForPropagation: function() {
        return this.currentVariable.constraints;
    },
    stepBackward: function() {
        if (this.contexts.length === 0) {
            return this;
        } else {
            var ctx = this.chooseAPreviousContext();
            this.restoreContext(ctx);
            this.backTrackFlag = true;
        }
    },
    stepForward: function() {
        this.chooseVariableAndValue();
        this.saveContext();
        this.propagateInstantiationOfCurrentVariable();
        this.backTrackFlag = false;
    },
    set currentVariable(v) {
        this._currentVariable = v;
        if (!this.firstChosenVariable) {
            this.firstChosenVariable = v;
        }
    },
    get currentVariable() {
        return this._currentVariable;
    },
    solution: function() {
        if (!this.solutionFound()) {
            return;
        } else {
            return this.variables().inject({keys: []}, function (solution, v) {
                solution[v.uuid] = v.currentValue;
                solution.keys.push(v);
                return solution;
            });
        }
    },
    variables: function() {
        return this.csp.variables;
    },
    domainWipedOut: function() {
        if (this.currentVariable &&
            this.backTrackFlag &&
            this.currentVariable.valuesToExplore.length === 0) {
            return true;
        } else {
            return this.variables().any(function (v) {
                return v.domainWipedOut();
            });
        }
    },
    explorationFinished: function() {
        if (!this.firstChosenVariable) {
            return this.variables().any(function (v) {
                return v.domain.length === 0;
            });
        } else {
            return (this.firstChosenVariable === this.currentVariable &&
                    this.firstChosenVariable.valuesToExplore.length === 0);
        }
    },
    solutionFound: function() {
        if (!this.variables().every(function (v) { return v.isInstantiated() })) {
            return false;
        } else {
            return this.csp.constraints().every(function (c) {
                return c.isSatisfied();
            });
        }
    },
    initialize: function(csp) {
        this.csp = csp;
        this.reset();
    },
    reset: function() {
        this.csp && this.csp.reset();
        this.contexts = [];
        this.currentVariable = undefined;
        this.firstChosenVariable = undefined;
        this.backTrackFlag = false;
    },
    restoreContext: function(ctx) {
        this.contexts.remove(ctx);
        ctx.restoreInSolver(this);
    },
    saveContext: function() {
        this.contexts.push(new backtalk.Context(this));
    }
});

Object.extend(backtalk.Solver, {
    on: function (csp) {
        var solver = new backtalk.Solver();
        solver.csp = csp;
        return solver;
    }
});

backtalk.Object.subclass('backtalk.Context', {
    initialize: function(solver) {
        if (solver) {
            this.fromSolver(solver);
        }
    },
    currentValueFor: function(v) {
        return this.currentValuesDict[v.uuid];
    },
    fromSolver: function(solver) {
        this.valuesToExploreDict = {keys: []};
		this.currentValuesDict = {keys: []};
	    solver.variables().each(function (v) {
	        this.valuesToExploreDict[v.uuid] = v.valuesToExplore.slice();
	        this.valuesToExploreDict.keys.push(v);
	        if (v.isInstantiated()) {
	            this.currentValuesDict[v.uuid] = v.currentValue;
	            this.currentValuesDict.keys.push(v);
	        }
	    }.bind(this));
	    this.currentVariable = solver.currentVariable;
    },
    restoreInSolver: function(solver) {
        this.valuesToExploreDict.keys.each(function (v) {
            v.valuesToExplore = this.valuesToExploreDict[v.uuid];
        }.bind(this));
        this.currentValuesDict.keys.each(function (v) {
            v.currentValue = this.currentValuesDict[v.uuid];
        }.bind(this));
        solver.currentVariable = this.currentVariable;
    },
    valuesToExploreFor: function(v) {
        return this.valuesToExploreDict[v.uuid];
    }
});

Object.extend(backtalk.Context, {
    fromSolver: function (solver) {
        return new backtalk.Context(solver);
    }
});

backtalk.Object.subclass('backtalk.Constraint', {
    domainWipedOut: function() {
        return this.variables().some(function (v) {
            return v.domainWipedOut()
        });
    },
    isInstantiated: function() {
        return this.variables().every(function (v) {
            return v.isInstantiated()
        });
    },
    filter: function() {
        this.enforceArcConsistency();
    },
    isNotConsistent: function() {
        return !this.isConsistent();
    },
    isSatisfied: function() {
        return this.isInstantiated() && this.isConsistent();
    }
});

backtalk.Constraint.subclass('backtalk.UnaryConstraint', {
    initialize: function(v) {
        this.variable = v;
    },
    valuesToExplore: function() {
        return this.variable.valuesToExplore;
    },
    get variable() {
        return this._variable;
    },
    set variable(v) {
        if (this._variable) {
            this._variable.removeConstraint(this);
        }
        this._variable = v;
        if (v) v.addConstraint(this);
    },
    variables: function() {
        return [this.variable];
    }
});


backtalk.Constraint.subclass('backtalk.BinaryConstraint', {
    initialize: function(a, b) {
        this.variableA = a;
        this.variableB = b;
    },
    valuesToExploreA: function() {
        return this.variableA.valuesToExplore;
    },
    valuesToExploreB: function() {
        return this.variableB.valuesToExplore;
    },
    get variableA() {
        return this._variableA;
    },
    set variableA(v) {
        if (this._variableA) {
            this._variableA.removeConstraint(this);
        }
        this._variableA = v;
        v.addConstraint(this);
    },
    get variableB() {
        return this._variableB;
    },
    set variableB(v) {
        if (this._variableB) {
            this._variableB.removeConstraint(this);
        }
        this._variableB = v;
        if (v) v.addConstraint(this);
    },
    variables: function() {
        return [this.variableA, this.variableB].uniq();
    }
});

backtalk.Object.subclass('backtalk.CSP', {
    initialize: function() {
        this.variables = [];
    },
    addVariable: function(v) {
        if (this.variables.indexOf(v) !== -1) return;
        this.variables.push(v);
    },
    constraints: function() {
        return this.variables.map(function(v) {
            return v.constraints;
        }).flatten().uniq();
    },
    domainWipedOut: function() {
        return this.variables.some(function (v) {
            return v.domainWipedOut();
        });
    },
    instantiatedConstraints: function() {
        return this.constraints().select(function (c) {
            return c.isInstantiated();
        });
    },
    removeVariable: function(v) {
        this.variables.remove(v);
    },
    reset: function() {
        this.variables.each(function (v) {
            v.reset();
        });
    }
});
Object.extend(backtalk.CSP, {
    labelVariables: function (l, v) {
        var csp = new backtalk.CSP();
        csp.label = l;
        csp.variables = v;
        return csp;
    }
});
}); // end of module
