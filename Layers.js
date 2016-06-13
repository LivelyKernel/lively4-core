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

/* 
 * Private Helpers for Development
 */

export const Config = {};
Config.ignoreDeprecatedProceed = true;

export let log_layer_code = false;
export function log(string) {
  if (log_layer_code) console.log(string);
}


/* 
 * Private State
 */

export const proceedStack = [];
export const GlobalLayers = [];
// hack, to work around absence of identity dictionaries in JavaScript
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()
// because working with objects is a serialization problem in itself, perhaps we should
// restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)
let object_id_counter = 0;

/* 
 * Private Methods
 */

// for debugging ContextJS itself
export function withLogLayerCode(func) {
  try {
    var old = log_layer_code;
    log_layer_code = true;
    func();
  } finally {
    log_layer_code = old;
  }
};

export function getLayerDefinitionForObject(layer, object) {
  // log("cop getLayerDefinitionForObject(" + layer + ", " + object + ")");
  if (!layer || !object) {
    return;
  }
  var result = layer[object._layer_object_id];
  return result ? result : getLayerDefinitionForObject(layer, object.prototype);
};

export function ensurePartialLayer(layer, object) {
  if (!layer) {
    throw new Error("in ensurePartialLayer: layer is nil");
  }
  if (!object.hasOwnProperty("_layer_object_id")) {
    object._layer_object_id = object_id_counter++;
  }
  if (!layer[object._layer_object_id]) {
    layer[object._layer_object_id] = {_layered_object: object};
  }
  return layer[object._layer_object_id];
};

// TODO(mariannet) : Find out if ES6 constructor also has type
export function layerMethod(layer, object, property, func) {
  ensurePartialLayer(layer, object)[property] = func;
  func.displayName = "layered " + String(layer.name) + " "
                   + (object.constructor ? (object.constructor.type + "$") : "")
                   + property;
  makeFunctionLayerAware(object, property, layer.isHidden);
  
  // Bookkeeping for layer uninstall
  // typeof object.getName === 'function'
  //    && (layer._layeredFunctionsList[object][property] = true);
};

function layerGetterMethod(layer, object, property, getter) {
  Object.defineProperty(ensurePartialLayer(layer, object), property,
                        {get: getter, configurable: true});
};

function layerSetterMethod(layer, object, property, setter) {
  Object.defineProperty(ensurePartialLayer(layer, object), property,
                        {set: setter, configurable: true});
};

export function layerProperty(layer, object, property, defs) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(defs, property);
  var getter = propertyDescriptor && propertyDescriptor.get;
  if (getter) {
    layerGetterMethod(layer, object, property, getter);
  }
  var setter = propertyDescriptor && propertyDescriptor.set;
  if (setter) {
    layerSetterMethod(layer, object, property, setter);
  }
  if (getter || setter) {
    makePropertyLayerAware(object, property);
  } else {
    layerMethod(layer, object, property, defs[property]);
  }
};

export function layerPropertyWithShadow(layer, object, property) {
  // shadowing does not work with current implementation
  // see the shadow tests in LayersTest
  var defs = {};
  var baseValue = object[property];
  var layeredPropName = "_layered_" + layer.name + "_" + property;
  Object.defineProperty(defs, property, {
    get: function layeredGetter() {
      return this[layeredPropName] === undefined ?
          proceed() : this[layeredPropName];
    },
    set: function layeredSetter(v) {
      this[layeredPropName] = v;
    },
    configurable: true
  });
  layerProperty(layer, object, property, defs);
};

export function computeLayersFor(obj) {
  return obj && obj.activeLayers ?
      obj.activeLayers(currentLayers) : currentLayers();
};

export function composeLayers(stack) {
  var result = GlobalLayers.slice(0);
  for (var i = 0; i < stack.length; i++) {
    var current = stack[i];
    if (current.withLayers) {
      result = result.filter(l => !current.withLayers.includes(l)).concat(current.withLayers);
    } else if (current.withoutLayers) {
      result = result.filter(l => !current.withoutLayers.includes(l));
    }
  }
  return result;
};

export let LayerStack;

export function resetLayerStack() {
  LayerStack = [{
    isStatic: true,
    toString: function() { return "BaseLayer"; },
    composition: null
  }];
  invalidateLayerComposition();
};

export function currentLayers() {
  if (LayerStack.length == 0) {
    throw new Error("The default layer is missing");
  }
  // NON OPTIMIZED VERSION FOR STATE BASED LAYER ACTIVATION
  var current = LayerStack[LayerStack.length - 1];
  if (!current.composition) {
    current.composition = composeLayers(LayerStack);
  }
  return current.composition;
};

