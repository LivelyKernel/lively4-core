define(function module(require) { "use strict";
    return {
        getValueClass: function() {
            var ValueClass = function() { this.initialize.apply(this, arguments); };

            ValueClass.prototype.initialize = function(value) {
                this.value = value;
            };

            return ValueClass;
        }
    };
});
