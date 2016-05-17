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

var copv2 = {};
export default copv2;

/* 
 * Private Helpers for Development
 */

copv2.Config = {};
copv2.Config.ignoredepricatedProceed = true;

copv2.log_layer_code = false;
copv2.log = function (string) {
  if (log_layer_code) console.log(string);
};


/* 
 * Private State
 */

copv2.proceedStack = [];
copv2.GlobalLayers = [];
// hack, to work around absence of identity dictionaries in JavaScript
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()
// because working with objects is a serialization problem in itself, perhaps we should
// restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)
copv2.object_id_counter = 0;

/* 
 * Private Methods
 */

// for debugging ContextJS itself
copv2.withLogLayerCode = function (func) {
  try {
    var old = log_layer_code;
    log_layer_code = true;
    func();
  } finally {
    log_layer_code = old;
  }
};

copv2.getLayerDefinitionForObject = function (layer, object) {
  // log("copv2.getLayerDefinitionForObject(" + layer + ", " + object + ")");
  if (!layer || !object) {
    return;
  }
  var result = layer[object._layer_object_id];
  return result ? result : copv2.getLayerDefinitionForObject(layer, object.prototype);
};

copv2.ensurePartialLayer = function (layer, object) {
  if (!layer) {
    throw new Error("in ensurePartialLayer: layer is nil");
  }
  if (!object.hasOwnProperty("_layer_object_id")) {
    object._layer_object_id = copv2.object_id_counter++;
  }
  if (!layer[object._layer_object_id]) {
    layer[object._layer_object_id] = {_layered_object: object};
  }
  return layer[object._layer_object_id];
};

// TODO(mariannet) : Find out if ES6 constructor also has type
// TODO(mariannet) : ask Javascript Ninja about last line
copv2.layerMethod = function (layer, object, property, func) {
  copv2.ensurePartialLayer(layer, object)[property] = func;
  func.displayName = "layered " + layer.name + " "
                   + (object.constructor ? (object.constructor.type + "$") : "")
                   + property;
  copv2.makeFunctionLayerAware(object, property, layer.isHidden);
  Object.isFunction(object.getName)
      && (layer.layeredFunctionsList[object][property] = true);
};

copv2.layerGetterMethod = function (layer, object, property, getter) {
  Object.defineProperty(copv2.ensurePartialLayer(layer, object), property,
                        {get: getter, configurable: true});
};

copv2.layerSetterMethod = function (layer, object, property, setter) {
  Object.defineProperty(copv2.ensurePartialLayer(layer, object), property,
                        {set: setter, configurable: true});
};

copv2.layerProperty = function (layer, object, property, defs) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(defs, property);
  var getter = propertyDescriptor && propertyDescriptor.get;
  if (getter) {
    copv2.layerGetterMethod(layer, object, property, getter);
  }
  var setter = propertyDescriptor && propertyDescriptor.set;
  if (setter) {
    copv2.layerSetterMethod(layer, object, property, setter);
  }
  if (getter || setter) {
    copv2.makePropertyLayerAware(object, property);
  } else {
    copv2.layerMethod(layer, object, property, defs[property]);
  }
};

copv2.layerPropertyWithShadow = function (layer, object, property) {
  // shadowing does not work with current implementation
  // see the shadow tests in LayersTest
  var defs = {};
  var baseValue = object[property];
  var layeredPropName = "_layered_" + layer.name + "_" + property;
  Object.defineProperty(defs, property, {
    get: function layeredGetter() {
      return this[layeredPropName] === undefined ?
          copv2.proceed() : this[layeredPropName];
    },
    set: function layeredSetter(v) {
      this[layeredPropName] = v;
    },
    configurable: true
  });
  copv2.layerProperty(layer, object, property, defs);
};

copv2.computeLayersFor = function Layers$computeLayersFor(obj) {
  return obj && obj.activeLayers ?
      obj.activeLayers(copv2.currentLayers) : copv2.currentLayers();
};

