/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var cop = {};
export default cop;

/* 
 * Private Helpers for Development
 */

cop.Config = {};
cop.Config.ignoredepricatedProceed = true;

cop.log_layer_code = false;
cop.log = function (string) {
  if (log_layer_code) console.log(string);
};


/* 
 * Private State
 */

cop.proceedStack = [];
cop.GlobalLayers = [];
// hack, to work around absence of identity dictionaries in JavaScript
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()
// because working with objects is a serialization problem in itself, perhaps we should
// restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)
cop.object_id_counter = 0;

/* 
 * Private Methods
 */
// General utilities
function $A(iterable) {
  if (!iterable) {
    return [];
  }
  if (iterable.toArray) {
    return iterable.toArray();
  }
  var length = iterable.length;
  var results = new Array(length);
  while (length--) {
    results[length] = iterable[length];
  }
  return results;
}
cop.isFunction = function (object) {
  return typeof object === "function";
}
cop.isString  = function (object) {
  return typeof object === "string";
}
Object.assign (String.prototype, {
  capitalize () {
    if (this.length < 1) {
      return this;
    }
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
});
Object.assign(Function.prototype, {
  addMethods (/*...*/) {
    var args = arguments;
    var category = this.defaultCategoryName;
    var traits = [];
    for (var i = 0; i < args.length; i++) {
      if (cop.isString(args[i])) {
        category = args[i];
      } else {
        this.addCategorizedMethods(category, args[i] instanceof Function ? (args[i])() : args[i]);
      }
    }
    for (var i = 0; i < traits.length; i++) {
      traits[i].applyTo(this);
    }
  },
  addCategorizedMethods (categoryName, source) {
    // first parameter is a category name
    // copy all the methods and properties from {source} into the
    // prototype property of the receiver, which is intended to be
    // a class constructor.     Method arguments named '$super' are treated
    // specially, see Prototype.js documentation for "Class.create()" for details.
    // derived from Class.Methods.addMethods() in prototype.js
  
    // prepare the categories
    if (!this.categories) {
      this.categories = {};
    }
    if (!this.categories[categoryName]) {
      this.categories[categoryName] = [];
    }
    var currentCategoryNames = this.categories[categoryName];
    if (!source) {
      throw dbgOn(new Error('no source in addCategorizedMethods!'));
    }
    var ancestor = this.superclass && this.superclass.prototype;
    var className = this.type || "Anonymous";
    for (var property in source) {
      if (property == 'constructor') {
        continue;
      }
      var getter = source.__lookupGetter__(property);
      if (getter) {
        this.prototype.__defineGetter__(property, getter);
      }
      var setter = source.__lookupSetter__(property);
      if (setter) {
        this.prototype.__defineSetter__(property, setter);
      }
      if (getter || setter) {
        continue;
      }
      currentCategoryNames.push(property);
      var value = source[property];
      // weirdly, RegExps are functions in Safari, so testing for
      // Object.isFunction on regexp field values will return true.
      // But they're not full-blown functions and don't
      // inherit argumentNames from Function.prototype
      var hasSuperCall = ancestor && cop.isFunction(value) &&
        value.argumentNames && value.argumentNames().first() == "$super";
      if (hasSuperCall) {(function() {
          // wrapped in a function to save the value of 'method' for advice
          var method = value;
          var advice = (function(m) {
            return function callSuper() {
              var method = ancestor[m];
              if (!method) {
                throw new Error(Strings.format('Trying to call super of' +
                    '%s>>%s but super method non existing in %s', className, m, ancestor.constructor.type));
              }
              return method.apply(this, arguments);
            };
          })(property);
          advice.methodName = "$super:" + (this.superclass ? this.superclass.type + ">>" : "") + property;
          value = Object.extend(advice.wrap(method), {
            valueOf:  function() {
              return method
            },
            toString: function() {
              return method.toString()
            },
            originalFunction: method,
          });
          // for lively.Closures
          method.varMapping = {$super: advice};
        })();
      }
      this.prototype[property] = value;
      if (property === "formals") { // rk FIXME remove this cruft
        // special property (used to be pins, but now called formals to disambiguate old and new style
        Class.addPins(this, value);
      } else if (cop.isFunction(value)) {
        // remember name for profiling in WebKit
        value.displayName = className + "$" + property;
        for (; value; value = value.originalFunction) {
          if (value.methodName) {
            //console.log("class " + this.prototype.constructor.type
            // + " borrowed " + value.qualifiedMethodName());
          }
          value.declaredClass = this.prototype.constructor.type;
          value.methodName = property;
        }
      }
    } // end of for (var property in source)
    return this;
  }
});
// Array utilities
Object.assign(Array.prototype, {
  last () {
    return this[this.length - 1];
  },
  first () {
    return this[0];
  },
  clone () {
    return [].concat(this);
  },
  without () {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },
  withoutAll (otherArr) {
    return this.without.apply(this, otherArr);
  },
  select(iterator, context) {
    var results = [];
    for (var i = 0; i < this.length; i++) {
      var value = this[i];
      if (iterator.call(context, value, i)) {
        results.push(value);        
      }
    }
    return results;
  },
  include (object) {
    if (typeof this.indexOf == 'function') {
      return this.indexOf(object) != -1;
    }
    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },
  removeAt (index) {
    this.splice(index, 1);
  }
});

// for debugging ContextJS itself
cop.withLogLayerCode = function (func) {
  try {
    var old = log_layer_code;
    log_layer_code = true;
    func();
  } finally {
    log_layer_code = old;
  }
};

cop.getLayerDefinitionForObject = function (layer, object) {
  // log("cop.getLayerDefinitionForObject(" + layer + ", " + object + ")");
  if (!layer || !object) {
    return;
  }
  var result = layer[object._layer_object_id];
  return result ? result : cop.getLayerDefinitionForObject(layer, object.prototype);
};

cop.ensurePartialLayer = function (layer, object) {
  if (!layer) {
    throw new Error("in ensurePartialLayer: layer is nil");
  }
  if (!object.hasOwnProperty("_layer_object_id")) {
    object._layer_object_id = cop.object_id_counter++;
  }
  if (!layer[object._layer_object_id]) {
    layer[object._layer_object_id] = {_layered_object: object};
  }
  return layer[object._layer_object_id];
};

// TODO(mariannet) : Find out if ES6 constructor also has type
// TODO(mariannet) : ask Javascript Ninja about last line
cop.layerMethod = function (layer, object, property, func) {
  cop.ensurePartialLayer(layer, object)[property] = func;
  func.displayName = "layered " + layer.name + " "
                   + (object.constructor ? (object.constructor.type + "$") : "")
                   + property;
  cop.makeFunctionLayerAware(object, property, layer.isHidden);
  cop.isFunction(object.getName)
      && (layer.layeredFunctionsList[object][property] = true);
};

cop.layerGetterMethod = function (layer, object, property, getter) {
  Object.defineProperty(cop.ensurePartialLayer(layer, object), property,
                        {get: getter, configurable: true});
};

cop.layerSetterMethod = function (layer, object, property, setter) {
  Object.defineProperty(cop.ensurePartialLayer(layer, object), property,
                        {set: setter, configurable: true});
};

cop.layerProperty = function (layer, object, property, defs) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(defs, property);
  var getter = propertyDescriptor && propertyDescriptor.get;
  if (getter) {
    cop.layerGetterMethod(layer, object, property, getter);
  }
  var setter = propertyDescriptor && propertyDescriptor.set;
  if (setter) {
    cop.layerSetterMethod(layer, object, property, setter);
  }
  if (getter || setter) {
    cop.makePropertyLayerAware(object, property);
  } else {
    cop.layerMethod(layer, object, property, defs[property]);
  }
};

