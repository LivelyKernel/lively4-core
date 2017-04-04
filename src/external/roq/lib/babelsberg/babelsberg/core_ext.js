module('users.timfelgentreff.babelsberg.core_ext').requires().toRun(function() {

Function.addMethods({
    varMap: function(obj) {
        this.varMapping = obj;
        return this;
    },
    recursionGuard: function(obj, key) {
        if (!obj[key]) {
            try {
                obj[key] = true;
                this();
            } finally {
                obj[key] = false;
            }
        }
    }
});

Object.subclass('Guard', {
    initialize: function() {
        this.counter = 0;
        this.lastCall = {};
        this.cachedResult;
        return this;
    },
    call: function(id, func) {
        if (this.counter !== this.lastCall[id]) {
            this.cachedResult = func();
            this.lastCall[id] = this.counter;
        }
        return this.cachedResult;
    },
    tick: function(arg) {
        if (arg) {
            this.counter = arg;
        } else {
            this.counter++;
        }
    }
});

Object.extend(Strings, {
    safeToString: function(obj) {
        var toS = Object.prototype.toString,
            str;
        try {
            if (obj.toString) str = obj.toString();
        } catch (e) {
            str = toS.apply(obj);
        }
        return str;
    }
});

}); // end of module