copv2.composeLayers = function (stack) {
  var result = copv2.GlobalLayers.clone();
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

copv2.currentLayers = function () {
  if (copv2.LayerStack.length == 0) {
    throw new Error("The default layer is missing");
  }
  // NON OPTIMIZED VERSION FOR STATE BASED LAYER ACTIVATION
  var current = copv2.LayerStack.last();
  if (!current.composition) {
    current.composition = copv2.composeLayers(copv2.LayerStack);
  }
  return current.composition;
};

// clear cached layer compositions
copv2.invalidateLayerComposition = function () {
  copv2.LayerStack.forEach(
    function(ea) {
      ea.composition = null;
    });
};

copv2.resetLayerStack = function () {
  copv2.LayerStack = [{
    isStatic: true,
    toString: function() { return "BaseLayer"; },
    composition: null
  }];
  copv2.invalidateLayerComposition();
};

copv2.lookupLayeredFunctionForObject = function (
    self, layer, function_name, methodType, n) {
  if (!layer) {
    return undefined; 
  }
  // we have to look for layer defintions in self, self.prototype,
  // ... there may be layered methods in a subclass of "obj"
  var layered_function;
  var layer_definition_for_object = copv2.getLayerDefinitionForObject(layer, self);
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
      return copv2.lookupLayeredFunctionForObject(
          superclass, layer, function_name, methodType);
    } else {
        // log("obj has not prototype")
    }
  }
  return layered_function;
};

copv2.pvtMakeFunctionOrPropertyLayerAware
    = function (obj, slotName, baseValue, type, isHidden) {
  // install in obj[slotName] a cop wrapper that weaves partial methods
  // into real method (baseValue)
  if (baseValue.isLayerAware) {
    return;
  }
  copv2.makeSlotLayerAwareWithNormalLookup(obj, slotName, baseValue, type, isHidden);
};

copv2.makeSlotLayerAwareWithNormalLookup = function (
    obj, slotName, baseValue, type, isHidden) {
  var wrapped_function = function() {
    var composition =
        new copv2.PartialLayerComposition(this, obj, slotName, baseValue, type);
    copv2.proceedStack.push(composition);
    try {
      return copv2.proceed.apply(this, arguments);
    } finally {
      copv2.proceedStack.pop()
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

copv2.makeFunctionLayerAware = function (base_obj, function_name, isHidden) {
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
  copv2.pvtMakeFunctionOrPropertyLayerAware(base_obj, function_name, base_function,
                                            undefined, isHidden)
};

copv2.makePropertyLayerAware = function (baseObj, property) {
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
  copv2.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, getter, 'getter');
  copv2.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, setter, 'setter');
};

copv2.makeFunctionLayerUnaware = function (base_obj, function_name) {
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

copv2.uninstallLayersInObject = function (object) {
  Object.getOwnPropertyNames(object).forEach(ea => {
    if (typeof object[ea] === 'function')
      copv2.makeFunctionLayerUnaware(object, ea);
  });
};

copv2.uninstallLayersInAllClasses = function () {
  Global.classes(true).forEach(
    function(ea) {
      copv2.uninstallLayersInObject(ea.prototype);
    });
};

copv2.allLayers = function (optObject = Global) {
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
        var layerIdx = Object.isFunction(eachLayeredObj.activeLayers)
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
                copv2.makeFunctionLayerUnaware(eachLayeredObj, eachLayeredFunc);
              }
          });
      });
      this.remove();
      alertOK("Successfully uninstalled Layer " + this + " in Global Classes");
  }
  
  // Layer installation
  layerClass (classObject, methods) {
    copv2.layerClass(this, classObj, methods);
    return this;
  }
  layerObject (obj, methods) {
    copv2.layerObject(this, classObj, methods);
    return this;
  }
  refineClass (classObj, methods) {
    copv2.layerClass(this, classObj, methods);
    return this;
  }
  refineObject (obj, methods) {
    copv2.layerObject(this, obj, methods);
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
    copv2.enableLayer(this);
    return this;
  }
  beNotGlobal () {
    copv2.disableLayer(this);
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
    return copv2.GlobalLayers.include(this);
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
    return copv2.create(literal.name, false);
  }
}
copv2.Layer = Layer; // TODO: replace with proper module exports

var globalContextForLayers = {};

export { globalContextForLayers as Global };

copv2.basicCreate = function (layerName, context) {
  if (typeof context === 'undefined')
    context = globalContextForLayers;
  return context[layerName] ||
    (context[layerName] = new Layer(layerName, context));
};