cop.layerPropertyWithShadow = function (layer, object, property) {
  // shadowing does not work with current implementation
  // see the shadow tests in LayersTest
  var defs = {};
  var baseValue = object[property];
  var layeredPropName = "_layered_" + layer.name + "_" + property;
  Object.defineProperty(defs, property, {
    get: function layeredGetter() {
      return this[layeredPropName] === undefined ?
          cop.proceed() : this[layeredPropName];
    },
    set: function layeredSetter(v) {
      this[layeredPropName] = v;
    },
    configurable: true
  });
  cop.layerProperty(layer, object, property, defs);
};

cop.computeLayersFor = function Layers$computeLayersFor(obj) {
  return obj && obj.activeLayers ?
      obj.activeLayers(cop.currentLayers) : cop.currentLayers();
};

cop.composeLayers = function (stack) {
  var result = cop.GlobalLayers.clone();
  for (var i = 0; i < stack.length; i++) {
    var current = stack[i];
    if (current.withLayers) {
      result = result.withoutAll(current.withLayers).concat(current.withLayers);
    } else if (current.withoutLayers) {
      result = result.withoutAll(current.withoutLayers);
    }
  }
  return result;
};

cop.currentLayers = function () {
  if (cop.LayerStack.length == 0) {
    throw new Error("The default layer is missing");
  }
  // NON OPTIMIZED VERSION FOR STATE BASED LAYER ACTIVATION
  var current = cop.LayerStack.last();
  if (!current.composition) {
    current.composition = cop.composeLayers(cop.LayerStack);
  }
  return current.composition;
};

