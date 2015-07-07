module('users.timfelgentreff.sutherland.relax_bbb').
    requires('users.timfelgentreff.sutherland.relax').toRun(function() {


// Babelsberg required interface
// addConstraint, removeConstraint

Relax.prototype.always = function(opts, func) {
    if (opts.priority) {
        throw 'soft constraints not implemented for Z3';
    }
    func.varMapping = opts.ctx;
    var constraint = new Constraint(func, this);
    this.addConstraint(constraint.constraintobjects[0]);
    this.solve();
    return constraint;
};

Relax.prototype.constraintVariableFor = function(value, ivarname) {
    if ((typeof(value) == 'number') ||
            (value === null) ||
            (value instanceof Number)) {
        var name = ivarname + ':' + Strings.newUUID();
        var v = new RelaxNode('vars[\"' + name + '\"]', [name], this);
        this.addVar(name, value);
        return v;
    } else {
        return null;
    }
};

Relax.prototype.isConstraintObject = function() {
    return true;
};

Relax.prototype.solve = function() {
    // we solve eagerly, so just use this to throw if the error is too large
    this.iterateForUpTo(this.longWaitMillis);
    if (this.shouldRelax) {
        throw new Error('Could not satisfy constraint');
    }
};

Relax.prototype.weight = 100;

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
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnIdentical = RelaxNode.prototype.cnEquals;

RelaxNode.prototype.cnGeq = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' >= ' + _expr(r) +
            ') ? 0 : Math.abs(' + this.expr + ' - (' + _expr(r) + ')))',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnLeq = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' <= ' + _expr(r) +
            ') ? 0 : Math.abs(' + this.expr + ' - (' + _expr(r) + ')))',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnLess = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' < ' + _expr(r) + ') ? 0 : ((' +
            this.expr + ' + (' + _expr(r) +
            ' * ' + this.solver.epsilon + ')) - (' + _expr(r) + ')))',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnGreater = function(r) {
    return new RelaxNode(
        '((' + this.expr + ' > ' + _expr(r) + ') ? 0 : ((' +
            _expr(r) + ' + (' + _expr(r) +
            ' * ' + this.solver.epsilon + ')) - (' + this.expr + ')))',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnNeq = function(r) {
    return new RelaxNode(
        '((Math.abs(' + this.expr + ' - ' + _expr(r) +
            ') > ' + this.solver.epsilon + ') ' + '? 0 : Math.abs((' + _expr(r) +
            ' + (' + _expr(r) + ' * ' + this.solver.epsilon +
            ')) - (' + this.expr + ')))',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.cnNotIdentical = RelaxNode.prototype.cnNeq;

RelaxNode.prototype.plus = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' + ' + _expr(r) + ')',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.minus = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' - ' + _expr(r) + ')',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.times = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' * ' + _expr(r) + ')',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.divide = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' / ' + _expr(r) + ')',
        this.vars.concat(r.vars).uniq(),
        this.solver
    );
};

RelaxNode.prototype.modulo = function(r) {
    return new RelaxNode(
        '(' + this.expr + ' % ' + _expr(r) + ')',
        this.vars.concat(r.vars).uniq(),
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

RelaxNode.prototype.enable = function() { /* ignored */ };
RelaxNode.prototype.disable = function() { /* ignored */ };

}); // end of module
