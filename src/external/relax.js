// Helpers
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Sutherland-Style Relaxation
export default function Relax() {
  var self = this;

  this.vars = {};
  this.constraints = [];
  this.shouldRelax = false;
}

Relax.prototype.epsilon = 2;
Relax.prototype.tinyDelta = 1;

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
  console.log("adjust var " + v)
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
  var didSomething = false;
  var vars = Object.keys(this.vars);
  console.log("1. constraints: " + constraintsForRelaxation)

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
      // if (numConstraintsFound == 1 && theConstraint.vars.length > 1) {
      //   computeStack.push({variable: v, constraint: theConstraint});
      //   constraintsForRelaxation = constraintsForRelaxation.filter(function(c) {
      //       return c !== theConstraint;
      //   });
      //   didSomething = true;
      // }
    });
  } while (didSomething);
  console.log("2. constraints: " + constraintsForRelaxation)


  vars = {};
  constraintsForRelaxation.forEach(function(c) {
    c.vars.forEach(function(v) {
      vars[v] = true;
    });
  });
  vars = Object.keys(vars);

  var t0 = Date.now();
  var count = 0;

  console.log(" constraints: " + constraintsForRelaxation)
  console.log("error=" + this.getError(constraintsForRelaxation) + " constraints: " + constraintsForRelaxation)

  while (this.getError(constraintsForRelaxation) > this.epsilon &&
         (Date.now() - t0) < tMillis) {
    
    var variable = vars[getRandomInt(0, vars.length)]
    console.log("random var " + variable)
    this.adjustVarForConstraints(
        variable,
        constraintsForRelaxation
    );
    count++;
  }
  debugger
  while (computeStack.length > 0) {
    var entry = computeStack.pop();
    console.log("var " + entry.variable)
    this.adjustVarForConstraint(entry.variable, entry.constraint);
  }

  var error = this.getError();
  this.shouldRelax = error > this.epsilon;
  return count;
};

export function RelaxNode(expr, vars, solver) {
    this.expr = expr;
    this.vars = vars;
    this.errorFn = new Function('vars', 'return ' + this.expr);
    this.solver = solver;
}


// Automatic solver selection interface
Relax.prototype.solverName = "Sutherland's Relaxation";
Relax.prototype.supportsMethods = function() { return false; };
Relax.prototype.supportsFiniteDomains = function() { return false; };
Relax.prototype.supportedDataTypes = function() {
    // Like Cassowary, Relax does not support strings, but there are actively
    // used scenarios where js-coercion from string to float is used - these
    // cases would be blown
    return ['number', 'string'];
};

Relax.prototype.solve = function() {
    // we solve eagerly, so just use this to throw if the error is too large
    this.iterateForUpTo(this.longWaitMillis);
    if (this.shouldRelax) {
        throw new Error('Could not satisfy constraint');
    }
};

Relax.prototype.weight = 100;

Relax.prototype.solverName = 'Relax';
Relax.prototype.supportsMethods = function() { return false; };
Relax.prototype.supportsSoftConstraints = function() { return false; };
Relax.prototype.supportsFiniteDomains = function() { return false; };
Relax.prototype.supportedDataTypes = function() { return ['number']; };

RelaxNode.prototype.isConstraintObject = function() {
    return true;
};

RelaxNode.prototype.isReadonly = function() { return false };
RelaxNode.prototype.setReadonly = function(bool) { /* ignored */ };

RelaxNode.prototype.suggestValue = function(v) {
    if (this.vars.length !== 1) throw new Error('Inconsistent RelaxNode');
    return this.solver.changeVarValue(this.vars[0], v);
};

RelaxNode.prototype.value = function() {
    // if (this.vars.length !== 1) throw new Error("Inconsistent RelaxNode");
    return this.solver.vars[this.vars[0]];
};

function _expr(o) {
    if (o instanceof RelaxNode) {
        return o.expr;
    } else {
        return o;
    }
}

RelaxNode.prototype.cnEquals = function(r) {
    return new RelaxNode(
        'Math.abs(' + this.expr + ' - (' + _expr(r) + '))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnIdentical = RelaxNode.prototype.cnEquals;

RelaxNode.prototype.cnGeq = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' >= ' + _expr(r) +
            ') ? 0 : Math.abs(' + this.expr + ' - (' + _expr(r) + ')))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnLeq = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' <= ' + _expr(r) +
            ') ? 0 : Math.abs(' + this.expr + ' - (' + _expr(r) + ')))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnLess = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' < ' + _expr(r) + ') ? 0 : ((' +
            this.expr + ' + (' + _expr(r) +
            ' * ' + this.solver.epsilon + ')) - (' + _expr(r) + ')))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnGreater = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' > ' + _expr(r) + ') ? 0 : ((' +
            _expr(r) + ' + (' + _expr(r) +
            ' * ' + this.solver.epsilon + ')) - (' + this.expr + ')))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnNeq = function(r) {
    return new RelaxNode(
        '((Math.abs(' + this.expr + ' - ' + _expr(r) +
            ') > ' + this.solver.epsilon + ') ' + '? 0 : Math.abs((' + _expr(r) +
            ' + (' + _expr(r) + ' * ' + this.solver.epsilon +
            ')) - (' + this.expr + ')))',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.cnNotIdentical = RelaxNode.prototype.cnNeq;

RelaxNode.prototype.plus = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' + ' + _expr(r) + ')',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.minus = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' - ' + _expr(r) + ')',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.times = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' * ' + _expr(r) + ')',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.divide = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' / ' + _expr(r) + ')',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.modulo = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' % ' + _expr(r) + ')',
        _.uniq(this.vars.concat(r.vars)),
        this.solver
    );
};

RelaxNode.prototype.pow = function(r) {
    return new RelaxNode(
        'Math.pow(' + this.expr + ', ' + _expr(r) + ')',
        this.vars,
        this.solver
    );
};

RelaxNode.prototype.sin = function(r) {
    return new RelaxNode(
        'Math.sin(' + this.expr + ')',
        this.vars,
        this.solver
    );
};

RelaxNode.prototype.cos = function(r) {
    return new RelaxNode(
        'Math.cos(' + this.expr + ')',
        this.vars,
        this.solver
    );
};

RelaxNode.prototype.tan = function(r) {
    return new RelaxNode(
        'Math.tan(' + this.expr + ')',
        this.vars,
        this.solver
    );
};

RelaxNode.prototype.cnOr = function(r) {
    return this;
};

RelaxNode.prototype.enable = function() { this.solver.solve(); };
RelaxNode.prototype.disable = function() { /* ignored */ };