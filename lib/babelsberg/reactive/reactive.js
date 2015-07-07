module('users.timfelgentreff.reactive.reactive').requires('users.timfelgentreff.babelsberg.constraintinterpreter', 'cop.Layers').toRun(function() {

	JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

	/***************************************************************
	 * Abstract Reactive Solver
	 ***************************************************************/
	
	Object.subclass("ReactiveSolver", {
	    isConstraintObject: true,
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        var cobj = new Constraint(func, this);
			cobj.allowFailing = true;
	        cobj.addPrimitiveConstraint(new ReactiveSolver.Constraint(this, cobj, func));
			try {
				if(!opts.postponeEnabling) { cobj.enable(); }
			} catch(e) {
				if(e instanceof ContinuousAssertError) {
					cobj.disable();
				}
				throw e;
			}
	        return cobj;
	    },
	    constraintVariableFor: function(value, ivarname, bbbCVar) {
	    	return new ReactiveSolver.Variable(this, value, ivarname, bbbCVar);
	    },
		constraintEnabled: function() {
	    	return this.constraint &&
				this.constraint.enabled &&
				typeof this.constraint.predicate === "function";
		},
	    weight: 10000
	});
	
	Object.subclass("ReactiveSolver.Variable", {
	    isConstraintObject: true,
		initialize: function(solver, value, ivarname, bbbCVar) {
			this.solver = solver;
			this.__val__ = value;
			this.enabled = false;
		},
	    suggestValue: function(value) {
			if(this.__val__ === value) { return value; }
			var prev = this.__val__;
	    	this.__val__ = value;
			try {
				this.solver.solve();
			} catch(e) {
				// revert value in case of a violated assertion
				if(e instanceof ContinuousAssertError) {
					this.__val__ = prev;
				}
				throw e;
			}

			// re-constrain variables
			if (typeof(value) == 'object' || typeof(value) == 'function') {
			    // only recalculate to reconstraint complex objects
                var bbbConstraint = this.solver.constraint.bbbConstraint;
                var enabled = bbbConstraint._enabled;
                bbbConstraint.initialize(bbbConstraint.predicate, bbbConstraint.solver);
                bbbConstraint.addPrimitiveConstraint(this.solver.constraint);
                if(enabled) bbbConstraint.enable();
			}

	    	return this.__val__;
	    },
	    value: function() {
	    	return this.__val__;
	    },
	    setReadonly: function(bool) {
	    	this.readonly = bool;
	    },
	    isReadonly: function() {
	        return this.readonly;
	    },
	    cnEquals: function() {
	        return new ReactiveSolver.PrimitiveConstraint(this, arguments);
	    },
	    enable: function() {
			this.enabled = true;
	    },
	    disable: function() {
			this.enabled = false;
	    }
	});
	
	Object.subclass("ReactiveSolver.PrimitiveConstraint", {
	    isConstraintObject: true,
	    initialize: function(variable, args) {
			this.enabled = false;
	    	this.solver = variable.solver;
	    },
	    enable: function() {
			this.enabled = true;
	    },
	    disable: function() {
			this.enabled = false;
	    }
	});
	
	Object.subclass("ReactiveSolver.Constraint", {
	    isConstraintObject: true,
	    initialize: function(solver, bbbConstraint, func) {
			this.enabled = false;
	    	this.solver = solver;
	    	this.solver.constraint = this;
			this.bbbConstraint = bbbConstraint;

	    	this.predicate = func;
	    },
	    enable: function() {
			this.enabled = true;
	    },
	    disable: function() {
			this.enabled = false;
	    }
	});
	
	/***************************************************************
	 * Continuous asserts
	 ***************************************************************/
	
	// TODO: integration with other solvers
	
	Error.subclass("ContinuousAssertError", {
		initialize: function ContinuousAssertError(msg) {
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, ContinuousAssertError);
			} else {
				this.stack = (new Error).stack || '';
			}
			this.message = msg;
		},
		name: "ContinuousAssertError"
	});
	
	ReactiveSolver.subclass("AssertSolver", {
		initialize: function(message) {
			this.message = message;
		},
	    solve: function() {
	    	if(!this.constraintEnabled()) { return; }
            if(!this.constraint.predicate()) {
                throw new ContinuousAssertError(this.message);
            }
	    }
	});
