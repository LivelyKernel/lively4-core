define(function plugin() {
    var UnconstrainAndDisableAllLayer = cop.create("UnconstrainAndDisableAllLayer")
        .refineClass(Babelsberg, {
            unconstrain: function(obj, accessor) {
                var cvar = ConstrainedVariable.findConstraintVariableFor(obj, accessor);
                cvar._constraints.each(function(constraint) {
                    constraint.disable();
                });
                cop.proceed(obj, accessor);
            }
        })
        .beGlobal();

    return UnconstrainAndDisableAllLayer;
});
