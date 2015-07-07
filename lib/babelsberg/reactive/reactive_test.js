module('users.timfelgentreff.reactive.reactive_test').requires('lively.TestFramework', 'users.timfelgentreff.reactive.reactive').toRun(function() {

TestCase.subclass('users.timfelgentreff.reactive.reactive_test.AssertTest', {
	setUp: function() {
		_Point = function(x, y) {
			this.x = x;
			this.y = y;
		};
		_Point.prototype.distance = function(ext) {
			var distX = ext.x - this.x;
			var distY = ext.y - this.y;
			return Math.sqrt(distX * distX + distY * distY);
		};
		_Point.prototype.extent = function(ext) {
			return new Rectangle(this.x, this.y, ext.x, ext.y);
		};
		_Point.prototype.leq = function(other) {
			return this.x <= other.x && this.y <= other.y;
		}
		_Point.prototype.add = function(other) {
			var x = this.x + other.x;
			var y = this.y + other.y;
			return new _Point(x, y);
		};
		
		_Rectangle = function(left, bottom, width, height) {
			this.origin = new _Point(left, bottom);
			this.extent = new _Point(width, height);
		};
		_Rectangle.prototype.contains = function(point) {
			var upperRightCorner = this.origin.add(this.extent);
			return this.origin.leq(point) &&
				point.leq(upperRightCorner);
		};
	},
	assertWithError: function(ErrorType, func, msg) {
		var errorThrown = false;
		try {
			func();
		} catch(e) {
			if(e instanceof ErrorType) {
				errorThrown = true;
			} else {
				throw e;
			}
		}
		this.assert(errorThrown, msg);
	},
    testAssertSolver: function() {
    	var pt = {x: 1, y: 2};
    	
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.y > pt.x;
    	});
		this.assert(pt.x === 1, "constraint construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y === 2, "constraint construction modified variable, pt.y: " + pt.y);

		// valid assignment
		pt.x = 0;
		this.assert(pt.x === 0, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y === 2, "modified unassigned variable, pt.y: " + pt.y);
		
		// invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.y = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 0, "modified unassigned variable, pt.x: " + pt.x);
		this.assert(pt.y === 2, "revert did not work, pt.y: " + pt.y);
    },
	testFailOnConstraintConstruction: function() {
    	var pt = {x: 1, y: 2};
    	
		this.assertWithError(
			ContinuousAssertError,
			function() {
				bbb.assert({
					message: "expected error",
					ctx: {
						pt: pt
					}
				}, function() {
					return pt.x === pt.y;
				});
			},
			"no ContinuousAssertError was thrown(1)"
		);
		this.assert(pt.x === 1, "assertion construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y === 2, "assertion construction modified variable, pt.y: " + pt.y);

		// valid assignment
		pt.x = 0;
		this.assert(pt.x === 0, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y === 2, "modified unassigned variable, pt.y: " + pt.y);
    },
	testComplexFunction: function() {
		var pt1 = new _Point(2,3);
		var pt2 = new _Point(5,7);
		this.assert(pt1.distance(pt2) === 5, "distance not correct, distance: " + pt1.distance(pt2));
		
		bbb.assert({
			message: "distance to pt2 point is not 5",
			ctx: {
				pt1: pt1,
				pt2: pt2
			}
		}, function() {
			return pt1.distance(pt2) === 5;
		});
		
		// valid assignment
		pt2.x = -1;
		this.assert(pt1.x === 2, "modified unassigned variable, pt1.x: " + pt1.x);
		this.assert(pt1.y === 3, "modified unassigned variable, pt1.y: " + pt1.y);
		this.assert(pt2.x === -1, "assignment did not work, pt2.x: " + pt2.x);
		this.assert(pt2.y === 7, "modified unassigned variable, pt2.y: " + pt2.y);

		// invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() {
				pt2.x = 3;
			},
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt1.x === 2, "modified unassigned variable, pt1.x: " + pt1.x);
		this.assert(pt1.y === 3, "modified unassigned variable, pt1.y: " + pt1.y);
		this.assert(pt2.x === -1, "assignment not reverted, pt2.x: " + pt2.x);
		this.assert(pt2.y === 7, "modified unassigned variable, pt2.y: " + pt2.y);
	},
	testComplexObject: function() {
		var pt = new _Point(4,4);
		var rect = new _Rectangle(0, 0, 5, 5);

		this.assert(rect.contains(pt), "pt not contained by rectangle");
		
		bbb.assert({
			message: "rect does not include pt",
			ctx: {
				rect: rect,
				pt: pt
			}
		}, function() {
			return rect.contains(pt);
		});
		
		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin = new _Point(3,4.5);
			},
			"no ContinuousAssertError was thrown (1)"
		);
		this.assert(rect.origin.x === 0, "assignment not reverted, rect.origin.x: " + rect.origin.x);
		this.assert(rect.origin.y === 0, "assignment not reverted, rect.origin.y: " + rect.origin.y);
		this.assert(rect.extent.x === 5, "assignment modified unrelated variables, rect.extent.x: " + rect.extent.x);
		this.assert(rect.extent.y === 5, "assignment modified unrelated variables, rect.extent.y: " + rect.extent.y);
		this.assert(pt.x === 4, "assignment modified unrelated variables, pt.x: " + pt.x);
		this.assert(pt.y === 4, "assignment modified unrelated variables, pt.y: " + pt.y);

        // valid assignment
		pt.y = 4.5;
		this.assert(rect.origin.x === 0, "assignment modified unrelated variables, rect.origin.x: " + rect.origin.x);
		this.assert(rect.origin.y === 0, "assignment modified unrelated variables, rect.origin.y: " + rect.origin.y);
		this.assert(rect.extent.x === 5, "assignment modified unrelated variables, rect.extent.x: " + rect.extent.x);
		this.assert(rect.extent.y === 5, "assignment modified unrelated variables, rect.extent.y: " + rect.extent.y);
		this.assert(pt.x === 4, "assignment modified unrelated variables, pt.x: " + pt.x);
		this.assert(pt.y === 4.5, "assignment did not work, pt.y: " + pt.y);

		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin.x = 4.5;
			},
			"no ContinuousAssertError was thrown (2)"
		);
		this.assert(rect.origin.x === 0, "assignment not reverted, rect.origin.x: " + rect.origin.x);
		this.assert(rect.origin.y === 0, "assignment modified unrelated variables, rect.origin.y: " + rect.origin.y);
		this.assert(rect.extent.x === 5, "assignment modified unrelated variables, rect.extent.x: " + rect.extent.x);
		this.assert(rect.extent.y === 5, "assignment modified unrelated variables, rect.extent.y: " + rect.extent.y);
		this.assert(pt.x === 4, "assignment modified unrelated variables, pt.x: " + pt.x);
		this.assert(pt.y === 4.5, "assignment modified unrelated variables, pt.y: " + pt.y);

		rect.origin = new _Point(3,3);
		this.assert(rect.origin.x === 3, "assignment did not work, rect.origin.x: " + rect.origin.x);
		this.assert(rect.origin.y === 3, "assignment did not work, rect.origin.y: " + rect.origin.y);
		this.assert(rect.extent.x === 5, "assignment modified unrelated variables, rect.extent.x: " + rect.extent.x);
		this.assert(rect.extent.y === 5, "assignment modified unrelated variables, rect.extent.y: " + rect.extent.y);
		this.assert(pt.x === 4, "assignment modified unrelated variables, pt.x: " + pt.x);
		this.assert(pt.y === 4.5, "assignment modified unrelated variables, pt.y: " + pt.y);

		this.assertWithError(
			ContinuousAssertError,
			function() {
				rect.origin.x = 4.5;
			},
			"newly assigned point was not re-constrained"
		);
		this.assert(rect.origin.x === 3, "assignment was not reverted, rect.origin.x: " + rect.origin.x);
		this.assert(rect.origin.y === 3, "assignment modified unrelated variables, rect.origin.y: " + rect.origin.y);
		this.assert(rect.extent.x === 5, "assignment modified unrelated variables, rect.extent.x: " + rect.extent.x);
		this.assert(rect.extent.y === 5, "assignment modified unrelated variables, rect.extent.y: " + rect.extent.y);
		this.assert(pt.x === 4, "assignment modified unrelated variables, pt.x: " + pt.x);
		this.assert(pt.y === 4.5, "assignment modified unrelated variables, pt.y: " + pt.y);
    },
	testInvalidAssignment: function() {
    	var pt = {x: 1, y: 2};
    	
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.y > pt.x;
    	});

		this.assertWithError(
			ContinuousAssertError,
			function() { pt.y = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 1, "another variable was modified, pt.x: " + pt.x);
		this.assert(pt.y === 2, "assignment not reverted, pt.y: " + pt.y);
    },
	testMultipleAssertionsOnSameObject: function() {
    	var pt = {x: 1, y: 2};

    	bbb.assert({
			message: "x-coordinate is not positive",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x >= 0;
    	});
    	bbb.assert({
			message: "x-coordinate is greater then 10",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x <= 10;
    	});
		this.assert(pt.x === 1, "constraint construction modified variable, pt.x: " + pt.x);

		// valid assignment
		pt.x = 7;
		this.assert(pt.x === 7, "assignment did not work, pt.x: " + pt.x);

		// invalid assignment with respect to first assertion
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 7, "assignment not reverted(1), pt.x: " + pt.x);

		// invalid assignment with respect to second assertion
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = 11; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 7, "assignment not reverted(2), pt.x: " + pt.x);
    },
	testIntegrationWithOtherSolvers_FailOnAssignment: function() {
	    var pt = {x: 1, y: 2},
			cassowary = new ClSimplexSolver();

		cassowary.weight = -999;
    	bbb.always({
			solver: cassowary,
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x == pt.y;
    	});
		var eX = pt.x, eY = pt.y;
		this.assert(eX == eY, "Cassowary doesnt work");
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x <= 10;
    	});

        // invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = 100; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x == eX, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y == eY, "constraint did not work, pt.y: " + pt.y);
    },
	testIntegrationWithOtherSolvers_FailOnAssignment2: function() {
	    var pt = {x: 1, y: 2},
			cassowary = new ClSimplexSolver();

		cassowary.weight = 10000;
    	bbb.always({
			solver: cassowary,
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x == pt.y;
    	});
		var eX = pt.x, eY = pt.y;
		this.assert(eX == eY, "Cassowary doesnt work");
    	bbb.assert({
			message: "expected error",
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x <= 10;
    	});

        // invalid assignment
		this.assertWithError(
			ContinuousAssertError,
			function() { pt.x = 100; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x == eX, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y == eY, "constraint did not work, pt.y: " + pt.y);
    },
	testIntegrationWithOtherSolvers_FailOnAssertionConstraintConstruction: function() {
	    var pt = {x: 1, y: 2};

    	bbb.always({
			solver: new ClSimplexSolver(),
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x == pt.y;
    	});
    	pt.x = 100;

		this.assertWithError(
			ContinuousAssertError,
			function() {
                bbb.assert({
                    message: "expected error",
                    ctx: {
                        pt: pt
                    }
                }, function() {
                    return pt.x <= 10;
                });
			},
			"no ContinuousAssertError was thrown"
		);

		this.assert(pt.x == 100, "constraint construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y == 100, "constraint construction modified variable, pt.y: " + pt.y);
    },
	testIntegrationWithOtherSolvers_FailOnConstraintConstruction: function() {
	    var pt = {x: 1, y: 2};

        bbb.assert({
            message: "expected error",
            ctx: {
                pt: pt
            }
        }, function() {
            return pt.x <= 10;
        });
		this.assert(pt.x == 1, "constraint construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y == 2, "constraint construction modified variable, pt.y: " + pt.y);

		this.assertWithError(
			Error,
			function() {
                bbb.always({
                    solver: new ClSimplexSolver(),
                    ctx: {
                        pt: pt
                    }
                }, function() {
                    return pt.x == 100;
                });
                console.log(pt.x, pt.y);
			},
			"no Error was thrown"
		);

		this.assert(pt.x == 1, "constraint construction modified variable, pt.x: " + pt.x);
		this.assert(pt.y == 2, "constraint construction modified variable, pt.y: " + pt.y);
    },

});

TestCase.subclass('users.timfelgentreff.reactive.reactive_test.TriggerTest', {
	setUp: function() {
		var Player = function(hp) {
			this.alive = true;
			this.hp = hp;
		};
		Player.prototype.die = function() {
			this.alive = false;
		};

		this.Player = Player;
	},
    testTriggerSolver: function() {
    	var p = new this.Player(2);
    	
    	bbb.trigger({
			callback: p.die.bind(p),
    		ctx: {
    			p: p
    		}
    	}, function() {
   			return p.hp <=  0;
    	});
		this.assert(p.hp === 2, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.alive === true, "constraint construction modified variable, p.alive: " + p.alive);

		// valid assignment
		p.hp--;
		this.assert(p.hp === 1, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === true, "modified unassigned variable, p.alive: " + p.alive);

		// triggering assignment
		p.hp--;
		this.assert(p.hp === 0, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	},
    testRecursiveTriggering: function() {
		var Domino = function(id, next) {
			this.id = id;
			this.next = next;
			this.standing = true;
		};
		Domino.prototype.pushNext = function() {
			if(this.next instanceof Domino) {
				this.next.push();
			}
		};
		Domino.prototype.push = function() {
			this.standing = false;
		};
		
		var domino3 = new Domino(3),
			domino2 = new Domino(2, domino3),
			domino1 = new Domino(1, domino2);
    	
    	bbb.trigger({
			callback: domino1.pushNext.bind(domino1),
    		ctx: {
    			domino1: domino1
    		}
    	}, function() {
   			return !domino1.standing;
    	});
    	bbb.trigger({
			callback: domino2.pushNext.bind(domino2),
    		ctx: {
    			domino2: domino2
    		}
    	}, function() {
   			return !domino2.standing;
    	});
    	bbb.trigger({
			callback: domino3.pushNext.bind(domino3),
    		ctx: {
    			domino3: domino3
    		}
    	}, function() {
   			return !domino3.standing;
    	});
		
		domino1.push();
		this.assert(!domino1.standing, "domino1 still stands");
		this.assert(!domino2.standing, "domino2 still stands");
		this.assert(!domino3.standing, "domino3 still stands");
	},
    testImmediateTrigger: function() {
    	var p = new this.Player(-5);
    	
    	bbb.trigger({
			callback: p.die.bind(p),
    		ctx: {
    			p: p
    		}
    	}, function() {
   			return p.hp <=  0;
    	});
		this.assert(p.hp === -5, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	},
    testOneTimeTrigger: function() {
    	var p = {
			hp: 10,
			lives: 2
		};
    	
    	bbb.trigger({
			callback: function() {
				p.lives--;
			},
    		ctx: {
    			p: p
    		}
    	}, function() {
   			return p.hp <=  0;
    	});
		this.assert(p.hp === 10, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.lives === 2, "constraint construction modified variable, p.lives: " + p.lives);

		// trigger activation
		p.hp = -1;
		this.assert(p.lives === 1, "callback not triggered correctly (1), p.lives: " + p.lives);

		// no trigger activation
		p.hp = -2;
		this.assert(p.lives === 1, "callack activated again without reset, p.lives: " + p.lives);
	},
    testResetOnFalse: function() {
    	var p = {
			hp: 10,
			lives: 2
		};
    	
    	bbb.trigger({
			callback: function() {
				p.lives--;
				if(p.lives === 0)
					this.disable();
			},
    		ctx: {
    			p: p
    		}
    	}, function() {
   			return p.hp <=  0;
    	});
		this.assert(p.hp === 10, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.lives === 2, "constraint construction modified variable, p.lives: " + p.lives);

		// valid assignment
		p.hp = -1;
		this.assert(p.lives === 1, "callback not triggered correctly (1), p.lives: " + p.lives);

		p.hp = -2;
		this.assert(p.lives === 1, "callack activated again without reset, p.lives: " + p.lives);

		// reactivate trigger
		p.hp = 10;
		
		// calls callback (should disable the trigger)
		p.hp = -1;
		this.assert(p.lives === 0, "callback not triggered correctly (2), p.lives: " + p.lives);

		// for reactivation
		p.hp = 10;

		// non-triggering assignments
		p.hp = -1;
		this.assert(p.lives === 0, "callback triggered again, p.lives: " + p.lives);
	},
    testResetValue: function() {
    	var p = {
			hp: 10,
			lives: 2
		};
    	
    	bbb.trigger({
			callback: function() {
				p.lives--;
				p.hp = 10;
			},
    		ctx: {
    			p: p
    		}
    	}, function() {
   			return p.hp <=  0;
    	});
		this.assert(p.lives === 2, "constraint construction modified variable, p.lives: " + p.lives);
		this.assert(p.hp === 10, "constraint construction modified variable, p.hp: " + p.hp);

		// valid assignment
		p.hp = -1;
		this.assert(p.lives === 1, "callback not triggered correctly (1), p.lives: " + p.lives);
		this.assert(p.hp === 10, "variable that initiates the trigger could not be reset in callback, p.hp: " + p.hp);
	},
	testTriggerIntegrationWithOtherSolvers: function() {
	    var pt = {x: 1, y: 2, z: 3},
	        callbackCalled = false;

    	bbb.always({
			solver: new ClSimplexSolver(),
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.y == pt.z;
    	});
    	bbb.trigger({
			callback: function() {
			    callbackCalled = true;
			},
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.z == 10;
    	});
    	bbb.always({
			solver: new DBPlanner(),
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x == pt.y;
    	});

        pt.x = 10;
		this.assert(callbackCalled, "callback was not called");
	},
	testTriggerOtherSolvers: function() {
	    var pt = {x: 1, y: 2},
	        pt2 = {x: 1, y: 2},
            callbackCalled = false,
	        db = new DBPlanner();

    	bbb.always({
			solver: db,
    		ctx: {
    			pt2: pt2
    		}
    	}, function() {
   			return pt2.x == pt2.y;
    	});
    	bbb.trigger({
			callback: function() {
			    callbackCalled = true;
			    pt2.x = 12;
			},
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.y == 10;
    	});
    	bbb.always({
			solver: db,
    		ctx: {
    			pt: pt
    		}
    	}, function() {
   			return pt.x == pt.y;
    	});

        pt.x = 10;
		this.assert(pt.x = 10, "assignment did not work, pt.x: " + pt.x);
		this.assert(pt.y = 10, "assignment did not work, pt.y: " + pt.y);
		this.assert(callbackCalled, "callback was not called");
		this.assert(pt2.x = 12, "assignment did not work, pt2.x: " + pt2.x);
		this.assert(pt2.y = 12, "assignment did not work, pt2.y: " + pt2.y);
	},
	testWhenTriggerNotation: function() {
		var p = {
			hp: 10,
			lives: 2
		};
		
		bbb.when({
			ctx: {
				p: p
			}
		}, function() {
			return p.hp <=  0;
		}).trigger(function() {
			p.lives--;
			p.hp = 10;
		});

		this.assert(p.lives === 2, "constraint construction modified variable, p.lives: " + p.lives);
		this.assert(p.hp === 10, "constraint construction modified variable, p.hp: " + p.hp);

		// valid assignment
		p.hp = -1;
		this.assert(p.lives === 1, "callback not triggered correctly (1), p.lives: " + p.lives);
		this.assert(p.hp === 10, "variable that initiates the trigger could not be reset in callback, p.hp: " + p.hp);
	},
	testWhenTriggerDelegate: function() {
		var p = {
			hp: 10,
			lives: 2
		},
		expectedReturnObject = {},
		actualCtx,
		actualConstraint,
		expectedConstraint = function() {
			return p.hp <=  0;
		},
		expectedOpts = {
			ctx: {
				p: p
			}
		},
		expectedCallback = function() {
			p.lives--;
			p.hp = 10;
		};
		
		var bbbTrigger = bbb.trigger;
		bbb.trigger = function mock() {
			actualCtx = arguments[0];
			actualConstraint = arguments[1];
			
			return expectedReturnObject;
		};
		
		try {
			var c = bbb
				.when(expectedOpts, expectedConstraint)
				.trigger(expectedCallback);

			this.assert(expectedOpts === actualCtx);
			this.assert(expectedOpts.callback === expectedCallback);
			this.assert(expectedConstraint === actualConstraint);
			this.assert(expectedReturnObject === c);
		} finally {
			bbb.trigger = bbbTrigger;
		}
	}
});

TestCase.subclass('users.timfelgentreff.reactive.reactive_test.LayerActivationTest', {
    testLayerActivationSolver: function() {
		// TODO: rename trigger in test for clarification
		var the = {
			condition: false,
			answer: function() {
				return 17;
			}
		};

		cop.create("correction")
			.refineObject(the, {
				answer: function() {
				var oldAnswer = cop.proceed();
					return oldAnswer + 25;
				}
			})
			.activeOn({
				ctx: {
					the: the
				}
			}, function() {
				return the.condition === true;
			});

		this.assert(the.answer() === 17, "not the correct answer, but " + the.answer());
		
		the.condition = true;
		this.assert(the.answer() === 42, "layer not correctly activated, the.answer(): " + the.answer());
		
		the.condition = false;
		this.assert(the.answer() === 17, "layer not correctly de-activated, the.answer(): " + the.answer());
	},
	// TODO
    testImmediateTriggerOnAvtivationDefinition: function() {
	}
});

TestCase.subclass('users.timfelgentreff.reactive.reactive_test.ScopedConstraintsTest', {
    testScopedConstraints: function() {
		var temperature = {
			celsius: 0,
			fahrenheit: 0
		};

		cop.create("synchronization3")
			.always({
				solver: new ClSimplexSolver(),
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius * 1.8 == temperature.fahrenheit - 32;
			});
		this.assert(temperature.celsius === 0, "attributes changed without modification; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === 0, "attributes changed without modification; temperature.fahrenheit: " + temperature.fahrenheit);
		
		// unconstrained assignment
		temperature.celsius = 17;
		this.assert(temperature.celsius === 17, "assignment did not work; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === 0, "value changed although no constraint was enabled; temperature.fahrenheit: " + temperature.fahrenheit);
		
		// layer activation
		synchronization3.beGlobal();
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		
		// constrained assignment
		temperature.celsius = 20;
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint is not fulfilled after constrained assignment; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		this.assert(temperature.celsius === 20, "assignment did not work; temperature.celsius: " + temperature.celsius);

		var prevCelsius = temperature.celsius;
		var prevFahrenheit = temperature.fahrenheit;
		
		// layer deactivation
		synchronization3.beNotGlobal();
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		this.assert(temperature.celsius === prevCelsius, "value changed during layer de-activation; temperature.celsius: " + temperature.celsius + ", previous value: " + prevCelsius);
		this.assert(temperature.fahrenheit === prevFahrenheit, "value changed during layer de-activation; temperature.fahrenheit: " + temperature.fahrenheit + ", previous value: " + prevFahrenheit);

		// unconstrained assignment
		temperature.celsius = 42;
		this.assert(temperature.celsius === 42, "assignment did not work; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === prevFahrenheit, "value of unassigned variable changed; temperature.fahrenheit: " + temperature.fahrenheit);
	},
    testWithLayers: function() {
		var prevFahrenheit, temperature = {
			celsius: 0,
			fahrenheit: 0
		};

		cop.create("synchronization1")
			.always({
				solver: new ClSimplexSolver(),
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius * 1.8 == temperature.fahrenheit - 32;
			});
		
		var testcase = this;
		cop.withLayers([synchronization1], function() {
			testcase.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);

			// constrained assignment
			temperature.celsius = 20;
			testcase.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint is not fulfilled after constrained assignment; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
			testcase.assert(temperature.celsius === 20, "assignment did not work; temperature.celsius: " + temperature.celsius);

			prevFahrenheit = temperature.fahrenheit;
		});
		
		// unconstrained assignment
		temperature.celsius = 42;
		this.assert(temperature.celsius === 42, "assignment did not work; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === prevFahrenheit, "value of unassigned variable changed; temperature.fahrenheit: " + temperature.fahrenheit);
	},
    testAlwaysWithAlreadyActivatedLayer: function() {
		var prevFahrenheit, temperature = {
			celsius: 10,
			fahrenheit: 0
		};

		cop.create("synchronization2")
			.activeOn({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius >= 5;
			})
			.always({
				solver: new ClSimplexSolver(),
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius * 1.8 == temperature.fahrenheit - 32;
			});
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		
		// unconstrained assignment
		temperature.celsius = 42;
		this.assert(temperature.celsius === 42, "assignment did not work; temperature.celsius: " + temperature.celsius);
		// TODO: check constraint
	},
    testScopedAssert: function() {
		var temperature = {
			celsius: 10,
			sense: false
		};

		cop.create("thermometer")
			.activeOn({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.sense === true;
			})
			.assert({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius > -273;
			});
		
		temperature.celsius = -1000;
		temperature.celsius = 10;
		
		temperature.sense = true
		new users.timfelgentreff.reactive.reactive_test.AssertTest().assertWithError(
			ContinuousAssertError,
			function() {
				temperature.celsius = -1000;
			},
			"no ContinuousAssertError was thrown"
		);
		this.assert(temperature.celsius === 10, "revert did not work; temperature.celsius: " + temperature.celsius);
	},
    testScopedAssertBreaksImmediatly: function() {
		var temperature = {
			celsius: -1000,
			sense: false
		};

		cop.create("thermometer")
			.activeOn({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.sense === true;
			})
			.assert({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.celsius > -273;
			});
		
		temperature.celsius = -1000;
		
		new users.timfelgentreff.reactive.reactive_test.AssertTest().assertWithError(
			ContinuousAssertError,
			function() {
				// trigger that activates an immediately breaking assertion
				temperature.sense = true
			},
			"no ContinuousAssertError was thrown"
		);
	},
    testScopedTrigger: function() {
		var count = 0, obj = {
			activated: false,
			trigger: false,
			action: function() {
				count++;
			}
		};
    	
		cop.create("triggerLayer")
			.activeOn({
				ctx: {
					obj: obj
				}
			}, function() {
				return obj.activated === true;
			})
			.trigger({
				callback: obj.action.bind(obj),
				ctx: {
					obj: obj
				}
			}, function() {
				return obj.trigger === true;
			});
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "trigger variable was changed");

		// unactivated trigger
		obj.trigger = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === true, "assignment did not work");
		
		// reset trigger
		obj.trigger = false;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "assignment did not work");

		// activate layer
		obj.activated = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === true, "assignment did not work");
		this.assert(obj.trigger === false, "trigger unintentionally initiated");
		this.assert(triggerLayer.isGlobal(), "layer not active");

		// activated triggering
		obj.trigger = true;
		this.assert(count === 1, "action not triggered once, count: " + count);
		this.assert(obj.activated === true, "modified unassigned variables");
		this.assert(obj.trigger === true, "assignment did not work");
		this.assert(triggerLayer.isGlobal(), "layer not active");
	}
});

TestCase.subclass('users.timfelgentreff.reactive.reactive_test.UnifiedNotationTest', {
    testPredicateOnce: function() {
		var vector = { x: 2, y: 5 };

        predicate(function() {
            return vector.x == vector.y
        }, {
            ctx: { vector: vector }
        }).once({ solver: new ClSimplexSolver() });

		this.assert(vector.x == vector.y, "constraint not solved: vector.x: " + vector.x + ", vector.y:" + vector.y);

        var expectedX = vector.x;
        vector.y = 42

		this.assert(vector.x == expectedX, "unconstrained variable modified: vector.x: " + vector.x);
		this.assert(vector.y == 42, "assignment did not work: vector.y: " + vector.y);
	},
    testPredicateAlways: function() {
		var vector = { x: 2, y: 5 };

        predicate(function() {
            return vector.x == vector.y
        }, {
            ctx: { vector: vector }
        }).always({ solver: new ClSimplexSolver() });

		this.assert(vector.x == vector.y, "constraint not solved: vector.x: " + vector.x + ", vector.y:" + vector.y);

        vector.x = 42;

		this.assert(vector.x == vector.y, "constraint not solved: vector.x: " + vector.x + ", vector.y:" + vector.y);
		this.assert(vector.x == 42, "assignment did not work: vector.x: " + vector.x);
	},
    testPredicateAssert: function() {
    	var pt = {x: 1, y: 2};

        predicate(function() {
   			return pt.y > pt.x;
        }, {
            ctx: { pt: pt }
        }).assert({ message: "expected error" });

		new users.timfelgentreff.reactive.reactive_test.AssertTest().assertWithError(
			ContinuousAssertError,
			function() { pt.y = -1; },
			"no ContinuousAssertError was thrown"
		);
		this.assert(pt.x === 1, "another variable was modified, pt.x: " + pt.x);
		this.assert(pt.y === 2, "assignment not reverted, pt.y: " + pt.y);
	},
    testPredicateTrigger: function() {
    	var p = {
    	    hp: 2,
    	    alive: true
  	    };

        predicate(function() {
            return p.hp <=  0;
        }, {
            ctx: {
                p: p
            }
        }).trigger(function() {
            p.alive = false;
        });

		this.assert(p.hp === 2, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.alive === true, "constraint construction modified variable, p.alive: " + p.alive);

		// valid assignment
		p.hp--;
		this.assert(p.hp === 1, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === true, "modified unassigned variable, p.alive: " + p.alive);

		// triggering assignment
		p.hp--;
		this.assert(p.hp === 0, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	},
    testPredicateActivator: function() {
		var the = {
			condition: false,
			answer: function() {
				return 17;
			}
		};

	    predicate(function() {
            return the.condition === true;
        }, {
            ctx: {
                the: the
            }
        }).activate(
            new Layer()
                .refineObject(the, {
                    answer: function() {
                    var oldAnswer = cop.proceed();
                        return oldAnswer + 25;
                    }
                })
        );

		this.assert(the.answer() === 17, "not the correct answer, but " + the.answer());

		the.condition = true;
		this.assert(the.answer() === 42, "layer not correctly activated, the.answer(): " + the.answer());

		the.condition = false;
		this.assert(the.answer() === 17, "layer not correctly de-activated, the.answer(): " + the.answer());
	},
    testPredicateTriggerOnce: function() {
    	var p = {
    	    hp: 2,
    	    alive: true
  	    };

        var pred = predicate(function() {
            return p.hp <=  0;
        }, {
            ctx: {
                p: p
            }
        })

        pred.trigger(function() {
            p.alive = false;
        });

		this.assert(p.hp === 2, "constraint construction modified variable, p.hp: " + p.hp);
		this.assert(p.alive === true, "constraint construction modified variable, p.alive: " + p.alive);

		// one-shot constraint triggering callback
        pred.once({ solver: new ClSimplexSolver() });

		this.assert(p.hp === 0, "assignment did not work, p.hp: " + p.hp);
		this.assert(p.alive === false, "desired callback was not triggered");
	},
    testLayerPredicateAlways: function() {
		var temperature = {
			celsius: 0,
			fahrenheit: 0
		};

        var layer = new Layer();

        layer.predicate(function() {
            return temperature.celsius * 1.8 == temperature.fahrenheit - 32;
        }, {
            ctx: {
                temperature: temperature
            }
        }).always({ solver: new ClSimplexSolver() });

		this.assert(temperature.celsius === 0, "attributes changed without modification; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === 0, "attributes changed without modification; temperature.fahrenheit: " + temperature.fahrenheit);

		// unconstrained assignment
		temperature.celsius = 17;
		this.assert(temperature.celsius === 17, "assignment did not work; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === 0, "value changed although no constraint was enabled; temperature.fahrenheit: " + temperature.fahrenheit);

		// layer activation
		layer.beGlobal();
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);

		// constrained assignment
		temperature.celsius = 20;
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint is not fulfilled after constrained assignment; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		this.assert(temperature.celsius === 20, "assignment did not work; temperature.celsius: " + temperature.celsius);

		var prevCelsius = temperature.celsius;
		var prevFahrenheit = temperature.fahrenheit;

		// layer deactivation
		layer.beNotGlobal();
		this.assert(temperature.celsius * 1.8 == temperature.fahrenheit - 32, "constraint was not solved after layer activation; temperature.celsius: " + temperature.celsius + ", temperature.fahrenheit: " + temperature.fahrenheit);
		this.assert(temperature.celsius === prevCelsius, "value changed during layer de-activation; temperature.celsius: " + temperature.celsius + ", previous value: " + prevCelsius);
		this.assert(temperature.fahrenheit === prevFahrenheit, "value changed during layer de-activation; temperature.fahrenheit: " + temperature.fahrenheit + ", previous value: " + prevFahrenheit);

		// unconstrained assignment
		temperature.celsius = 42;
		this.assert(temperature.celsius === 42, "assignment did not work; temperature.celsius: " + temperature.celsius);
		this.assert(temperature.fahrenheit === prevFahrenheit, "value of unassigned variable changed; temperature.fahrenheit: " + temperature.fahrenheit);
	},
    testLayerPredicateOnce: function() {
		var vector = { x: 2, y: 5 };

        var layer = new Layer(),
            pred = layer.predicate(function() {
                return vector.x == vector.y
            }, {
                ctx: { vector: vector }
            });

        pred.once({ solver: new ClSimplexSolver() });

		this.assert(vector.x == 2, "variable unexpectedly modified: vector.x: " + vector.x);
		this.assert(vector.y == 5, "variable unexpectedly modified: vector.y: " + vector.y);

        layer.beGlobal();
        pred.once({ solver: new ClSimplexSolver() });

		this.assert(vector.x == vector.y, "constraint not solved: vector.x: " + vector.x + ", vector.y:" + vector.y);

        var expectedX = vector.x;
        vector.y = 42

		this.assert(vector.x == expectedX, "unconstrained variable modified: vector.x: " + vector.x);
		this.assert(vector.y == 42, "assignment did not work: vector.y: " + vector.y);
	},
    testLayerPredicateAssert: function() {
		var temperature = {
			celsius: 10,
			sense: false
		};

		new Layer()
			.activeOn({
				ctx: {
					temperature: temperature
				}
			}, function() {
				return temperature.sense === true;
			})
			.predicate(function() {
                return temperature.celsius > -273;
            }, {
                ctx: {
                    temperature: temperature
                }
            }).assert();

		temperature.celsius = -1000;
		temperature.celsius = 10;

		temperature.sense = true
		new users.timfelgentreff.reactive.reactive_test.AssertTest().assertWithError(
			ContinuousAssertError,
			function() {
				temperature.celsius = -1000;
			},
			"no ContinuousAssertError was thrown"
		);
		this.assert(temperature.celsius === 10, "revert did not work; temperature.celsius: " + temperature.celsius);
	},
    testLayerPredicateTrigger: function() {
		var count = 0, obj = {
			activated: false,
			trigger: false,
			action: function() {
				count++;
			}
		};

		cop.create("triggerLayer")
			.activeOn({
				ctx: {
					obj: obj
				}
			}, function() {
				return obj.activated === true;
			})
			.predicate(function() {
                return obj.trigger === true;
            }, {
                ctx: {
                    obj: obj
                }
            }).trigger(obj.action.bind(obj));
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "trigger variable was changed");

		// unactivated trigger
		obj.trigger = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === true, "assignment did not work");

		// reset trigger
		obj.trigger = false;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "assignment did not work");

		// activate layer
		obj.activated = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === true, "assignment did not work");
		this.assert(obj.trigger === false, "trigger unintentionally initiated");
		this.assert(triggerLayer.isGlobal(), "layer not active");

		// activated triggering
		obj.trigger = true;
		this.assert(count === 1, "action not triggered once, count: " + count);
		this.assert(obj.activated === true, "modified unassigned variables");
		this.assert(obj.trigger === true, "assignment did not work");
		this.assert(triggerLayer.isGlobal(), "layer not active");
	},
    testLayerPredicateTrigger: function() {
		var count = 0, obj = {
			activated: false,
			trigger: false,
			action: function() {
				count++;
			}
		};

		var layer = new Layer();
	    layer.activeOn({
				ctx: {
					obj: obj
				}
			}, function() {
				return obj.activated === true;
			});
	    layer.predicate(function() {
                return obj.trigger === true;
            }, {
                ctx: {
                    obj: obj
                }
            }).trigger(obj.action.bind(obj));

		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "trigger variable was changed");

		// unactivated trigger
		obj.trigger = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === true, "assignment did not work");

		// reset trigger
		obj.trigger = false;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === false, "layer was unintentionally activated");
		this.assert(obj.trigger === false, "assignment did not work");

		// activate layer
		obj.activated = true;
		this.assert(count === 0, "action was already triggered, count: " + count);
		this.assert(obj.activated === true, "assignment did not work");
		this.assert(obj.trigger === false, "trigger unintentionally initiated");
		this.assert(layer.isGlobal(), "layer not active");

		// activated triggering
		obj.trigger = true;
		this.assert(count === 1, "action not triggered once, count: " + count);
		this.assert(obj.activated === true, "modified unassigned variables");
		this.assert(obj.trigger === true, "assignment did not work");
		this.assert(layer.isGlobal(), "layer not active");
	},
    testLayerPredicateActivate: function() {
		var obj = {
		    layerShouldBeActive: false,
			layerActivated: function() { return false; }
		};

		var activatedLayer = new Layer()
		    .refineObject(obj, {
		        layerActivated: function() { return true; }
		    });

		var scopingLayer = new Layer();
		scopingLayer.predicate(function() {
            return obj.layerShouldBeActive;
        }, {
            ctx: {
                obj: obj
            }
        })
        .activate(activatedLayer);

		this.assert(!scopingLayer.isGlobal(), "layer unexpectedly active(1)");
		this.assert(!activatedLayer.isGlobal(), "layer unexpectedly active(2)");
		this.assert(obj.layerActivated() === false, "object unexpectedly refined");

        // activator predicate fulfilled but scoping layer not active
		obj.layerShouldBeActive = true;
		this.assert(!scopingLayer.isGlobal(), "layer unexpectedly active(3)");
		this.assert(!activatedLayer.isGlobal(), "layer unexpectedly active(4)");
		this.assert(obj.layerActivated() === false, "object unexpectedly refined");

        // activate scoping layer
        scopingLayer.beGlobal();
		this.assert(scopingLayer.isGlobal(), "layer unexpectedly active(5)");
		this.assert(activatedLayer.isGlobal(), "layer unexpectedly active(6)");
		this.assert(obj.layerActivated() === true, "object unexpectedly refined");

        // reset predicate and scoping layer
		obj.layerShouldBeActive = false;
		scopingLayer.beNotGlobal();
		this.assert(!scopingLayer.isGlobal(), "layer unexpectedly active(5)");
		this.assert(!activatedLayer.isGlobal(), "layer unexpectedly active(6)");
		this.assert(obj.layerActivated() === false, "object unexpectedly refined");
	},
});

}); // end of module