ReactiveSolver.subclass("RecalculateSolver", {
		initialize: function(message) {
			this.message = message;
		},
	    always: function(opts, func) {
	        var ctx = opts.ctx;
	        func.varMapping = ctx;
	        this.constraint = new Constraint(func, this);
	        this.predicate = func;
			this.constraint.allowFailing = true;
			try {
				if(!opts.postponeEnabling) { this.constraint.enable(); }
			} catch(e) {
				if(e instanceof ContinuousAssertError) {
					this.constraint.disable();
				}
				throw e;
			}
	        return this.constraint;
	    },
	    solve: function() {
	        debugger
	    	if(this.constraint && this.constraint.enabled)
	    		this.constraint.bbbConstraint.initialize(this.constraint.predicate, this);
	    }
	});
Object.extend(Babelsberg.prototype, {
		assert: function(opts, func) {
			opts.solver = new AssertSolver(opts.message);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        return this.always(opts, func);
		}
	});

	/***************************************************************
	 * Triggering
	 ***************************************************************/
	ReactiveSolver.subclass("TriggerSolver", {
		initialize: function(callback) {
			this.callback = callback;
			this.previouslyFulfilled = false;
		},
	    solve: function() {
	    	if(!this.constraintEnabled()) { return; }
	    	var predicateFulfilled = this.constraint.predicate();

            if(predicateFulfilled && !this.previouslyFulfilled) {
                bbb.addCallback(this.callback, this.constraint.bbbConstraint, []);
            }
            this.previouslyFulfilled = predicateFulfilled;
	    },
	    weight: 10
	});
	
	Object.subclass("__TriggerDefinition__", {
		initialize: function(opts, func) {
			this.opts = opts;
			this.func = func;
		},
	    trigger: function(callback) {
			this.opts.callback = callback;
			return bbb.trigger(this.opts, this.func);
		}
	});

	Object.extend(Babelsberg.prototype, {
		trigger: function(opts, func) {
			opts.solver = new TriggerSolver(opts.callback);
			opts.allowUnsolvableOperations = true;
			opts.allowTests = true;
			//opts.debugging = true;
	        return this.always(opts, func);
		},
		when: function(opts, func) {
			return new __TriggerDefinition__(opts, func);
		}
	});

	/***************************************************************
	 * Layer activation
	 ***************************************************************/
	// TODO: rename to ActivatorSolver
	ReactiveSolver.subclass("LayerActivationSolver", {
		initialize: function(layer) {
			this.layer = layer;
		},
	    solve: function() {
	    	if(!this.constraintEnabled()) { return; }
            var layerIsGlobal = this.layer.isGlobal(),
                predicateFulfilled = this.constraint.predicate();

            if(predicateFulfilled && !layerIsGlobal) {
                this.layer.beGlobal();
            } else if(!predicateFulfilled && layerIsGlobal) {
                this.layer.beNotGlobal();
            }
	    },
	    weight: 10
	});

    var activator = function(opts, func, layer) {
        opts.solver = new LayerActivationSolver(layer);
        opts.allowUnsolvableOperations = true;
        opts.allowTests = true;
        //opts.debugging = true;
        return bbb.always(opts, func);
    }

	Object.extend(Layer.prototype, {
		activeOn: function(opts, func) {
		    activator(opts, func, this);

			return this;
		}
	});
	
	/***************************************************************
	 * Scoped constraints
	 ***************************************************************/
	Object.extend(Layer.prototype, {
		always: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.always(opts, func);

			this._constraintObjects = this._constraintObjects || [];
			this._constraintObjects.push(cobj);

			return cobj;
		},
		assert: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.assert(opts, func);

			this._constraintObjects = this._constraintObjects || [];
			this._constraintObjects.push(cobj);

			return cobj;
		},
		trigger: function(opts, func) {
			opts.postponeEnabling = !this.isGlobal();
			var cobj = bbb.trigger(opts, func);

			this._constraintObjects = this._constraintObjects || [];
			this._constraintObjects.push(cobj);

			return cobj;
		},
		_enableConstraints: function() {
			this._constraintObjects = this._constraintObjects || [];
			this._constraintObjects.forEach(function(cobj) {
				cobj.enable();
			});
		},
		_disableConstraints: function() {
			this._constraintObjects = this._constraintObjects || [];
			this._constraintObjects.forEach(function(cobj) {
				cobj.disable();
			});
		}
	});

	/* Control Flow-based Layer Activation */
	cop.withLayers = cop.withLayers.wrap(function(callOriginal, layers, func) {
		layers.forEach(function(layer) { layer._enableConstraints(); });

		try {
			return callOriginal(layers, func);
		} finally {
			layers.forEach(function(layer) { layer._disableConstraints(); });
		}
	});

	cop.withoutLayers = cop.withoutLayers.wrap(function(callOriginal, layers, func) {
		layers.forEach(function(layer) { layer._disableConstraints(); });
		
		try {
			return callOriginal(layers, func);
		} finally {
			layers.forEach(function(layer) { layer._enableConstraints(); });
		}
	});

	/* Global Layer Activation */
	cop.enableLayer = cop.enableLayer.wrap(function(callOriginal, layer) {
		layer._enableConstraints();
		return callOriginal(layer);
	});

	cop.disableLayer = cop.disableLayer.wrap(function(callOriginal, layer) {
		layer._disableConstraints();
		return callOriginal(layer);
	});

	/***************************************************************
	 * Unified Notation
	 ***************************************************************/

	Object.subclass("Predicate", {
	    initialize: function(func, opts) {
            this.func = func;
            this.opts = opts;
	    },
	    _mergeOptions: function(options1, options2) {
	        var mergedOptions = {};

            Object.extend(mergedOptions, options1);
            Object.extend(mergedOptions, options2);

            return mergedOptions;
	    },
	    once: function(opts) {
	    	return bbb.once(
	    	    this._mergeOptions(this.opts, opts),
	    	    this.func
	    	);
	    },
	    always: function(opts) {
	    	return bbb.always(
	    	    this._mergeOptions(this.opts, opts),
	    	    this.func
	    	);
	    },
	    assert: function(opts) {
	    	return bbb.assert(
	    	    this._mergeOptions(this.opts, opts),
	    	    this.func
	    	);
	    },
	    trigger: function(callback) {
	    	return bbb.trigger(
                this._mergeOptions(this.opts, { callback: callback }),
                this.func
	    	);
	    },
	    activate: function(layer) {
	    	return activator(
                this.opts,
                this.func,
                layer
	    	);
	    }
	});

	Predicate.subclass("LayeredPredicate", {
	    initialize: function($super, func, opts, layer) {
            $super(func, opts);
            this.layer = layer;
	    },
	    once: function($super, opts) {
	        if(!this.layer.isGlobal()) return;

	    	return $super(opts);
	    },
	    always: function(opts) {
	    	return this.layer.always(
	    	    this._mergeOptions(this.opts, opts),
	    	    this.func
	    	);
	    },
	    assert: function(opts) {
	    	return this.layer.assert(
	    	    this._mergeOptions(this.opts, opts),
	    	    this.func
	    	);
	    },
	    trigger: function(callback) {
            return this.layer.trigger(
                this._mergeOptions(this.opts, { callback: callback }),
                this.func
            );
	    },
	    activate: function(layer) {
			var cobj = activator(
                this._mergeOptions(this.opts, { postponeEnabling: !this.layer.isGlobal() }),
                this.func,
                layer
	    	);

			this.layer._constraintObjects = this.layer._constraintObjects || [];
			this.layer._constraintObjects.push(cobj);

			return cobj;
	    }
	});

	predicate = function(func, opts) {
        return new Predicate(func, opts);
	}

	Object.extend(Layer.prototype, {
		predicate: function(func, opts) {
		    return new LayeredPredicate(func, opts, this);
		}
	});
});
