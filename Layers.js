// Non-Lively Compatibility
if (!window.module) {
    window.module = function() {
        return {
            requires: function() {return this},
            toRun: function(func) {
                func()
            }
        }
    }
    window.Config = {};
    window.cop = {};
    window.Global = window;



Object.extend(Function.prototype, {

	defaultCategoryName: 'default category',

	subclass: function(/*... */) {
		// Main method of the LK class system.

		// {className} is the name of the new class constructor which this method synthesizes
		// and binds to {className} in the Global namespace.
		// Remaining arguments are (inline) properties and methods to be copied into the prototype
		// of the newly created constructor.

		// modified from prototype.js

		var args = $A(arguments),
			className = args.shift(),
			targetScope = Global,
			shortName = null;

		if (className) {
			targetScope = lively.Class.namespaceFor(className);
			shortName = lively.Class.unqualifiedNameFor(className);
		}  else {
			shortName = "anonymous_" + (lively.Class.anonymousCounter++);
			className = shortName;
		}

		var klass;
		if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
			// preserve the class to allow using the subclass construct in interactive development
			klass = targetScope[shortName];
		} else {
			klass = lively.Class.newInitializer(shortName);
			klass.superclass = this;
			var protoclass = function() { }; // that's the constructor of the new prototype object
			protoclass.prototype = this.prototype;
			klass.prototype = new protoclass();
			klass.prototype.constructor = klass;
			klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
			klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
			if (className) targetScope[shortName] = klass; // otherwise it's anonymous

			// remember the module that contains the class def
			if (Global.lively && lively.Module && lively.Module.current)
				klass.sourceModule = lively.Module.current();
		};

		// the remaining args should be category strings or source objects
		this.addMethods.apply(klass, args);

		if (!klass.prototype.initialize)
			klass.prototype.initialize = function () {};

		return klass;
	}
});

}

/*
 * COP Layers for JavaScript
 */

module('cop.Layers').requires().toRun(function(thisModule) {

// DEPRICATED Syntactic Sugar: Layer in Class

/*
 * extend the subclassing behavior of Lively Kernel to allow fo Layer-In-Class constructs
 */
Object.extend(Function.prototype, {
    subclass: Object.subclass.wrap(function(proceed) {
        var args = $A(arguments);
        args.shift();
        var layeredMethods = [];

        for (var i=1; i < args.length; i++) {
            var methods = args[i];
            if (Object.isString(methods)) continue; // if it's a category
            Object.keys(methods).forEach(function(ea) {
                var m = ea.match(/([A-Za-z0-9]+)\$([A-Za-z0-9]*)/);
                if (m) {
                    var getter = methods.__lookupGetter__(m[0]);
                    var setter = methods.__lookupSetter__(m[0]);
                    layeredMethods.push({layerName: m[1], methodName: m[2], methodBody: methods[ea],
                        getterMethod: getter, setterMethod: setter});
                    delete methods[ea];
                };
            });
        };
        var klass =  proceed.apply(this, args);
        layeredMethods.forEach(function(ea){
            // log("layer property " + ea.methodName + " in " + ea.layerName);
            var layer = Global[ea.layerName];
            if (!layer) throw new Error("could not find layer: " + ea.layerName);
            if (ea.getterMethod || ea.setterMethod) {
                if (ea.getterMethod) {
                    cop.layerGetterMethod(layer, klass.prototype, ea.methodName, ea.getterMethod);
                };
                if (ea.setterMethod) {
                    cop.layerSetterMethod(layer, klass.prototype, ea.methodName, ea.setterMethod);
                };
                cop.makePropertyLayerAware(klass.prototype, ea.methodName);
            } else {
                // log("layer method " + ea.methodName + " in " + ea.layerName);
                cop.layerMethod(layer, klass.prototype, ea.methodName, ea.methodBody);
            }
        });
        return klass;
    })
});
})