// clear cached layer compositions
export function invalidateLayerComposition() {
  LayerStack.forEach(
    function(ea) {
      ea.composition = null;
    });
};

export function lookupLayeredFunctionForObject(
    self, layer, function_name, methodType, n) {
  if (!layer) {
    return undefined; 
  }
  // we have to look for layer defintions in self, self.prototype,
  // ... there may be layered methods in a subclass of "obj"
  var layered_function;
  var layer_definition_for_object = getLayerDefinitionForObject(layer, self);
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
      return lookupLayeredFunctionForObject(
          superclass, layer, function_name, methodType);
    } else {
        // log("obj has not prototype")
    }
  }
  return layered_function;
};

function pvtMakeFunctionOrPropertyLayerAware(obj, slotName, baseValue, type, isHidden) {
  // install in obj[slotName] a cop wrapper that weaves partial methods
  // into real method (baseValue)
  if (baseValue.isLayerAware) {
    return;
  }
  makeSlotLayerAwareWithNormalLookup(obj, slotName, baseValue, type, isHidden);
};

function makeSlotLayerAwareWithNormalLookup(
    obj, slotName, baseValue, type, isHidden) {
  var wrapped_function = function() {
    var composition =
        new PartialLayerComposition(this, obj, slotName, baseValue, type);
    proceedStack.push(composition);
    try {
      return proceed.apply(this, arguments);
    } finally {
      proceedStack.pop()
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

function makeFunctionLayerAware(base_obj, function_name, isHidden) {
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
  pvtMakeFunctionOrPropertyLayerAware(base_obj, function_name, base_function,
                                            undefined, isHidden)
};

function makePropertyLayerAware(baseObj, property) {
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
  pvtMakeFunctionOrPropertyLayerAware(baseObj, property, getter, 'getter');
  pvtMakeFunctionOrPropertyLayerAware(baseObj, property, setter, 'setter');
};

function makeFunctionLayerUnaware(base_obj, function_name) {
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

export function uninstallLayersInObject(object) {
  Object.getOwnPropertyNames(object).forEach(ea => {
    if (typeof object[ea] === 'function')
      makeFunctionLayerUnaware(object, ea);
  });
};

export function uninstallLayersInAllClasses() {
  Global.classes(true).forEach(
    function(ea) {
      uninstallLayersInObject(ea.prototype);
    });
};

export function allLayers(optObject = Global) {
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
    // this._layeredFunctionsList = {};
  }
  
  // Accessing
  get name () {
    return this._name;
  }
  fullName () {
    return '' + this._context + '.' + this._name;
  }
  layeredObjects () {
    return Object.getOwnPropertyNames(this)
      .map(ea => this[ea] && this[ea]._layered_object)
      .filter(ea => ea); // filters falsy things
  }
  // TODO: doesn't differentiate between functions and classes - necessary?
  layeredClasses () {
    return this.layeredObjects().map(ea => ea.constructor);
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
    // Uninstalls just this Layer.
    // functions that are layered by other Layers will not be reset.
    var layer = this;
    this.layeredObjects().forEach(
      function(eachLayeredObj) {
        // var layerIdx = typeof eachLayeredObj.activeLayers === 'function'
        //     ? eachLayeredObj.activeLayers().indexOf(layer) : -1;
        
        // #Special Lively Webwerkstatt code.... General Case? #Jens
        // #TODO if we have of gloabal list of all layers... we can look there
        
        // Properties.own(layer._layeredFunctionsList[eachLayeredObj]).each(
        //   function(eachLayeredFunc) {
        //     var newerLayer = eachLayeredObj.activeLayers().find(
        //       function(eachOtherLayer) {
        //         var eachOtherLayerIdx
        //             = eachLayeredObj.activeLayers().indexOf(eachOtherLayer);
        //         var isNewer = (eachOtherLayerIdx !== -1)
        //             && (eachOtherLayerIdx < layerIdx);
        //         return isNewer &&
        //             eachOtherLayer._layeredFunctionsList[eachLayeredObj][eachLayeredFunc];
        //       });
        //       if (!newerLayer) {
        //         makeFunctionLayerUnaware(eachLayeredObj, eachLayeredFunc);
        //       }
        //   });
      });
      this.remove();
  }
  
  // Layer installation
  layerClass (classObject, methods) {
    layerClass(this, classObj, methods);
    return this;
  }
  layerObject (obj, methods) {
    layerObject(this, classObj, methods);
    return this;
  }
  refineClass (classObj, methods) {
    layerClass(this, classObj, methods);
    return this;
  }
  refineObject (obj, methods) {
    layerObject(this, obj, methods);
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
    enableLayer(this);
    return this;
  }
  beNotGlobal () {
    disableLayer(this);
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
  isLayer() {
    return true;
  }
  isGlobal () {
    return GlobalLayers.indexOf(this) !== -1;
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
    return create(literal.name, false);
  }
}

var globalContextForLayers = {};

export { globalContextForLayers as Global };

function basicCreate(layerName, context) {
  if (typeof layerName === 'undefined')
    layerName = Symbol('COP Layer');
  if (typeof context === 'undefined')
    context = globalContextForLayers;
  if (typeof context[layerName] !== 'undefined') {
    let existing = context[layerName];
    if (!existing.isLayer /* undefined or falsy */ || !existing.isLayer()) {
      throw new Error('Will not overwrite existing property ' + layerName);
    }
    return existing;
  } else {
    return context[layerName] = new Layer(layerName, context);
  }
};

export function layer(rootContext, layerName) {
  if (typeof layerName === 'undefined') {
    // support layer('LayerName') syntax without context object
    layerName = rootContext;
    rootContext = undefined;
  }
  if (typeof rootContext === 'undefined') {
    return basicCreate(layerName);
  }
  var parts = layerName.split(/\./);
  var context = rootContext;
  for (let i = 0; i < parts.length - 1; ++i) {
    context = context[parts[i]];
  }
  return basicCreate(parts[parts.length - 1], context);
};

// Layering objects may be a garbage collection problem, because the layers keep strong
// reference to the objects
export function layerObject(layer, object, defs) {
  // log("cop layerObject");
  
  // Bookkeeping:
  // typeof object.getName === 'function' && (layer._layeredFunctionsList[object] = {});
  Object.getOwnPropertyNames(defs).forEach(
    function (function_name) {
      // log(" layer property: " + function_name)
      layerProperty(layer, object, function_name, defs);
    });
};

// layer around only the class methods
export function layerClass(layer, classObject, defs) {
  if (!classObject || !classObject.prototype) {
    throw new Error("ContextJS: can not refine class '" + classOBject + "' in " + layer);
  }
  layerObject(layer, classObject.prototype, defs);
};

// Layer Activation
export function withLayers(layers, func) {
  LayerStack.push({withLayers: layers});
  // console.log("callee: " + withLayers.callee);
  try {
    return func();
  } finally {
    LayerStack.pop();
  }
};

export function withoutLayers(layers, func) {
  LayerStack.push({withoutLayers: layers});
  try {
    return func();
  } finally {
    LayerStack.pop();
  }
};

// Gloabl Layer Activation
export function enableLayer(layer) {
  if (GlobalLayers.indexOf(layer) !== -1) {
    return;
  }
  GlobalLayers.push(layer);
  invalidateLayerComposition();
};

export function disableLayer(layer) {
  var idx = GlobalLayers.indexOf(layer);
  if (idx < 0) {
    return;
  }
  GlobalLayers.splice(idx, 1);
  invalidateLayerComposition();
};

export function proceed(/* arguments */) {
  // COP Proceed Function
  var composition = proceedStack[proceedStack.length - 1];
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
      if (!Config.ignoreDeprecatedProceed
          && partialMethod.toString().match(/^[\t ]*function ?\(\$?proceed/)) {
        var args = $A(arguments);
        args.unshift(proceed);
        var msg = "proceed in arguments list in " + composition.functionName();
        if (Config.throwErrorOnDeprecated) {
          throw new Error("DEPRECATED ERROR: " + msg);
        }
        if (Config.logDeprecated) {
          // console.log("source: " + partialMethod.toString());
          console.log("DEPRECATED WARNING: " + msg);
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
export class LayerableObjectTrait {
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
    var stack = LayerStack;
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
    this.collectWithLayersIn(GlobalLayers, result);
    return result;
  }
  setWithLayers (layers) {
    this.withLayers = layers;
  }
  addWithLayer (layer) {
    var layers = this.getWithLayers();
    if (!layers.includes(layer)) {
      this.setWithLayers(layers.concat([layer]));
    }
  }
  removeWithLayer (layer) {
    var layers = this.getWithLayers();
    if (layers.includes(layer)) {
      this.setWithLayers(layers.filter(l => l !== layer));
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
    this.setWithoutLayers(layers.filter(l => l !== layer));
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

export class LayerableObject extends LayerableObjectTrait {}

export class COPError {
  constructor (message) {
    this._msg = msg;
  }
  toString () {
    return "COP ERROR: " + this._msg;
  }
}

export class PartialLayerComposition {
  constructor (obj, prototypeObject, functionName, baseFunction, methodType) {
    this._partialMethods = [baseFunction];
    var layers = computeLayersFor(obj);
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var partialMethod = lookupLayeredFunctionForObject(
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

resetLayerStack();

// vim: sw=2
