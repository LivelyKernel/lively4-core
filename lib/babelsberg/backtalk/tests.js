module('users.timfelgentreff.backtalk.tests').requires('users.timfelgentreff.backtalk.backtalk', 'users.timfelgentreff.backtalk.constraints', 'lively.TestFramework', 'users.timfelgentreff.backtalk.backtalk_ext').toRun(function() {

TestCase.subclass('backtalk.VariableTest', {
    setUp: function() {
        this.variable = backtalk.Variable.labelFromTo('x', 1, 3);
    },
    testConnectionBetweenValuesToExploreAndCurrentValue: function () {
	    this.variable.currentValue = 2;
	    this.variable.valuesToExplore = [];
    	this.assert(this.variable.valuesToExplore.length === 0);
    	this.assert(!this.variable.currentValue);
    }
});


TestCase.subclass('backtalk.BinaryConstraintTest', {
    setUp: function() {
        this.variable1 = backtalk.Variable.labelFromTo('v1', 1, 10);
        this.variable2 = backtalk.Variable.labelFromTo('v2', 2, 12);
        this.constraint = new backtalk.EqualityConstraint(this.variable1, this.variable2);
    },
    testDomainWipedOut: function() {
        this.assert(!this.constraint.domainWipedOut());
        this.variable1.valuesToExplore = [];
        this.assert(this.constraint.domainWipedOut());
        this.variable1.reset();
        this.variable2.valuesToExplore = [];
        this.assert(this.constraint.domainWipedOut());
    },
    testReferencesAfterVariableRemoval: function() {
        var expectedConstraints, expectedVariables, newVariable;
	    newVariable = new backtalk.Variable('x', 1, 2);
	    this.constraint.variableA = newVariable;
	    expectedConstraints = [this.constraint];
    	expectedVariables = [this.variable2, newVariable];
	    this.assert(this.variable1.constraints.length === 0);
    	this.assert(this.variable2.constraints.equals(expectedConstraints));
    	this.assert(this.constraint.variables().intersect(expectedVariables).length === expectedVariables.length);
    }
});
backtalk.BinaryConstraintTest.subclass('backtalk.CSPTest', {
    setUp: function($super) {
        $super();
        this.variable3 = backtalk.Variable.labelFromTo('v3', 5, 8);
        this.variable4 = backtalk.Variable.labelFromTo('v4', 3, 6);
        this.constraint2 = new backtalk.EqualityConstraint(this.variable3, this.variable4);
        this.csp = backtalk.CSP.labelVariables('cspTest', [this.variable1, this.variable2]);
    },
});

backtalk.CSPTest.subclass('backtalk.SolverTest', {
    setUp: function($super) {
        $super();
        this.csp.addVariable(this.variable3);
    	this.csp.addVariable(this.variable4);
    	this.solver = new backtalk.SolverForTest(this.csp)
    	this.solver.reset();
    },
    testAllSolutionsOnATrivialCSP: function() {
	    var expectedSolution,solutions;
    	this.variable1.domain = [3]
    	this.variable2.domain = [3]
    	this.variable3.domain = [6]
    	this.variable4.domain = [6]
    	solutions = this.solver.allSolutions();
    	this.assert(solutions.length === 1)
    	this.assert(solutions[0].keys.equals([this.variable1, this.variable2, this.variable3, this.variable4]));
    	this.assert(solutions[0][this.variable1.uuid] === 3)
    	this.assert(solutions[0][this.variable2.uuid] === 3)
    	this.assert(solutions[0][this.variable3.uuid] === 6)
    	this.assert(solutions[0][this.variable4.uuid] === 6)
    },
    testAllSolutions: function() {
        var solutions, v1, v2, v3, v4;
        solutions = this.solver.allSolutions();
        this.assert(this.solver.explorationFinished());
        this.assert(solutions.uniq().length === 18)
        solutions.each(function (s) {
            v1 = s[this.variable1.uuid]
            v2 = s[this.variable2.uuid]
            this.assert(v1 == v2)
            v3 = s[this.variable3.uuid]
            v4 = s[this.variable4.uuid]
            this.assert(v3 == v4)
        }.bind(this));
    }
});

backtalk.Solver.subclass('backtalk.SolverForTest', {
    propagateInstantiationFor: function(constraint) {
	    return constraint.enforceArcConsistency();
    }
});

TestCase.subclass('backtalk.BabelsbergTest', {
    testSimple: function() {
        var o = {x: 1, y: 2},
            solver = new BacktalkSolver()
        bbb.always({
            ctx: {
                o: o,
                _$_self: this.doitContext || this
            },
            solver: solver
        }, function() {
            return o.x.is in [ 3, 4, 5 ];;
        });
        this.assert([3,4,5].include(o.x))
    },
    testSimpleEquals: function() {
        var o = {x: 1},
            solver = new BacktalkSolver();
        bbb.always({
            solver: solver,
            ctx: {
                solver: solver,
                o: o,
                _$_self: this.doitContext || this
            }
        }, function() {
            return o.x.is in [12,13,14] && o.x == 12;;
        });
        this.assert(o.x == 12)
    },
    tearDown: function() {
        delete bbb.defaultSolver;
    },
    testBacktalkPaperExample: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver();
    	var man = {
			shoes: "foo",
			shirt: "foo",
			pants: "foo",
			hat: "foo"
		};
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shoes.is in ["brown", "black"];;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shirt.is in ["brown", "blue", "white"];;
        });
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.pants.is in ["brown", "blue", "black", "white"];;
        });
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.hat.is in ["brown"];;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shoes === man.hat;;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shoes !== man.pants;;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shoes !== man.shirt;;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                man: man,
                _$_self: this.doitContext || this
            }
        }, function() {
            return man.shirt !== man.pants;;
        });

        this.assert(man.hat === "brown", "hat's domain is restricted to 'brown' only");
        this.assert(man.shoes === "brown", "shoes have to be 'brown'");
        this.assert(man.shirt === "blue" || man.shirt === "white", "shirt has to be 'blue' or 'white'");
        this.assert(man.shirt !== man.pants, "shirt and pants must not have the same color");
        this.assert(man.pants === "black" || man.pants === "blue" || man.pants === "white", "pants should be 'black', 'blue' or 'white'");
    },
    testForceToDomain: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver();
	    var pt = {x: 5, y: 2};
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3];;
        });

	    this.assert([1, 2, 3].indexOf(pt.x) > -1, "x is not in its domain [1, 2, 3], but " + pt.x);
    },
    testRemainIfInDomain: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver();
	    var pt = {x: 5, y: 2};
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [4, 5, 6];;
        });

	    this.assert(pt.x === 5, "x does not stay at 5, but probably raims in its domain [4, 5, 6]; x: " + pt.x);
    },
    testErrorOnEmptyDomain: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver();
	    	p = {x: 5, y: 2},
	    	errorThrown = false;
	    
	    try {
            bbb.always({
                ctx: {
                    bbb: bbb,
                    csp: csp,
                    solver: solver,
                    p: p,
                    _$_self: this.doitContext || this
                }
            }, function() {
                return p.x.is in [];;
            });
        } catch (e) {
            errorThrown = true;
        }

	    this.assert(errorThrown, "no error was thrown on empty domain");
    },
    testAssignment: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver(),
	    	pt = {x: 2, y: 6},
	    	errorThrown = false;
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3, 4, 5, 6, 7, 8, 9];;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.y.is in [4, 5, 6, 7, 8, 9, 10, 11, 12];;
        });
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x + 4 === pt.y;;
        });
	
        pt.x = 8;
        this.assert(pt.x === 8, "assignment 'x = 8' was not successful; x: " + pt.x);
	    this.assert(pt.y === 12, "constraint 'x + 4 == y' not satisfied; y: " + pt.y);
	    
	    pt.y = 7;
	    this.assert(pt.y === 7, "assignment 'y = 7' was not successful; y: " + pt.y);
	    this.assert(pt.x === 3, "constraint 'x + 4 == y' not satisfied; x: " + pt.x);
    },
    testAssignment2: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver(),
	    	pt = {x: 2, y: 8},
	    	errorThrown = false;
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3, 4, 5, 6, 7, 8, 9];;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.y.is in [4, 5, 6, 7, 8, 9, 10, 11, 12];;
        });

        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x + pt.y >= 10;;
        });
	
        this.assert(pt.x + pt.y >= 10, "constraint 'pt.x + pt.y >= 10' does not hold for x: "+ pt.x+", y: " + pt.y);

	    pt.y = 4;
        this.assert(pt.y === 4, "assignment 'y = 4' was not successful; y: " + pt.y);
        this.assert(pt.x + pt.y >= 10, "constraint 'pt.x + pt.y >= 10' does not hold for x: "+ pt.x+", y: " + pt.y);
    },
    testFailingAssignmentOnDomain: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver(),
	    	pt = {x: 5, y: 2},
	    	errorThrown = false;
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3];;
        });
	    
	    try {
	        pt.x = 0;
	    } catch (e) {
	    	errorThrown = true;
	    }
	
	    this.assert(errorThrown, "no error was thrown on new value x = 0 with domain [1, 2, 3]; x: " + pt.x);
    },
    testFailingAssignment: function () {
    	// try x = 0 with constraint x > 4
	    var solver = bbb.defaultSolver = new BacktalkSolver(),
	    	pt = {x: 2, y: 8},
	    	errorThrown = false;
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3, 4, 5, 6, 7, 8, 9];;
        });
        
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.y.is in [1, 2, 3, 4, 5, 6, 7, 8, 9];;
        });
	    
	    bbb.always({
	        ctx: {
	            bbb: bbb,
	            csp: csp,
	            solver: solver,
	            pt: pt,
	            _$_self: this.doitContext || this
	        }
	    }, function() {
	        return pt.x > 4;;
	    });
	
	    bbb.always({
	        ctx: {
	            bbb: bbb,
	            csp: csp,
	            solver: solver,
	            pt: pt,
	            _$_self: this.doitContext || this
	        }
	    }, function() {
	        return pt.x + pt.y === 10;;
	    });

	    this.assert(pt.x > 4, "constraint 'pt.x  > 4' does not hold for x: "+ pt.x);
	    this.assert(pt.x + pt.y === 10, "constraint 'pt.x + pt.y === 10' does not hold for x: "+ pt.x + ", y: " + pt.y);
	
	    var oldValueX = pt.x;
	    var oldValueY = pt.y;
	    
	    try {
	        pt.y = 7;
	    } catch (e) {
	    	errorThrown = true;
	    }
        this.assert(errorThrown, "no error was thrown on new value y = 7 with constraints 'pt.x + pt.y === 10' and 'pt.x  > 4'; x: " + pt.x + ", y: " + pt.y);
	    this.assert(pt.y === oldValueY, "old value of y not restored after failed assignment; currentY: " + pt.y + ", oldY: " + oldValueY);
	    this.assert(pt.x === oldValueX, "old value of x not restored after failed assignment; currentX: " + pt.x + ", oldX: " + oldValueX);
    },
    testUnsatisfiableConstraint: function () {
	    var solver = bbb.defaultSolver = new BacktalkSolver(),
	    	pt = {x: 5, y: 2},
	    	errorThrown = false;
	    
        bbb.always({
            ctx: {
                bbb: bbb,
                csp: csp,
                solver: solver,
                pt: pt,
                _$_self: this.doitContext || this
            }
        }, function() {
            return pt.x.is in [1, 2, 3];;
        });
	    
	    try {
	        bbb.always({
	            ctx: {
	                bbb: bbb,
	                csp: csp,
	                solver: solver,
	                pt: pt,
	                _$_self: this.doitContext || this
	            }
	        }, function() {
	            return pt.x >= 5;;
	        });
	    } catch (e) {
	    	errorThrown = true;
	    }
	
	    this.assert(errorThrown, "no error was thrown on unsatisfiable constraint");
    }
})

}) // end of module