// clear cached layer compositions
cop.invalidateLayerComposition = function () {
  cop.LayerStack.forEach(
    function(ea) {
      ea.composition = null;
    });
};

cop.resetLayerStack = function () {
  cop.LayerStack = [{
    isStatic: true,
    toString: function() { return "BaseLayer"; },
    composition: null
  }];
  cop.invalidateLayerComposition();
};

cop.lookupLayeredFunctionForObject = function (
    self, layer, function_name, methodType, n) {
  if (!layer) {
    return undefined; 
  }
  // we have to look for layer defintions in self, self.prototype,
  // ... there may be layered methods in a subclass of "obj"
  var layered_function;
  var layer_definition_for_object = cop.getLayerDefinitionForObject(layer, self);
  if (layer_definition_for_object) {
    // log("  found layer definitions for object");
    // TODO: optional proceed goes here....
    if (methodType == 'getter') {
      layered_function = Object.getOwnPropertyDescriptor(layer_definition_for_object, function_name).get;
    } else if (methodType == 'setter'){
      layered_function = Object.getOwnPropertyDescriptor(layer_definition_for_object, function_name).set;
    } else {
      if (layer_definition_for_object.hasOwnProperty(function_name)) {
        layered_function = layer_definition_for_object[function_name];
      }
    }
  }
  if (!layered_function) {
    // try the superclass hierachy
    // log("look for superclass of: " + self.constructor)
    var superclass = Object.getPrototypeOf(self);
    if (superclass) {
      // log("layered function is not found
      //in this partial method, lookup for my prototype?")
      return cop.lookupLayeredFunctionForObject(
          superclass, layer, function_name, methodType);
    } else {
        // log("obj has not prototype")
    }
  }
  return layered_function;
};

cop.pvtMakeFunctionOrPropertyLayerAware
    = function (obj, slotName, baseValue, type, isHidden) {
  // install in obj[slotName] a cop wrapper that weaves partial methods
  // into real method (baseValue)
  if (baseValue.isLayerAware) {
    return;
  }
  cop.makeSlotLayerAwareWithNormalLookup(obj, slotName, baseValue, type, isHidden);
};

