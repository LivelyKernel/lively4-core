module('users.timfelgentreff.sutherland.relax').requires().toRun(function() {

// Helpers
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Sutherland-Style Relaxation

function Relax() {
  var self = this;

  this.vars = {};
  this.constraints = [];
  this.shouldRelax = false;
}
Global.Relax = Relax;

Relax.prototype.epsilon = 0.01;
Relax.prototype.tinyDelta = 0.00001;

Relax.prototype.maxIterationsForOnePassMethodSolver = 100;

Relax.prototype.shortWaitMillis = 20;
Relax.prototype.mediumWaitMillis = 100;
Relax.prototype.longWaitMillis = 1000;

Relax.prototype.changeVarValue = function(name, value) {
  this.vars[name] = value;
  var tempConstraint = this.addConstraint(
            new RelaxNode(
                'Math.abs(vars["' + name + '"] - ' + value + ')',
                [name],
                this
            ), 100);
  this.iterateForUpTo(this.mediumWaitMillis);
  this.removeConstraint(tempConstraint);
};

Relax.prototype.addVar = function(v, optValue) {
  if (!this.vars.hasOwnProperty(v)) {
    this.vars[v] = optValue || 0;
  }
};

Relax.prototype.removeVar = function(v) {
  var self = this;
  delete this.vars[v];
  this.constraints.forEach(function(c) {
    if (c.vars.indexOf(v) >= 0) {
      self.removeConstraint(c);
    }
  });
};

Relax.prototype.addConstraint = function(c, optWeight) {
  this.constraints.push(c);
  this.constraintChanged(c);
  return c;
};

Relax.prototype.constraintChanged = function(c) {
  var self = this;
  c.vars.forEach(function(v) {
    self.addVar(v);
  });
};

Relax.prototype.removeConstraint = function(unwantedConstraint) {
  this.constraints = this.constraints.filter(function(c) {
      return c !== unwantedConstraint;
  });
};

Relax.prototype.getError = function(optConstraints) {
  var self = this;
  return (optConstraints || this.constraints)
      .map(function(c) { return c.errorFn(self.vars); })
      .reduce(function(e1, e2) { return e1 + e2; }, 0);
};

Relax.prototype.derivative = function(c, v) {
  var self = this;
  var origValue = this.vars[v];

  function calcDerivative(x0, x1) {
    self.vars[v] = x0;
    var y0 = c.errorFn(self.vars);
    self.vars[v] = x1;
    var y1 = c.errorFn(self.vars);
    self.vars[v] = origValue;
    return (y1 - y0) / (x1 - x0);
  }

  var m = calcDerivative(origValue - this.tinyDelta, origValue + this.tinyDelta);
  if (Math.abs(m) < this.tinyDelta) {
    m = calcDerivative(origValue, origValue + this.tinyDelta);
  }
  if (Math.abs(m) < this.tinyDelta) {
    m = calcDerivative(origValue - this.tinyDelta, origValue);
  }
  return m;
};

Relax.prototype.adjustVarForConstraint = function(v, c) {
  var count = 0;
  while (count++ < this.maxIterationsForOnePassMethodSolver &&
         c.errorFn(this.vars) > this.epsilon) {
    var m = this.derivative(c, v);
    var b = c.errorFn(this.vars) - m * this.vars[v];
    var value = -b / m;
    if (isFinite(value)) {
      this.vars[v] = value;
    } else {
      break;
    }
  }
  return c.errorFn(this.vars) <= this.epsilon;
};

Relax.prototype.adjustVarForConstraints = function(v, cs) {
  var self = this;
  var mbs = 0;
  var mms = 0;
  cs.forEach(function(c) {
    var m = self.derivative(c, v);
    var b = c.errorFn(self.vars) - m * self.vars[v];
    mbs += m * b;
    mms += m * m;
  });
  var newValue = -mbs / mms;
  if (isFinite(newValue)) {
    self.vars[v] = newValue;
  }
};

Relax.prototype.iterateForUpTo = function(tMillis) {
  var constraintsForRelaxation = this.constraints.slice();
  var computeStack = [];
  var didSomething;
  var vars = Object.keys(this.vars);
  do {
    didSomething = false;
    vars.forEach(function(v) {
      var numConstraintsFound = 0;
      var theConstraint;
      constraintsForRelaxation.forEach(function(c) {
        if (c.vars.indexOf(v) >= 0) {
          theConstraint = c;
          numConstraintsFound++;
        }
      });
      if (numConstraintsFound == 1 && theConstraint.vars.length > 1) {
        computeStack.push({variable: v, constraint: theConstraint});
        constraintsForRelaxation = constraintsForRelaxation.filter(function(c) {
            return c !== theConstraint;
        });
        didSomething = true;
      }
    });
  } while (didSomething);

  vars = {};
  constraintsForRelaxation.forEach(function(c) {
    c.vars.forEach(function(v) {
      vars[v] = true;
    });
  });
  vars = Object.keys(vars);

  var t0 = Date.now();
  var count = 0;
  while (this.getError(constraintsForRelaxation) > this.epsilon &&
         (Date.now() - t0) < tMillis) {
    this.adjustVarForConstraints(
        vars[getRandomInt(0, vars.length)],
        constraintsForRelaxation
    );
    count++;
  }

  while (computeStack.length > 0) {
    var entry = computeStack.pop();
    this.adjustVarForConstraint(entry.variable, entry.constraint);
  }

  var error = this.getError();
  this.shouldRelax = error > this.epsilon;
  return count;
};

function RelaxNode(expr, vars, solver) {
    this.expr = expr;
    this.vars = vars;
    this.errorFn = new Function('vars', 'return ' + this.expr);
    this.solver = solver;
}
Global.RelaxNode = RelaxNode;

}); // end of module
