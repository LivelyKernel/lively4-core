module('users.timfelgentreff.deltablue.deltablue').requires().toRun(function() {

// Copyright 2008 the V8 project authors. All rights reserved.
// Copyright 1996 John Maloney and Mario Wolczko.

// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA


// This implementation of the DeltaBlue benchmark is derived
// from the Smalltalk implementation by John Maloney and Mario
// Wolczko. Some parts have been translated directly, whereas
// others have been modified more aggresively to make it feel
// more like a JavaScript program.

/**
 * A JavaScript implementation of the DeltaBlue constraint-solving
 * algorithm, as described in:
 *
 * "The DeltaBlue Algorithm: An Incremental DBConstraint Hierarchy Solver"
 *   Bjorn N. Freeman-Benson and John Maloney
 *   January 1990 Communications of the ACM,
 *   also available as University of Washington TR 89-08-06.
 *
 * Beware: this benchmark is written in a grotesque style where
 * the constraint model is built by side-effects from constructors.
 * I've kept it this way to avoid deviating too much from the original
 * implementation.
 */


Object.subclass('DBOrderedCollection', {
    initialize: function() {
        this.elms = new Array();
    },

    add: function(elm) {
        this.elms.push(elm);
    },

    at: function(index) {
        return this.elms[index];
    },

    size: function() {
        return this.elms.length;
    },

    removeFirst: function() {
        return this.elms.pop();
    },

    remove: function(elm) {
        var index = 0, skipped = 0;
        for (var i = 0; i < this.elms.length; i++) {
            var value = this.elms[i];
            if (value != elm) {
                this.elms[index] = value;
                index++;
            } else {
                skipped++;
            }
        }
        for (var i = 0; i < skipped; i++)
            this.elms.pop();
    }
});

/* --- *
 * S t r e n g t h
 * --- */

Object.subclass('DBStrength', {
    /**
     * DBStrengths are used to measure the relative importance of constraints.
     * New strengths may be inserted in the strength hierarchy without
     * disrupting current constraints.  DBStrengths cannot be created outside
     * this class, so pointer comparison can be used for value comparison.
     */
    initialize: function(strengthValue, name) {
        this.strengthValue = strengthValue;
        this.name = name;
    },

    nextWeaker: function() {
        switch (this.strengthValue) {
        case 0: return DBStrength.WEAKEST;
        case 1: return DBStrength.WEAK_DEFAULT;
        case 2: return DBStrength.NORMAL;
        case 3: return DBStrength.STRONG_DEFAULT;
        case 4: return DBStrength.PREFERRED;
        case 5: return DBStrength.REQUIRED;
        }
    }
});

Object.extend(DBStrength, {
    stronger: function(s1, s2) {
        return s1.strengthValue < s2.strengthValue;
    },

    weaker: function(s1, s2) {
        return s1.strengthValue > s2.strengthValue;
    },

    weakestOf: function(s1, s2) {
        return this.weaker(s1, s2) ? s1 : s2;
    },

    strongest: function(s1, s2) {
        return this.stronger(s1, s2) ? s1 : s2;
    },

    // DBStrength constants.
    REQUIRED: new DBStrength(0, 'required'),
    STONG_PREFERRED: new DBStrength(1, 'strongPreferred'),
    PREFERRED: new DBStrength(2, 'preferred'),
    STRONG_DEFAULT: new DBStrength(3, 'strongDefault'),
    NORMAL: new DBStrength(4, 'normal'),
    WEAK_DEFAULT: new DBStrength(5, 'weakDefault'),
    WEAKEST: new DBStrength(6, 'weakest')
});

/* --- *
 * C o n s t r a i n t
 * --- */

Object.subclass('DBConstraint', {
    /**
     * An abstract class representing a system-maintainable relationship
     * (or "constraint") between a set of variables. A constraint supplies
     * a strength instance variable; concrete subclasses provide a means
     * of storing the constrained variables and other information required
     * to represent a constraint.
     */
    initialize: function(strength, planner) {
        this.planner = planner;
        this.strength = strength;
    },

    /**
     * Activate this constraint and attempt to satisfy it.
     */
    addDBConstraint: function(planner) {
        this.addToGraph();
        this.planner.incrementalAdd(this);
    },

    /**
     * Attempt to find a way to enforce this constraint. If successful,
     * record the solution, perhaps modifying the current dataflow
     * graph. Answer the constraint that this constraint overrides, if
     * there is one, or nil, if there isn't.
     * Assume: I am not already satisfied.
     */
    satisfy: function(mark) {
        this.chooseMethod(mark);
        if (!this.isSatisfied()) {
            if (this.strength == DBStrength.REQUIRED) {
                // alert('Could not satisfy a required constraint!');
            }
            return null;
        }
        this.markInputs(mark);
        var out = this.output();
        var overridden = out.determinedBy;
        if (overridden != null) overridden.markUnsatisfied();
        out.determinedBy = this;
        if (!(this.planner.addPropagate(this, mark))) {
            alert('Cycle encountered');
        }
        out.mark = mark;
        return overridden;
    },

    destroyDBConstraint: function() {
        if (this.isSatisfied()) {
            this.planner.incrementalRemove(this);
        } else {
            this.removeFromGraph();
        }
    },

    /**
     * Normal constraints are not input constraints.  An input constraint
     * is one that depends on external state, such as the mouse, the
     * keybord, a clock, or some arbitraty piece of imperative code.
     */
    isInput: function() {
        return false;
    }
});

/* --- *
 * U n a r y   C o n s t r a i n t
 * --- */

DBConstraint.subclass('UnaryDBConstraint', {
    /**
     * Abstract superclass for constraints having a single possible output
     * variable.
     */
    initialize: function($super, v, strength, planner) {
        $super(strength, planner);
        this.myOutput = v;
        this.satisfied = false;
    },

    /**
     * Adds this constraint to the constraint graph
     */
    addToGraph: function() {
        this.myOutput.addDBConstraint(this);
        this.satisfied = false;
    },

    /**
     * Decides if this constraint can be satisfied and records that
     * decision.
     */
    chooseMethod: function(mark) {
        this.satisfied = (this.myOutput.mark != mark) &&
            DBStrength.stronger(this.strength, this.myOutput.walkDBStrength);
    },

    /**
     * Returns true if this constraint is satisfied in the current solution.
     */
    isSatisfied: function() {
        return this.satisfied;
    },

    markInputs: function(mark) {
        // has no inputs
    },

    /**
     * Returns the current output variable.
     */
    output: function() {
        return this.myOutput;
    },

    /**
     * Calculate the walkabout strength, the stay flag, and, if it is
     * 'stay', the value for the current output of this constraint. Assume
     * this constraint is satisfied.
     */
    recalculate: function() {
        this.myOutput.walkDBStrength = this.strength;
        this.myOutput.stay = !this.isInput();
        if (this.myOutput.stay) this.execute(); // Stay optimization
    },

    /**
     * Records that this constraint is unsatisfied
     */
    markUnsatisfied: function() {
        this.satisfied = false;
    },

    inputsKnown: function() {
        return true;
    },

    removeFromGraph: function() {
        if (this.myOutput != null) this.myOutput.removeDBConstraint(this);
        this.satisfied = false;
    }
});

/* --- *
 * S t a y   C o n s t r a i n t
 * --- */

UnaryDBConstraint.subclass('StayDBConstraint', {
    /**
     * DBVariables that should, with some level of preference, stay the same.
     * DBPlanners may exploit the fact that instances, if satisfied, will not
     * change their output during plan execution.  This is called "stay
     * optimization".
     */


    execute: function() {
        // Stay constraints do nothing
    }
});

/* --- *
 * E d i t   C o n s t r a i n t
 * --- */

UnaryDBConstraint.subclass('EditDBConstraint', {
    /**
     * A unary input constraint used to mark a variable that the client
     * wishes to change.
     */

    /**
     * Edits indicate that a variable is to be changed by imperative code.
     */
    isInput: function() {
        return true;
    },

    execute: function() {
        // Edit constraints do nothing
    }
});

/* --- *
 * B i n a r y   C o n s t r a i n t
 * --- */

var Direction = new Object();
Direction.NONE = 0;
Direction.FORWARD = 1;
Direction.BACKWARD = -1;

DBConstraint.subclass('BinaryDBConstraint', {
    /**
     * Abstract superclass for constraints having two possible output
     * variables.
     */
    initialize: function($super, var1, var2, strength, planner) {
        $super(strength, planner);
        this.v1 = var1;
        this.v2 = var2;
        this.direction = Direction.NONE;
    },

    /**
     * Decides if this constraint can be satisfied and which way it
     * should flow based on the relative strength of the variables related,
     * and record that decision.
     */
    chooseMethod: function(mark) {
        if (this.v1.mark == mark) {
            if (this.v2.mark != mark &&
                DBStrength.stronger(this.strength, this.v2.walkDBStrength)) {
                this.direction = Direction.FORWARD;
            } else {
                this.direction = Direction.NONE;
            }
        }
        if (this.v2.mark == mark) {
            if (this.v1.mark != mark &&
                DBStrength.stronger(this.strength, this.v1.walkDBStrength)) {
                this.direction = Direction.BACKWARD;
            } else {
                this.direction = Direction.NONE;
            }
        }
        if (DBStrength.weaker(this.v1.walkDBStrength, this.v2.walkDBStrength)) {
            this.direction = DBStrength.stronger(this.strength, this.v1.walkDBStrength) ?
                Direction.BACKWARD :
                Direction.NONE;
        } else {
            this.direction = DBStrength.stronger(this.strength, this.v2.walkDBStrength) ?
                Direction.FORWARD :
                Direction.BACKWARD;
        }
    },

    /**
     * Add this constraint to the constraint graph
     */
    addToGraph: function() {
        this.v1.addDBConstraint(this);
        this.v2.addDBConstraint(this);
        this.direction = Direction.NONE;
    },

    /**
     * Answer true if this constraint is satisfied in the current solution.
     */
    isSatisfied: function() {
        return this.direction != Direction.NONE;
    },

    /**
     * Mark the input variable with the given mark.
     */
    markInputs: function(mark) {
        this.input().mark = mark;
    },

    /**
     * Returns the current input variable
     */
    input: function() {
        return (this.direction == Direction.FORWARD) ? this.v1 : this.v2;
    },

    /**
     * Returns the current output variable
     */
    output: function() {
        return (this.direction == Direction.FORWARD) ? this.v2 : this.v1;
    },

    /**
     * Calculate the walkabout strength, the stay flag, and, if it is
     * 'stay', the value for the current output of this
     * constraint. Assume this constraint is satisfied.
     */
    recalculate: function() {
        var ihn = this.input(), out = this.output();
        out.walkDBStrength = DBStrength.weakestOf(this.strength, ihn.walkDBStrength);
        out.stay = ihn.stay;
        if (out.stay) this.execute();
    },

    /**
     * Record the fact that this constraint is unsatisfied.
     */
    markUnsatisfied: function() {
        this.direction = Direction.NONE;
    },

    inputsKnown: function(mark) {
        var i = this.input();
        return i.mark == mark || i.stay || i.determinedBy == null;
    },

    removeFromGraph: function() {
        if (this.v1 != null) this.v1.removeDBConstraint(this);
        if (this.v2 != null) this.v2.removeDBConstraint(this);
        this.direction = Direction.NONE;
    }
});
DBConstraint.subclass('UserDBConstraint', {
    /**
     * Constraints that use a custom function to map multiple inputs to one output
     */
    initialize: function($super,
                         strengthOrPredicateOrFormulas,
                         predicateOrFormulasOrPlanner,
                         formulasOrPlanner,
                         planner) {
        var strength, formulas, predicate;
        if (planner) { // 4-args
            strength = strengthOrPredicateOrFormulas;
            predicate = predicateOrFormulasOrPlanner;
            formulas = formulasOrPlanner;
        } else if (formulasOrPlanner) {
            // 3-args
            if (typeof(formulasOrPlanner) == 'function') {
                strength = strengthOrPredicateOrFormulas;
                predicate = predicateOrFormulasOrPlanner;
                formulas = formulasOrPlanner;
            } else {
                planner = formulasOrPlanner;
                if (typeof(strengthOrPredicateOrFormulas) == 'function') {
                    predicate = strengthOrPredicateOrFormulas;
                    formulas = predicateOrFormulasOrPlanner;
                } else {
                    strength = strengthOrPredicateOrFormulas;
                    formulas = predicateOrFormulasOrPlanner;
                }
            }
        } else if (predicateOrFormulasOrPlanner) {
            // 2-args
            if (typeof(strengthOrPredicateOrFormulas) == 'function') {
                if (typeof(predicateOrFormulasOrPlanner) == 'function') {
                    predicate = strengthOrPredicateOrFormulas;
                    formulas = predicateOrFormulasOrPlanner;
                } else {
                    formulas = strengthOrPredicateOrFormulas;
                    planner = predicateOrFormulasOrPlanner;
                }
            } else {
                strength = strengthOrPredicateOrFormulas;
                formulas = predicateOrFormulasOrPlanner;
            }
        } else {
            // 1-arg
            formulas = strengthOrPredicateOrFormulas;
        }
        strength = strength || DBStrength.required;

        $super(strength, planner);
        this.predicate = predicate;
        this.formulas = [];
        this.outputs = [];
        this.inputs = [];
        this.satisfied = false;
        formulas(this);
    },
    formula: function(output, inputs, func) {
        if (inputs.include(output)) {
            throw 'output cannot be determined by itself';
        }
        var idx = this.outputs.indexOf(output),
            len = this.outputs.length;
        if (idx >= 0) {
            throw 'multiple formulas for ' + output;
        }
        this.outputs.push(output);
        inputs.each(function(input) {
            if (!this.inputs.include(input)) {
                this.inputs.push(input);
            }
        }.bind(this));
        this.formulas[len] = {inputs: inputs, func: func};
    },


    /**
     * Decides if this constraint can be satisfied and which way it
     * should flow based on the relative strength of the variables related,
     * and record that decision.
     */
    chooseMethod: function(mark) {
        var weakest_output = null,
            weakest_strength = this.strength,
            out = null;
        this.outputs.each(function(out) {
            if (out.mark != mark &&
                DBStrength.stronger(weakest_strength, out.walkDBStrength)) {
                weakest_strength = out.walkDBStrength;
                weakest_output = out;
            }
        }.bind(this));
        this.out = weakest_output;
        this.satisfied = (!!this.out);
    },

    /**
     * Add this constraint to the constraint graph
     */
    addToGraph: function() {
        var that = this;
            this.variables.each(function(ea) {
                ea.addDBConstraint(that);
            });
            this.satisfied = false;
    },

    /**
     * Answer true if this constraint is satisfied in the current solution.
     */
    isSatisfied: function() {
        return this.satisfied;
    },

    /**
     * Mark the input variable with the given mark.
     */
    markInputs: function(mark) {
        var out = this.out;
        this.inputs.each(function(ea) {
            if (ea !== out) {
               ea.mark = mark;
            }
        });
    },

    /**
     * Calculate the walkabout strength, the stay flag, and, if it is
     * 'stay', the value for the current output of this
     * constraint. Assume this constraint is satisfied.
     */
    recalculate: function() {
        var out = this.out;
        out.walkDBStrength = this.strength;
        this.inputs.each(function(ea) {
            out.walkDBStrength = DBStrength.weakestOf(
                out.walkDBStrength,
                ea.walkDBStrength
            );
        });
        out.stay = this.inputs.all(function(ea) { return ea.stay });
        if (out.stay) this.execute();
    },

    /**
     * Record the fact that this constraint is unsatisfied.
     */
    markUnsatisfied: function() {
        this.satisfied = false;
    },

    inputsKnown: function(mark) {
        var out = this.out;
        return this.inputs.all(function(i) {
           return i === out || i.mark == mark || i.stay || i.determinedBy == null;
        });
    },

    removeFromGraph: function() {
        var that = this;
        this.variables.each(function(ea) {
            ea.removeDBConstraint(that);
        });
        this.satisfied = false;
    },
    execute: function() {
        if (!this.predicate || !this.predicate()) {
            var formula = this.formulas[this.outputs.indexOf(this.out)],
                func = formula.func,
                inputs = formula.inputs;
            this.out.value = func.apply(null, inputs.collect(function(ea) {
                return ea.value;
            }).concat([this.out.value]));
        }
    },
    output: function() {
        return this.out;
    },
    get variables() {
        return this.outputs.concat(this.inputs).uniq();
    }

});
/* --- *
 * S c a l e   C o n s t r a i n t
 * --- */

BinaryDBConstraint.subclass('ScaleDBConstraint', {
    /**
     * Relates two variables by the linear scaling relationship: "v2 =
     * (v1 * scale) + offset". Either v1 or v2 may be changed to maintain
     * this relationship but the scale factor and offset are considered
     * read-only.
     */
    initialize: function($super, src, scale, offset, dest, strength, planner) {
        this.direction = Direction.NONE;
        this.scale = scale;
        this.offset = offset;
        $super(src, dest, strength, planner);
    },

    /**
     * Adds this constraint to the constraint graph.
     */
    addToGraph: function($super) {
        $super();
        this.scale.addDBConstraint(this);
        this.offset.addDBConstraint(this);
    },

    removeFromGraph: function($super) {
        $super();
        if (this.scale != null) this.scale.removeDBConstraint(this);
        if (this.offset != null) this.offset.removeDBConstraint(this);
    },

    markInputs: function($super, mark) {
        $super(mark);
        this.scale.mark = this.offset.mark = mark;
    },

    /**
     * Enforce this constraint. Assume that it is satisfied.
     */
    execute: function() {
        if (this.direction == Direction.FORWARD) {
            this.v2.value = this.v1.value * this.scale.value + this.offset.value;
        } else {
            this.v1.value = (this.v2.value - this.offset.value) / this.scale.value;
        }
    },

    /**
     * Calculate the walkabout strength, the stay flag, and, if it is
     * 'stay', the value for the current output of this constraint. Assume
     * this constraint is satisfied.
     */
    recalculate: function() {
        var ihn = this.input(), out = this.output();
        out.walkDBStrength = DBStrength.weakestOf(this.strength, ihn.walkDBStrength);
        out.stay = ihn.stay && this.scale.stay && this.offset.stay;
        if (out.stay) this.execute();
    }
});

/* --- *
 * E q u a l i t  y   C o n s t r a i n t
 * --- */

BinaryDBConstraint.subclass('EqualityDBConstraint', {
    /**
     * Constrains two variables to have the same value.
     */


    /**
     * Enforce this constraint. Assume that it is satisfied.
     */
    execute: function() {
        this.output().value = this.input().value;
    }
});

/* --- *
 * V a r i a b l e
 * --- */

Object.subclass('DBVariable', {
    /**
     * A constrained variable. In addition to its value, it maintain the
     * structure of the constraint graph, the current dataflow graph, and
     * various parameters of interest to the DeltaBlue incremental
     * constraint solver.
     **/
    initialize: function(name, initialValue, planner) {
        this.planner = planner;
        this.value = initialValue;
        this.constraints = new DBOrderedCollection();
        this.determinedBy = null;
        this.mark = 0;
        this.walkDBStrength = DBStrength.WEAKEST;
        this.stay = true;
        this.name = name;
    },

    /**
     * Add the given constraint to the set of all constraints that refer
     * this variable.
     */
    addDBConstraint: function(c) {
        this.constraints.add(c);
    },

    /**
     * Removes all traces of c from this variable.
     */
    removeDBConstraint: function(c) {
        this.constraints.remove(c);
        if (this.determinedBy == c) this.determinedBy = null;
    },
    assignValue: function(newValue) {
        var edit = new EditDBConstraint(this, DBStrength.REQUIRED, this.planner),
            edits = new DBOrderedCollection();
        edit.addDBConstraint();
        edits.add(edit);
        var plan = this.planner.extractDBPlanFromDBConstraints(edits);
        this.value = newValue;
        try {
            plan.execute();
        } finally {
            edit.destroyDBConstraint();
        }
    }
});

/* --- *
 * P l a n n e r
 * --- */

Object.subclass('DBPlanner', {
    /**
     * The DeltaBlue planner
     */
    initialize: function() {
        this.currentMark = 0;
    },

    /**
     * Attempt to satisfy the given constraint and, if successful,
     * incrementally update the dataflow graph.  Details: If satifying
     * the constraint is successful, it may override a weaker constraint
     * on its output. The algorithm attempts to resatisfy that
     * constraint using some other method. This process is repeated
     * until either a) it reaches a variable that was not previously
     * determined by any constraint or b) it reaches a constraint that
     * is too weak to be satisfied using any of its methods. The
     * variables of constraints that have been processed are marked with
     * a unique mark value so that we know where we've been. This allows
     * the algorithm to avoid getting into an infinite loop even if the
     * constraint graph has an inadvertent cycle.
     */
    incrementalAdd: function(c) {
        var mark = this.newMark();
        var overridden = c.satisfy(mark);
        while (overridden != null)
            overridden = overridden.satisfy(mark);
    },

    /**
     * Entry point for retracting a constraint. Remove the given
     * constraint and incrementally update the dataflow graph.
     * Details: Retracting the given constraint may allow some currently
     * unsatisfiable downstream constraint to be satisfied. We therefore collect
     * a list of unsatisfied downstream constraints and attempt to
     * satisfy each one in turn. This list is traversed by constraint
     * strength, strongest first, as a heuristic for avoiding
     * unnecessarily adding and then overriding weak constraints.
     * Assume: c is satisfied.
     */
    incrementalRemove: function(c) {
        var out = c.output();
        c.markUnsatisfied();
        c.removeFromGraph();
        var unsatisfied = this.removePropagateFrom(out);
        var strength = DBStrength.REQUIRED;
        do {
            for (var i = 0; i < unsatisfied.size(); i++) {
                var u = unsatisfied.at(i);
                if (u.strength == strength)
                    this.incrementalAdd(u);
            }
            strength = strength.nextWeaker();
        } while (strength != DBStrength.WEAKEST);
    },

    /**
     * Select a previously unused mark value.
     */
    newMark: function() {
        return ++this.currentMark;
    },

    /**
     * Extract a plan for resatisfaction starting from the given source
     * constraints, usually a set of input constraints. This method
     * assumes that stay optimization is desired; the plan will contain
     * only constraints whose output variables are not stay. DBConstraints
     * that do no computation, such as stay and edit constraints, are
     * not included in the plan.
     * Details: The outputs of a constraint are marked when it is added
     * to the plan under construction. A constraint may be appended to
     * the plan when all its input variables are known. A variable is
     * known if either a) the variable is marked (indicating that has
     * been computed by a constraint appearing earlier in the plan), b)
     * the variable is 'stay' (i.e. it is a constant at plan execution
     * time), or c) the variable is not determined by any
     * constraint. The last provision is for past states of history
     * variables, which are not stay but which are also not computed by
     * any constraint.
     * Assume: sources are all satisfied.
     */
    makeDBPlan: function(sources) {
        var mark = this.newMark();
        var plan = new DBPlan();
        var todo = sources;
        while (todo.size() > 0) {
            var c = todo.removeFirst();
            if (c.output().mark != mark && c.inputsKnown(mark)) {
                plan.addDBConstraint(c);
                c.output().mark = mark;
                this.addDBConstraintsConsumingTo(c.output(), todo, c);
            }
        }
        return plan;
    },

    /**
     * Extract a plan for resatisfying starting from the output of the
     * given constraints, usually a set of input constraints.
     */
    extractDBPlanFromDBConstraints: function(constraints) {
        var sources = new DBOrderedCollection();
        for (var i = 0; i < constraints.size(); i++) {
            var c = constraints.at(i);
            if (c.isInput() && c.isSatisfied())
                // not in plan already and eligible for inclusion
                sources.add(c);
        }
        return this.makeDBPlan(sources);
    },

    /**
     * Recompute the walkabout strengths and stay flags of all variables
     * downstream of the given constraint and recompute the actual
     * values of all variables whose stay flag is true. If a cycle is
     * detected, remove the given constraint and answer
     * false. Otherwise, answer true.
     * Details: Cycles are detected when a marked variable is
     * encountered downstream of the given constraint. The sender is
     * assumed to have marked the inputs of the given constraint with
     * the given mark. Thus, encountering a marked node downstream of
     * the output constraint means that there is a path from the
     * constraint's output to one of its inputs.
     */
    addPropagate: function(c, mark) {
        var todo = new DBOrderedCollection();
        todo.add(c);
        while (todo.size() > 0) {
            var d = todo.removeFirst();
            if (d.output().mark == mark) {
                this.incrementalRemove(c);
                return false;
            }
            d.recalculate();
            this.addDBConstraintsConsumingTo(d.output(), todo);
        }
        return true;
    },


    /**
     * Update the walkabout strengths and stay flags of all variables
     * downstream of the given constraint. Answer a collection of
     * unsatisfied constraints sorted in order of decreasing strength.
     */
    removePropagateFrom: function(out) {
        out.determinedBy = null;
        out.walkDBStrength = DBStrength.WEAKEST;
        out.stay = true;
        var unsatisfied = new DBOrderedCollection();
        var todo = new DBOrderedCollection();
        todo.add(out);
        while (todo.size() > 0) {
            var v = todo.removeFirst();
            for (var i = 0; i < v.constraints.size(); i++) {
                var c = v.constraints.at(i);
                if (!c.isSatisfied())
                    unsatisfied.add(c);
            }
            var determining = v.determinedBy;
            for (var i = 0; i < v.constraints.size(); i++) {
                var next = v.constraints.at(i);
                if (next != determining && next.isSatisfied()) {
                    next.recalculate();
                    todo.add(next.output());
                }
            }
        }
        return unsatisfied;
    },

    addDBConstraintsConsumingTo: function(v, coll, not) {
        var determining = v.determinedBy;
        var cc = v.constraints;
        for (var i = 0; i < cc.size(); i++) {
            var c = cc.at(i);
            if (c != determining && c.isSatisfied() && c != not) {
                coll.add(c);
            }
        }
    }
});
/* --- *
 * P l a n
 * --- */

Object.subclass('DBPlan', {
    /**
     * A DBPlan is an ordered list of constraints to be executed in sequence
     * to resatisfy all currently satisfiable constraints in the face of
     * one or more changing inputs.
     */
    initialize: function() {
        this.v = new DBOrderedCollection();
    },

    addDBConstraint: function(c) {
        this.v.add(c);
    },

    size: function() {
        return this.v.size();
    },

    constraintAt: function(index) {
        return this.v.at(index);
    },

    execute: function() {
        for (var i = 0; i < this.size(); i++) {
            var c = this.constraintAt(i);
            c.execute();
        }
    }
});
/* --- *
 * M a i n
 * --- */

/**
 * This is the standard DeltaBlue benchmark. A long chain of equality
 * constraints is constructed with a stay constraint on one end. An
 * edit constraint is then added to the opposite end and the time is
 * measured for adding and removing this constraint, and extracting
 * and executing a constraint satisfaction plan. There are two cases.
 * In case 1, the added constraint is stronger than the stay
 * constraint and values must propagate down the entire length of the
 * chain. In case 2, the added constraint is weaker than the stay
 * constraint so it cannot be accomodated. The cost in this case is,
 * of course, very low. Typical situations lie somewhere between these
 * two extremes.
 */
function dbChainTest(n) {
  planner = new DBPlanner();
  var prev = null, first = null, last = null;

  // Build chain of n equality constraints
  for (var i = 0; i <= n; i++) {
    var name = 'v' + i;
    var v = new DBVariable(name);
    if (prev != null)
      new EqualityDBConstraint(prev, v, DBStrength.REQUIRED);
    if (i == 0) first = v;
    if (i == n) last = v;
    prev = v;
  }

  new StayDBConstraint(last, DBStrength.STRONG_DEFAULT);
  var edit = new EditDBConstraint(first, DBStrength.PREFERRED);
  var edits = new DBOrderedCollection();
  edits.add(edit);
  var plan = planner.extractDBPlanFromDBConstraints(edits);
  for (var i = 0; i < 100; i++) {
    first.value = i;
    plan.execute();
    if (last.value != i)
      alert('Chain test failed.');
  }
}

/**
 * This test constructs a two sets of variables related to each
 * other by a simple linear transformation (scale and offset). The
 * time is measured to change a variable on either side of the
 * mapping and to change the scale and offset factors.
 */
function dbProjectionTest(n) {
  planner = new DBPlanner();
  var scale = new DBVariable('scale', 10);
  var offset = new DBVariable('offset', 1000);
  var src = null, dst = null;

  var dests = new DBOrderedCollection();
  for (var i = 0; i < n; i++) {
    src = new DBVariable('src' + i, i);
    dst = new DBVariable('dst' + i, i);
    dests.add(dst);
    new StayDBConstraint(src, DBStrength.NORMAL);
    new ScaleDBConstraint(src, scale, offset, dst, DBStrength.REQUIRED);
  }

  dbChange(src, 17);
  if (dst.value != 1170) alert('Projection 1 failed');
  dbChange(dst, 1050);
  if (src.value != 5) alert('Projection 2 failed');
  dbChange(scale, 5);
  for (var i = 0; i < n - 1; i++) {
    if (dests.at(i).value != i * 5 + 1000)
      alert('Projection 3 failed');
  }
  dbChange(offset, 2000);
  for (var i = 0; i < n - 1; i++) {
    if (dests.at(i).value != i * 5 + 2000)
      alert('Projection 4 failed');
  }
}

function dbChange(v, newValue) {
  var edit = new EditDBConstraint(v, DBStrength.PREFERRED);
  var edits = new DBOrderedCollection();
  edits.add(edit);
  var plan = planner.extractDBPlanFromDBConstraints(edits);
  for (var i = 0; i < 10; i++) {
    v.value = newValue;
    plan.execute();
  }
  edit.destroyDBConstraint();
}

// Global variable holding the current planner.
var planner = null;

function deltaBlue() {
  dbChainTest(100);
  dbProjectionTest(100);
}

}); // end of module