cop.makeSlotLayerAwareWithNormalLookup = function (
    obj, slotName, baseValue, type, isHidden) {
  var wrapped_function = function() {
    var composition =
        new cop.PartialLayerComposition(this, obj, slotName, baseValue, type);
    cop.proceedStack.push(composition);
    try {
      return cop.proceed.apply(this, arguments);
    } finally {
      cop.proceedStack.pop()
    };
  };
  wrapped_function.isLayerAware = true;
  // this is more declarative outside of COP context
  wrapped_function.isContextJSWrapper = true;
  if (isHidden) {
    wrapped_function.toString = function () {
      return this.getOriginal().toString()
    };
  }
  // For wrapped_function.getOriginal()
  wrapped_function.originalFunction = baseValue;
  if (type == "getter") {
    Object.defineProperty(obj, slotName, {get: wrapped_function});
  } else if (type == "setter") {
    Object.defineProperty(obj, slotName, {set: wrapped_function});
  } else {
    obj[slotName] = wrapped_function;
  }
};

cop.makeFunctionLayerAware = function (base_obj, function_name, isHidden) {
  if (!base_obj) {
    throw new Error("can't layer an non existent object");
  }
  /* ensure base function */
  var base_function = base_obj[function_name];
  if (!base_function) {
    // console.log("WARNING can't layer an non existent function" + function_name +
    // " , so do nothing")
    // return;
    base_function = () => null;
  };
  cop.pvtMakeFunctionOrPropertyLayerAware(base_obj, function_name, base_function,
                                            undefined, isHidden)
};

cop.makePropertyLayerAware = function (baseObj, property) {
  if (!baseObj) {
    throw new Error("can't layer an non existent object");
  }  
  // ensure base getter and setter
  var propertyDescriptor = Object.getOwnPropertyDescriptor(baseObj, property);
  var getter = propertyDescriptor && propertyDescriptor.get;
  var propName = "__layered_" + property + "__";
  if (!getter) {
    // does not work when dealing with classes and instances...
    baseObj[propName] = baseObj[property]; // take over old value
    getter = function() { return this[propName] };
    Object.defineProperty(baseObj, property, {get: getter, configurable: true});
  };
  var setter = propertyDescriptor && propertyDescriptor.set;
  if (!setter) {
    setter = function(value) { return this[propName] = value };
    Object.defineProperty(baseObj, property, {set: setter, configurable: true});
  };
  cop.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, getter, 'getter');
  cop.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, setter, 'setter');
};

cop.makeFunctionLayerUnaware = function (base_obj, function_name) {
  if (!base_obj) {
    throw new Error("need object to makeFunctionLayerUnaware");
  }
  var prevFunction;
  var currentFunction = base_obj[function_name];
  if (currentFunction === undefined) {
    return; // nothing to do here
  }  
  while (typeof currentFunction.originalFunction == 'function'
      && !currentFunction.isLayerAware) {
    var prevFunction = currentFunction;
    currentFunction = currentFunction.originalFunction
  }
  if (!(currentFunction.isLayerAware)) {
    return; // nothing to do here
  }
  var originalFunction = currentFunction.originalFunction
  if (!(originalFunction instanceof Function)) {
    throw new Error("makeFunctionLayerUnaware Error: no orignal function");
  }
  if (prevFunction instanceof Function) {
    prevFunction.originalFunction = originalFunction
  } else {
    base_obj[function_name] = originalFunction
  }
};

cop.uninstallLayersInObject = function (object) {
  Object.getOwnPropertyNames(object).forEach(ea => {
    if (typeof object[ea] === 'function')
      cop.makeFunctionLayerUnaware(object, ea);
  });
};

cop.uninstallLayersInAllClasses = function () {
  Global.classes(true).forEach(
    function(ea) {
      cop.uninstallLayersInObject(ea.prototype);
    });
};

cop.allLayers = function (optObject = Global) {
  // does not really return all layers... layers in namepsaces are not found!
  // therefore you can query all layers in an optObject
  return Object.values(optObject).select(
    function(ea) {
      return ea instanceof Layer;
    });
};

/* 
 * PUBLIC COP Layer Definition
 */

/* 
 * Layer Class
 */