copv2.create = function (rootContext, layerName) {
  if (typeof layerName === 'undefined') {
    // support copv2.create('LayerName') syntax without context
    // (for "global" layers)
    layerName = rootContext;
    rootContext = undefined;
  }
  if (typeof rootContext === 'undefined') {
    return copv2.basicCreate(layerName);
  }
  var parts = layerName.split(/\./);
  var context = rootContext;
  for (let i = 0; i < parts.length - 1; ++i) {
    context = context[parts[i]];
  }
  return copv2.basicCreate(parts[parts.length - 1], context);
};

// Layering objects may be a garbage collection problem, because the layers keep strong
// reference to the objects
copv2.layerObject = function (layer, object, defs) {
  // log("copv2.layerObject");
  Object.isFunction(object.getName) && (layer.layeredFunctionsList[object] = {})
  Object.getOwnPropertyNames(defs).forEach(
    function (function_name) {
      // log(" layer property: " + function_name)
      copv2.layerProperty(layer, object, function_name, defs);
    });
};

// layer around only the class methods
copv2.layerClass = function (layer, classObject, defs) {
  if (!classObject || !classObject.prototype) {
    throw new Error("ContextJS: can not refine class '" + classOBject + "' in " + layer);
  }
  copv2.layerObject(layer, classObject.prototype, defs);
};

copv2.layerClassAndSubclasses = function (layer, classObject, defs) {
  copv2.layerClass(layer, classObject, defs);
  console.warn('layering subclasses automatically is not supported yet');
  // TODO: and now wrap all overriden methods...
  // foreach descendant class dclass of classObject
  //   foreach own property p of dclass
  //     copv2.make{Function|Property}LayerAware(obj, p);
};

// Layer Activation
copv2.withLayers = function (layers, func) {
  copv2.LayerStack.push({withLayers: layers});
  // console.log("callee: " + copv2.withLayers.callee);
  try {
    return func();
  } finally {
    copv2.LayerStack.pop();
  }
};

copv2.withoutLayers = function (layers, func) {
  copv2.LayerStack.push({withoutLayers: layers});
  try {
    return func();
  } finally {
    copv2.LayerStack.pop();
  }
};

// Gloabl Layer Activation
copv2.enableLayer = function (layer) {
  if (copv2.GlobalLayers.include(layer)) {
    return;
  }
  copv2.GlobalLayers.push(layer);
  copv2.invalidateLayerComposition();
};

copv2.disableLayer = function (layer) {
  var idx = copv2.GlobalLayers.indexOf(layer);
  if (idx < 0) {
    return;
  }
  copv2.GlobalLayers.removeAt(idx);
  copv2.invalidateLayerComposition();
};

copv2.proceed = function (/* arguments */) {
  // COP Proceed Function
  var composition = copv2.proceedStack.last();
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
      if (!copv2.Config.ignoredepricatedProceed
          && partialMethod.toString().match(/^[\t ]*function ?\(\$?proceed/)) {
        var args = $A(arguments);
        args.unshift(copv2.proceed);
        var msg = "proceed in arguments list in " + composition.functionName();
        if (copv2.Config.throwErrorOnDepricated) {
          throw new Error("DEPRICATED ERROR: " + msg);
        }
        if (copv2.Config.logDepricated) {
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
    var stack = copv2.LayerStack;
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
    this.collectWithLayersIn(copv2.GlobalLayers, result);
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
  setWithoutLayer (layers) {
    this.withoutLayers = layers;
  }
  getWithLayers (layers) {
    return this.withLayers || [];
  }
  getWithoutLayer (layers) {
    return this.withoutLayers || [];
  }
}
copv2.LayerableObjectTrait = LayerableObjectTrait;

export class LayerableObject extends LayerableObjectTrait {}

copv2.COPError = class COPError {
  constructor (message) {
    this._msg = msg;
  }
  toString () {
    return "COP ERROR: " + this._msg;
  }
}

copv2.PartialLayerComposition = class PartialLayerComposition {
  constructor (obj, prototypeObject, functionName, baseFunction, methodType) {
    this._partialMethods = [baseFunction];
    var layers = copv2.computeLayersFor(obj);
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var partialMethod = copv2.lookupLayeredFunctionForObject(
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

copv2.resetLayerStack();

// vim: sw=2
