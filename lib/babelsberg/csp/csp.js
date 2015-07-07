/*
 * A simple constraint satisfaction problem solver in JavaScript.
 * @module csp
 */
module('users.timfelgentreff.csp.csp').requires().toRun(function() {

  JSLoader.loadJs(module('users.timfelgentreff.csp.underscore-min').uri());

  var util = {
    mixin: function(target, src) {
      for (var name in src) {
        if (src.hasOwnProperty(name) && !target.hasOwnProperty(name)) {
          target[name] = src[name];
        }
      }
    },
    hashcopy: function(obj) {
      var ret = obj.constructor();
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          ret[p] = obj[p];
        }
      }
      return ret;
    }
  };

  /*
   * Variable
   */
  var Variable = function(name, domain) {
    this.name = name;
    this.domain = domain;
  };

  Variable.prototype.toString = function() {
    return '' + this.name + ' => [' + this.domain.toString() + ']';
  };

  /*
   * Constraint
   */
  var Constraint = function(variables, fn) {
    this.fn = fn;
    this.variables = variables;
  };

  Constraint.prototype.toString = function() {
    return '(' + this.variables.toString() + ') => ' + this.fn.toString();
  };

  /*
   * Problem
   */
  var Problem = function() {
    this.solver = new RecursiveBacktrackingSolver();
    this.variables = {};
    this.constraints = [];
  };

  Problem.prototype.addVariable = function(name, domain) {
    this.variables[name] = new Variable(name, domain);
  };

  Problem.prototype.removeVariable = function(vari) {
    var vars = this.variables;
    delete vars[vari];
  };

  Problem.prototype.addConstraint = function(variables, fn) {
  var constraint = new Constraint(variables, fn);
    this.constraints.push(constraint);
    return constraint;
  };

  Problem.prototype.removeConstraint = function(constraint) {
  var index = this.constraints.indexOf(constraint);
  if (index > -1) {
      this.constraints.splice(index, 1);
  } else {
    throw 'attempt to removed a non-existing element';
  }
  };

  Problem.prototype.setSolver = function(solver) {
    this.solver = solver;
  };

  Problem.prototype.getSolution = function(restrictedDomains) {
    return this.solver.getSolution(this, restrictedDomains);
  };

  Problem.prototype.getAssignmentFor = function(name) {
    return this.solver.getAssignmentFor(name);
  };

  /*
   * Solver
   */
  var RecursiveBacktrackingSolver = function() {
    this.assignments = {};
  };

  RecursiveBacktrackingSolver.prototype.getSolution = function(csp,
                                                               restrictedDomains) {
    var satisfiable = this.solve(csp.variables, csp.constraints, restrictedDomains);

    return satisfiable;
  };

  RecursiveBacktrackingSolver.prototype.getAssignmentFor = function(name) {
    return this.assignments[name];
  };

  RecursiveBacktrackingSolver.prototype.solve = function(variables,
                                                         constraints,
                                                         restrictedDomains) {
    var domainByName = this.prepareSolving(variables, restrictedDomains);

    var fulfilled = this.recursiveSolve(constraints, domainByName);

    return fulfilled;
  };

  RecursiveBacktrackingSolver.prototype.prepareSolving = function(variables,
                                                                  restrictedDomains) {
    var domainByName = _.defaults(restrictedDomains, variables);

    return domainByName;
  };

  RecursiveBacktrackingSolver.prototype.recursiveSolve = function(constraints,
                                                                  domainByName) {
    if (_.size(domainByName) === 0) {
      var fulfilled = this.checkAssignments(constraints);
      return fulfilled;
    } else {
      var current = _.chain(domainByName)
        .keys()
        .first()
        .value();
      var remainingDomain = _.omit(domainByName, current);
      var currentDomain = domainByName[current].domain;
      var fulfilled = _.some(currentDomain, function(val) {
        this.assignments[current] = val;
        var fulfilled = this.recursiveSolve(constraints, remainingDomain);
        return fulfilled;
      }, this);
      return fulfilled;
    }
  };

  RecursiveBacktrackingSolver.prototype.checkAssignments = function(constraints) {
    var constraintsFulfilled = _.every(constraints, function(constraint) {
      return constraint.fn();
    }, this);

    if (constraintsFulfilled) {
      this.summitSolution();
    }

    return constraintsFulfilled;
  };

  RecursiveBacktrackingSolver.prototype.summitSolution = function() {};

/*
 * Public API
 */
Object.subclass('_csp', {});
Object.extend(_csp, {
  version: '0.1',
  DiscreteProblem: Problem
});

});