export class Layer {
  constructor (name, context) {
    this._name = name;
    this._context = context;
    this._layeredFunctionsList = {};
  }
  
  // Accessing
  get name () {
    return this._name;
  }
  fullName () {
    return '' + this._context + '.' + this._name;
  }
  layeredObjects () {
    return Properties.own(this)
      .collect(
        function(ea) {
          return this[ea] && this[ea]._layered_object;
        }, this)
      .select(
        function(ea) {
          return ea;
        });
  }
  // TODO: doesn't differentiate between functions and classes - necessary?
  layeredClasses () {
    return this.layeredObjects().collect(
      function(ea) {
        return ea.constructor;
      });
  }
  
  // Removing
  remove () {
    // Deletes the LayerClass, but keeps the layered Functions.
    if (this.isGlobal()) {
      this.beNotGlobal();
    }
    var context = this._context;
    if (typeof context !== 'undefined')
      delete context[this.name];
  }
  uninstall () {
    // Uninstalls jsut this Layer.
    // functions that are layered by other Layers will not be reset.
    var layer = this;
    this.layeredObjects().each(
      function(eachLayeredObj) {
        var layerIdx = cop.isFunction(eachLayeredObj.activeLayers)
            ? eachLayeredObj.activeLayers().indexOf(layer) : -1;
        Properties.own(layer.layeredFunctionsList[eachLayeredObj]).each(
          function(eachLayeredFunc) {
            var newerLayer = eachLayeredObj.activeLayers().find(
              function(eachOtherLayer) {
                var eachOtherLayerIdx
                    = eachLayeredObj.activeLayers().indexOf(eachOtherLayer);
                var isNewer = (eachOtherLayerIdx !== -1)
                    && (eachOtherLayerIdx < layerIdx);
                return isNewer &&
                    eachOtherLayer.layeredFunctionsList[eachLayeredObj][eachLayeredFunc];
              });
              if (!newerLayer) {
                cop.makeFunctionLayerUnaware(eachLayeredObj, eachLayeredFunc);
              }
          });
      });
      this.remove();
      alertOK("Successfully uninstalled Layer " + this + " in Global Classes");
  }
  
  // Layer installation
  layerClass (classObject, methods) {
    cop.layerClass(this, classObj, methods);
    return this;
  }
  layerObject (obj, methods) {
    cop.layerObject(this, classObj, methods);
    return this;
  }
  refineClass (classObj, methods) {
    cop.layerClass(this, classObj, methods);
    return this;
  }
  refineObject (obj, methods) {
    cop.layerObject(this, obj, methods);
    return this;
  }
  unrefineObject (obj) {
    var id = obj._layer_object_id;
    if (id !== undefined) {
      delete this[id];
    }
  }
  unrefineClass (classObj) {
    this.unrefineObject(classObj.prototype);
  }
  
  // Layer activation
  beGlobal () {
    cop.enableLayer(this);
    return this;
  }
  beNotGlobal () {
    cop.disableLayer(this);
    return this;
  }
  hide () {
    // Hidden Layers do not appear when evaluating the sourcecode of a function
    // TODO: this function has to be called BEFORE the layer refines any class,
    // due to problems in unrefining classes.
    this.isHidden = true;
    return this;
  }
  
  // Testing
  isGlobal () {
    return cop.GlobalLayers.include(this);
  }
  
  // Debugging
  toString () {
    return this.name;
  }
  
  // Deprecated serialization
  toLiteral () {
    if (!this.name) {
      console.warn("Layer: Can not serialize without a name!");
    }
    return { name: this.name };
  }
  
  // Deserialization
  fromLiteral (literal) {
    // console.log("Deserializing Layer activation from: " + literal.name);
    return cop.create(literal.name, false);
  }
}
cop.Layer = Layer; // TODO: replace with proper module exports

var globalContextForLayers = {};

export { globalContextForLayers as Global };

