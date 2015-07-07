module("users.timfelgentreff.z3.ServerZ3").requires("users.timfelgentreff.z3.CommandLineZ3", "users.timfelgentreff.z3.Z3ServerInterface").toRun(function () {
CommandLineZ3.subclass("ServerZ3", {
    loadModule: function () {
        Z3ServerInterface.evalSync("(set-option :pp.decimal true)", function (err, result) {
            if (err) throw err;
        });
    },
    
    reset: function () {
        Z3ServerInterface.resetZ3Server();
        return this;
    },

    postMessage: function (before, after) {
        before = before || "";
        after = after || "";
        Z3ServerInterface.eval(
            this.sync,
            before +
                "(get-value (" + this.variables.inject("", function (acc, v) {
                    return acc + v.name + " "
                }) + "))" +
                after,
            function (err, result) {
                if (err) throw err;
                this.applyResult(result);
            }.bind(this)
        );
    },
    initialize: function($super, sync) {
        this.newVariables = [];
        this.newConstraints = [];
        this.activeConstraints = [];
        $super(sync);
    },
    addConstraint: function($super, c) {
        this.newConstraints.push(c);
        this.activeConstraints.push(c);
        return $super(c);
    },
    addVariable: function($super, v, cvar) {
        this.newVariables.push(v);
        return $super(v, cvar);
    },
    removeConstraint: function($super, c) {
        this.activeConstraints.remove(c);
        this.newVariables = this.variables.clone();
        this.newConstraints = this.activeConstraints.clone();
        Z3ServerInterface.eval(true, "(reset)", function (err, result) {});
        return $super(c);
    },
    solve: function () {
        var decls = this.newVariables.inject("", function (acc, v) {
            return acc + "\n" + v.printDeclaration();
        });
        this.newVariables.clear();
        
        var constraints = this.newConstraints.inject("\n", function (acc, c) {
            if (c.strength) {
                return acc + "\n" + "(assert-soft " + c.print() + " :weight " + c.strength + ")"
            } else {
                return acc + "\n" + "(assert " + c.print() + ")";
            }
            // return acc + "\n" +
                    // "(declare-fun " + c.uuid + " () Bool)\n" +
                    // "(assert (= " + c.uuid + " " + c.print() + "))";
                    // "(assert " + c.print() + ")";
        });
        this.newConstraints.clear();
        
        // var solve = this.activeConstraints.inject("\n(check-sat", function (acc, c) {
        //     return acc + " " + c.uuid;
        // }) + ")\n";
        // TODO: figure out a way to enable/disable constraints
        var solve = "\n(check-sat)\n"
        
        this.postMessage(decls + constraints + solve);
        return decls + constraints;
    },
    solveOnce: function($super, c) {
        //if (this.newVariables.length !== 0) {
            $super(c);
        //}
        //this.postMessage("(push)\n(assert " + c.print() + ")\n(check-sat)\n", "(pop)\n");
    },

});

NaCLZ3Constraint.addMethods({
    get uuid() {
        this.$uuid = this.$uuid || ("c" + new UUID().id.replace(/-/g, ""));
        return this.$uuid;
    },
});

}); // end of module
