import { $A } from 'miniprototype'

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