cop.basicCreate = function (layerName, context) {
  if (typeof context === 'undefined')
    context = globalContextForLayers;
  return context[layerName] ||
    (context[layerName] = new Layer(layerName, context));
};

cop.create = function (rootContext, layerName) {
  if (typeof layerName === 'undefined') {
    // support cop.create('LayerName') syntax without context
    // (for "global" layers)
    layerName = rootContext;
    rootContext = undefined;
  }
  if (typeof rootContext === 'undefined') {
    return cop.basicCreate(layerName);
  }
  var parts = layerName.split(/\./);
  var context = rootContext;
  for (let i = 0; i < parts.length - 1; ++i) {
    context = context[parts[i]];
  }
  return cop.basicCreate(parts[parts.length - 1], context);
};

// Layering objects may be a garbage collection problem, because the layers keep strong
// reference to the objects
cop.layerObject = function (layer, object, defs) {
  // log("cop.layerObject");
  cop.isFunction(object.getName) && (layer.layeredFunctionsList[object] = {});
  Object.getOwnPropertyNames(defs).forEach(
    function (function_name) {
      // log(" layer property: " + function_name)
      cop.layerProperty(layer, object, function_name, defs);
    });
};

// layer around only the class methods
cop.layerClass = function (layer, classObject, defs) {
  if (!classObject || !classObject.prototype) {
    throw new Error("ContextJS: can not refine class '" + classOBject + "' in " + layer);
  }
  cop.layerObject(layer, classObject.prototype, defs);
};

