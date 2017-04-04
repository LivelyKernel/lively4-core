module('users.timfelgentreff.babelsberg.cassowary_ext').
requires('users.timfelgentreff.cassowary.DwarfCassowary').toRun(function() {

ClSimplexSolver.addMethods({
    isConstraintObject: true,
    constraintVariableFor: function(value, ivarname) {
        if ((typeof(value) == 'number') ||
            (value === null) ||
            (value instanceof Number)) {
            var v = new ClVariable(value + 0 /* coerce back into primitive */);
            v.solver = this;
            v.stay();
            return v;
        } else {
            return null;
        }
    },
    get strength() {
        return ClStrength;
    },
    weight: 1000,
    always: function(opts, func) {
        var ctx = opts.ctx,
            priority = this.strength[opts.priority];
        func.varMapping = ctx;
        var constraint = new Constraint(func, this);
        constraint.priority = priority;
        return constraint;
    }
});

Object.extend(ClSimplexSolver, {
    getInstance: function() {
        if (!this['$$instance']) {
            this['$$instance'] = new ClSimplexSolver();
            this['$$instance'].setAutosolve(false);
        }
        return this['$$instance'];
    },

    resetInstance: function() {
        this['$$instance'] = undefined;
    }
});

ClAbstractVariable.addMethods({
    isConstraintObject: true,

    stay: function(strength) {
        var cn = new ClStayConstraint(this, strength || ClStrength.weak, 1.0);
        this.solver.addConstraint(cn);
        this.stayConstraint = cn;
        return cn;
    },
    removeStay: function() {
        if (this.stayConstraint) {
            try {
                this.solver.removeConstraint(this.stayConstraint);
            } catch (_) {
                this.stayConstraint = null;
            }
        }
    },




    suggestValue: function(value) {
        var c = this.cnEquals(value),
            s = this.solver;
        s.addConstraint(c);
        try {
            s.solve();
        } finally {
            s.removeConstraint(c);
        }
    },
    setReadonly: function(bool) {
        if (bool && !this.readonlyConstraint) {
            var cn = new ClStayConstraint(this, ClStrength.required, 1.0);
            this.solver.addConstraint(cn);
            this.readonlyConstraint = cn;
            return cn;
        } else if (!bool && this.readonlyConstraint) {
            this.solver.removeConstraint(this.readonlyConstraint);
            this.readonlyConstraint = undefined;
        }
    },
    isReadonly: function() {
        return !!this.readonlyConstraint;
    },



    plus: function(value) {
        return new ClLinearExpression(this).plus(value);
    },

    minus: function(value) {
        return (new ClLinearExpression(this)).minus(value);
    },

    times: function(value) {
        return new ClLinearExpression(this).times(value);
    },

    divide: function(value) {
        return new ClLinearExpression(this).divide(value);
    },

    cnGeq: function(value) {
        return new ClLinearExpression(this).cnGeq(value);
    },

    cnLeq: function(value) {
        return new ClLinearExpression(this).cnLeq(value);
    },


    cnOr: function(value) {
        return this;
    },
    cnEquals: function(value) {
        return new ClLinearExpression(this).cnEquals(value);
    },
    cnIdentical: function(value) {
        return this.cnEquals(value); // the same for numbers
    },

    prepareEdit: function() {
        this.solver.addEditVar(this);
    },

    finishEdit: function() {
        // do nothing
    }
});

ClLinearExpression.addMethods({
    isConstraintObject: true,

    cnGeq: function(value) {
        if (typeof(value) == 'string') {
            // XXX: Basically, we make numbers in strings readonly here
            value = parseFloat(value);
        }
        return new ClLinearInequality(this.minus(value));
    },

    cnLeq: function(value) {
        if (typeof(value) == 'string') {
            // XXX: Basically, we make numbers in strings readonly here
            value = parseFloat(value);
        }
        if (!(value instanceof ClLinearExpression)) {
            value = new ClLinearExpression(value);
        }
        if (!value.minus) debugger;
        return new ClLinearInequality(value.minus(this));
    },

    cnOr: function(other) {
        return this;
    },
    cnEquals: function(value) {
        if (typeof(value) == 'string') {
            // XXX: Basically, we make numbers in strings readonly here
            value = parseFloat(value);
        }
        return new ClLinearEquation(this, value);
    },

  plus: function(expr /*ClLinearExpression*/) {
    if (typeof(expr) == 'string') {
        // XXX: Basically, we make numbers in strings readonly here
        expr = parseFloat(expr);
    }

    if (expr instanceof ClLinearExpression) {
      return this.clone().addExpression(expr, 1.0);
    } else if (expr instanceof ClVariable) {
      return this.clone().addVariable(expr, 1.0);
    } else if (typeof(expr) == 'number') {
      return this.clone().addExpression(new ClLinearExpression(expr), 1.0);
    } else {
        throw 'Not supported: plus with ' + expr;
    }
  },
  times: function(x) {
    if (typeof(x) == 'string') {
        // XXX: Basically, we make numbers in strings readonly here
        x = parseFloat(x);
    }

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


  minus: function(expr /*ClLinearExpression*/) {
    if (typeof(expr) == 'string') {
        // XXX: Basically, we make numbers in strings readonly here
        expr = parseFloat(expr);
    }

    if (expr instanceof ClLinearExpression) {
      return this.clone().addExpression(expr, -1.0);
    } else if (expr instanceof ClVariable) {
      return this.clone().addVariable(expr, -1.0);
    } else if (typeof(expr) == 'number') {
      return this.clone().addExpression(new ClLinearExpression(expr), -1.0);
    } else {
        throw 'Not supported: minus with ' + expr;
    }
  },


  divide: function(x) {
    if (typeof(x) == 'string') {
        // XXX: Basically, we make numbers in strings readonly here
        x = parseFloat(x);
    }

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
    } else {
        throw 'Not supported: divide with ' + expr;
    }
  }
});

ClConstraint.addMethods({
    isConstraintObject: true,

    enable: function(strength) {
        if (strength) {
            this.setStrength(strength);
        }
        this.solver.addConstraint(this);
    },
    disable: function() {
        this.solver.removeConstraint(this);
    },
    cnOr: function(other) {
        return this;
    },

    get solver() {
        return this._solver || ClSimplexSolver.getInstance();
    },

    set solver(value) {
        this._solver = value;
    }
});

}); // end of module
