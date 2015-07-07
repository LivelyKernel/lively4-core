module('users.timfelgentreff.backtalk.constraints').requires('users.timfelgentreff.backtalk.backtalk').
toRun(function() {

backtalk.BinaryConstraint.subclass('backtalk.EqualityConstraint', {
    enforceArcConsistency: function() {
        var intersection = this.valuesToExploreA().intersect(this.valuesToExploreB());
        this.variableA.valuesToExplore = intersection;
        this.variableB.valuesToExplore = intersection;
    },
    isConsistent: function() {
        if (this.variableA.currentValue == this.variableB.currentValue) {
            return true;
        }
        try {
            return this.variableA.equals(this.variableB);
        } catch(_) {}
        try {
            return this.variableA.eq(this.variableB);
        } catch(_) {}
        return false;
    }
});
backtalk.BinaryConstraint.subclass('backtalk.InequalityConstraint', {
    enforceArcConsistency: function() {
        if (this.valuesToExploreA().length > 1 &&
            this.valuesToExploreB().length > 1) {
            return;
        }
        if (this.valuesToExploreA().length === 0) {
            this.variableB.valuesToExplore = [];
            return;
        }
        if (this.valuesToExploreB().length === 0) {
            this.variableA.valuesToExplore = [];
            return;
        }
        var self = this;
        this.variableB.filterToReject(function (value) {
            return self.valuesToExploreA().without(value).length === 0;
        });
        this.variableA.filterToReject(function (value) {
            return self.valuesToExploreB().without(value).length === 0;
        });
    },
    isConsistent: function() {
        var self = this;
        return (this.valuesToExploreA().every(function (value) {
            return self.valuesToExploreB().without(value).length > 0
        }) && this.valuesToExploreB().every(function (value) {
            return self.valuesToExploreA().without(value).length > 0
        }));
    }
});
backtalk.BinaryConstraint.subclass('backtalk.FunctionBinaryConstraint', {
    initialize: function($super, a, b, func) {
        $super(a, b);
        this.func = func;
    },
    enforceArcConsistency: function() {
        var sizeA = this.valuesToExploreA().length,
            sizeB = this.valuesToExploreB().length,
            self = this,
            previousSizeA, previousSizeB;
        cond();
        while(previousSizeA !== sizeA && previousSizeB !== sizeB) {
            cond();
        }

        function cond() {
            self.variableA.filterToSelect(function (a) {
                return self.valuesToExploreB().some(function (b) {
                    return self.func(a, b);
                });
            });
            self.variableB.filterToSelect(function (b) {
                return self.valuesToExploreA().some(function (a) {
                    return self.func(a, b);
                });
            });
            previousSizeA = sizeA;
            sizeA = self.valuesToExploreA().length;
            previousSizeB = sizeB;
            sizeB = self.valuesToExploreB().length;
        };
    },
    isConsistent: function() {
        var condA = this.valuesToExploreA().every(function (a) {
                return this.valuesToExploreB().some(function (b) {
                    return this.func(a, b);
                }.bind(this))
            }.bind(this)),
            condB = this.valuesToExploreB().every(function (b) {
                return this.valuesToExploreA().some(function (a) {
                    return this.func(a, b);
                }.bind(this))
            }.bind(this))
        return condA && condB;
    }
});

backtalk.UnaryConstraint.subclass('backtalk.FunctionUnaryConstraint', {
    enforceArcConsistency: function() {
        this.variable.filterToSelect(function (v) {
            return this.func(v);
        }.bind(this));
    },
    isConsistent: function() {
        return this.valuesToExplore().every(function (v) {
            return this.func(v);
        }.bind(this));
    },
    initialize: function($super, v, func) {
        $super(v);
        this.func = func;
    }
});

}) // end of module