// Layer Activation
cop.withLayers = function (layers, func) {
  cop.LayerStack.push({withLayers: layers});
  // console.log("callee: " + cop.withLayers.callee);
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

cop.withoutLayers = function (layers, func) {
  cop.LayerStack.push({withoutLayers: layers});
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

// Gloabl Layer Activation
cop.enableLayer = function (layer) {
  if (cop.GlobalLayers.include(layer)) {
    return;
  }
  cop.GlobalLayers.push(layer);
  cop.invalidateLayerComposition();
};

cop.disableLayer = function (layer) {
  var idx = cop.GlobalLayers.indexOf(layer);
  if (idx < 0) {
    return;
  }
  cop.GlobalLayers.removeAt(idx);
  cop.invalidateLayerComposition();
};

cop.proceed = function (/* arguments */) {
  // COP Proceed Function
  var composition = cop.proceedStack.last();
  if (!composition) {
    console.log('ContextJS: no composition to proceed (stack is empty) ');
    return;
  }
  // TODO use index instead of shifiting?
  if (composition.partialMethodIndex == undefined) {
    composition.partialMethodIndex = composition.partialMethods.length - 1;
  }  
  var index = composition.partialMethodIndex;
  var partialMethod = composition.partialMethods[index];
  if (!partialMethod) {
    if (!partialMethod) {
      throw new COPError('no partialMethod to proceed');
    }
  } else {
    try {
      composition.partialMethodIndex = index - 1;
      if (!cop.Config.ignoredepricatedProceed
          && partialMethod.toString().match(/^[\t ]*function ?\(\$?proceed/)) {
        var args = $A(arguments);
        args.unshift(cop.proceed);
        var msg = "proceed in arguments list in " + composition.functionName();
        if (cop.Config.throwErrorOnDepricated) {
          throw new Error("DEPRICATED ERROR: " + msg);
        }
        if (cop.Config.logDepricated) {
          // console.log("source: " + partialMethod.toString());
          console.log("DEPRICATED WARNING: " + msg);
        }
        var result = partialMethod.apply(composition.object, args);
      } else {
        var result = partialMethod.apply(composition.object, arguments);
      }
    } finally {
      composition.partialMethodIndex = index;
    }
    return result;
  }
};

/*
 * Example implementation of a layerable object
 */
class LayerableObjectTrait {
  activeLayers () {
    var result = {withLayers: [], withoutLayers: []};
    this.dynamicLayers(result);
    this.structuralLayers(result);
    this.globalLayers(result);
    return result.withLayers;
  }
  collectWithLayersIn (layers, result) {
    for (var i = 0; i < layers.length; i++) {
      var ea = layers[i]
      if ((result.withLayers.indexOf(ea) === -1)
          && (result.withoutLayers.indexOf(ea) === -1)) {
        result.withLayers.unshift(ea)
      }
    }
  }
  collectWithoutLayersIn (layers, result) {
    for (var i = 0; i < layers.length; i++) {
      var ea = layers[i]
      if (result.withoutLayers.indexOf(ea) === -1) {
        result.withoutLayers.push(ea)
      }
    }
  }
  dynamicLayers (result) {
    // optimized version, that does not use closures and recursion
    var stack = cop.LayerStack;
    // top down, ignore bottom element
    for (var j = stack.length - 1; j > 0; j--) {
      var current = stack[j];
      if (current.withLayers) {
        this.collectWithLayersIn(current.withLayers, result);
      }
      if (current.withoutLayers) {
        this.collectWithoutLayersIn(current.withoutLayers, result);
      }
    }
    return result;
  }
  structuralLayers (result) {
    var allLayers = result.withLayers;
    var allWithoutLayers = result.withoutLayers;
    var obj = this;
    // go ownerchain backward and gather all layer activations and deactivations
    while (obj) {
      // don't use accessor methods because of speed... (not measured yet)
      if (obj.withLayers) {
          this.collectWithLayersIn(obj.withLayers, result);
      }
      if (obj.withoutLayers) {
          this.collectWithoutLayersIn(obj.withoutLayers, result);
      }      
      // recurse, stop if owner is undefined
      obj = obj.owner;
    }
    return result;
  }
  globalLayers (result) {
    this.collectWithLayersIn(cop.GlobalLayers, result);
    return result;
  }
  setWithLayers (layers) {
    this.withLayers = layers;
  }
  addWithLayer (layer) {
    var layers = this.getWithLayers();
    if (!layers.include(layer)) {
      this.setWithLayers(layers.concat([layer]));
    }
  }
  removeWithLayer (layer) {
    var layers = this.getWithLayers();
    if (layers.include(layer)) {
      this.setWithLayers(layers.without(layer));
    }
  }
  addWithoutLayer (layer) {
    var layers = this.getWithoutLayers();
    if (!layers.include(layer)) {
      this.setWithoutLayers(layers.concat([layer]));
    }
  }
  removeWithoutLayer (layer) {
    var layers = this.getWithoutLayers();
    this.setWithoutLayers(layers.without(layer));
  }
  setWithoutLayers (layers) {
    this.withoutLayers = layers;
  }
  getWithLayers (layers) {
    return this.withLayers || [];
  }
  getWithoutLayer (layers) {
    return this.withoutLayers || [];
  }
}
cop.LayerableObjectTrait = LayerableObjectTrait;

export class LayerableObject extends LayerableObjectTrait {}

cop.COPError = class COPError {
  constructor (message) {
    this._msg = msg;
  }
  toString () {
    return "COP ERROR: " + this._msg;
  }
}

cop.PartialLayerComposition = class PartialLayerComposition {
  constructor (obj, prototypeObject, functionName, baseFunction, methodType) {
    this._partialMethods = [baseFunction];
    var layers = cop.computeLayersFor(obj);
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var partialMethod = cop.lookupLayeredFunctionForObject(
            obj, layer, functionName, methodType);
        if (partialMethod) {
          this._partialMethods.push(partialMethod);
        }
    }
    this._object = obj;
    this._prototypeObject = prototypeObject;
    this._functionName = functionName;
  }

  get object() {
    return this._object;
  }
  
  get partialMethods () {
    return this._partialMethods;
  }
  
  get functionName() {
    return this._functionName;
  }

  get prototypeObject() {
    return this._prototypeObject;
  }
}

cop.resetLayerStack();

// vim: sw=2
