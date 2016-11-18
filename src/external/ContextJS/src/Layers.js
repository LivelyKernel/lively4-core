/*
 * Copyright (c) 2008-2016 Hasso Plattner Institute
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

const LayerObjectID = Symbol("layerObjectID");

export function getLayerDefinitionForObject(layer, object) {
  // log("cop getLayerDefinitionForObject(" + layer + ", " + object + ")");
  if (!layer || !object) {
    return;
  }
  var result = layer[object[LayerObjectID]];
  return result ? result : getLayerDefinitionForObject(layer, object.prototype);
};

/**
 * Stores partial definitions for a single layered object and layer.
 */
class PartialLayer {
  constructor(layeredObject) {
    this.layeredObject = layeredObject;
    this.layeredProperties = {};
  }

  setLayeredPropertyValue(name, value) {
    this.layeredProperties[name] = value;
  }

  defineGetter(propertyName, getter) {
    return Object.defineProperty(this.layeredProperties, propertyName,
                          {get: getter, configurable: true});
  }

  defineSetter(propertyName, setter) {
    return Object.defineProperty(this.layeredProperties, propertyName,
                          {set: setter, configurable: true});
  }

  getterMethod(propertyName) {
    var desc = Object.getOwnPropertyDescriptor(this.layeredProperties, propertyName);
    if (desc)
      return desc.get;
  }

  setterMethod(propertyName) {
    var desc = Object.getOwnPropertyDescriptor(this.layeredProperties, propertyName);
    if (desc)
      return desc.set;
  }

  property(propertyName) {
    if (this.layeredProperties.hasOwnProperty(propertyName)) {
      return this.layeredProperties[propertyName];
    }
  }

  reinstall() {
    Object.getOwnPropertyNames(this.layeredProperties).forEach(eachProperty => {
      const property = Object.getOwnPropertyDescriptor(this.layeredProperties, eachProperty);
      if (typeof property.get !== 'undefined' || typeof property.set !== 'undefined') {
        makePropertyLayerAware(this.layeredObject, eachProperty);
      } else {
        makeFunctionLayerAware(this.layeredObject, eachProperty);
      }
    });
  }
}

export function ensurePartialLayer(layer, object) {
  if (!layer) {
    throw new Error("in ensurePartialLayer: layer is nil");
  }
  if (!object.hasOwnProperty(LayerObjectID)) {
    Object.defineProperty(object, LayerObjectID, {
      value: object_id_counter++,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  if (!layer[object[LayerObjectID]]) {
    layer[object[LayerObjectID]] = new PartialLayer(object);
  }
  return layer[object[LayerObjectID]];
};

// TODO(mariannet) : Find out if ES6 constructor also has type
export function layerMethod(layer, object, property, func) {
  ensurePartialLayer(layer, object).setLayeredPropertyValue(property, func);
  func.displayName = "layered " + String(layer.name) + " "
                   + (object.constructor ? (object.constructor.type + "$") : "")
                   + property;
  makeFunctionLayerAware(object, property, layer.isHidden);
  
  // Bookkeeping for layer uninstall
  // typeof object.getName === 'function'
  //    && (layer._layeredFunctionsList[object][property] = true);
};

function layerGetterMethod(layer, object, property, getter) {
  ensurePartialLayer(layer, object).defineGetter(property, getter);
};

function layerSetterMethod(layer, object, property, setter) {
  ensurePartialLayer(layer, object).defineSetter(property, setter);
};

export function layerProperty(layer, object, property, defs) {
  var defProperty = Object.getOwnPropertyDescriptor(defs, property);
  var getter = defProperty && defProperty.get;
  if (getter) {
    layerGetterMethod(layer, object, property, getter);
  }
  var setter = defProperty && defProperty.set;
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
  // TODO: the tests are green, what is the above comment about?
  var defs = {};
  var baseValue = object[property];
  const layeredPropSymbol = Symbol(property + ' ' +
      (typeof layer.name === 'string'
       ? 'for Layer ' + layer.name
       : 'for anonymous Layer'));
  Object.defineProperty(defs, property, {
    get: function layeredGetter() {
      return this[layeredPropSymbol] === undefined ?
          proceed() : this[layeredPropSymbol];
    },
    set: function layeredSetter(v) {
      this[layeredPropSymbol] = v;
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
  let partialFunction;
  const partialLayerForObject = getLayerDefinitionForObject(layer, self);
  if (partialLayerForObject) {
    // log("  found layer definitions for object");
    if (methodType == 'getter') {
      partialFunction = partialLayerForObject.getterMethod(function_name);
    } else if (methodType == 'setter'){
      partialFunction = partialLayerForObject.setterMethod(function_name);
    } else {
      partialFunction = partialLayerForObject.property(function_name);
    }
  }
  if (!partialFunction && !self.hasOwnProperty(function_name)) {
    // this method was probably added by a layer
    // so try to look it up in the superclass hierachy
    const superclass = Object.getPrototypeOf(self);
    if (superclass) {
      return lookupLayeredFunctionForObject(
          superclass, layer, function_name, methodType);
    }
  }
  return partialFunction;
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
  let wrapped_function = function() {
    'use strict';
    var composition =
        new PartialLayerComposition(this, slotName, baseValue, type);
    proceedStack.push(composition);
    return invokeLayeredMethodThenPopProceedStack.apply(this, arguments);
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
    Object.defineProperty(obj, slotName, {
      get() { return wrapped_function; },
      set(newFunction) {
        makeSlotLayerAwareWithNormalLookup(this, slotName, newFunction);
      }
    });
  }
};

function invokeLayeredMethodThenPopProceedStack() {
  'use strict';
  try {
    return proceed.apply(void 0 /* undefined */, arguments);
  } finally {
    proceedStack.pop()
  };
}

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
    throw new Error("can't layer a non existent object");
  }  
  // ensure base getter and setter
  var baseObjProperty = Object.getOwnPropertyDescriptor(baseObj, property);
  var propName = "__layered_" + property + "__";
  var getter = baseObjProperty && baseObjProperty.get;
  if (!getter) {
    // does not work when dealing with classes and instances...
    baseObj[propName] = baseObj[property]; // take over old value
    getter = function() { return this[propName] };
    Object.defineProperty(baseObj, property, {get: getter, configurable: true});
  };
  var setter = baseObjProperty && baseObjProperty.set;
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
    // need to use defineProperty because the setter keeps the function wrapped
    Object.defineProperty(base_obj, function_name, {
      value: originalFunction,
      configurable: true
    });
  }
};

export function uninstallLayersInObject(object) {
  Object.getOwnPropertyNames(object).forEach(ea => {
    if (typeof object[ea] === 'function')
      makeFunctionLayerUnaware(object, ea);
  });
};

/* 
 * PUBLIC COP Layer Definition
 */

var globalContextForNamedLayers = {};

export { globalContextForNamedLayers as GlobalNamedLayers };

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

export function proceed(...args) {
  // COP Proceed Function
  var composition = proceedStack[proceedStack.length - 1];
  if (!composition) {
    console.log('ContextJS: no composition to proceed (stack is empty) ');
    return;
  }
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
    composition.partialMethodIndex = index - 1;
    return invokeNextPartialMethod(partialMethod, index, composition, args);
  }
};

function invokeNextPartialMethod(partialMethod, index, composition, args) {
  try {
    return partialMethod.apply(composition.object, args);
  } finally {
    composition.partialMethodIndex = index;
  }
}

/* 
 * Layer Class
 */
export class Layer {
  constructor (name, context) {
    this._name = name;
    if (typeof name === 'undefined') {
      this._name = Symbol('COP Layer');
    }
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
  refineClass (classObject, methods) {
    if (!classObject || !classObject.prototype) {
      throw new Error("ContextJS: can not refine class '" + classObject + "' in " + layer);
    }
    this.refineObject(classObject.prototype, methods);
    return this;
  }

  // Layering objects may be a garbage collection problem, because the layers keep strong
  // reference to the objects
  refineObject (object, methods) {
    // log("cop refineObject");

    // Bookkeeping:
    // typeof object.getName === 'function' && (layer._layeredFunctionsList[object] = {});
    Object.getOwnPropertyNames(methods).forEach(function_name => {
      // log(" layer property: " + function_name)
      layerProperty(this, object, function_name, methods);
    });
    return this;
  }
  unrefineObject (obj) {
    var id = obj[LayerObjectID];
    if (id !== undefined) {
      delete this[id];
    }
  }
  unrefineClass (classObj) {
    this.unrefineObject(classObj.prototype);
  }

  reinstallInClass (constructor) {
    this.reinstallInObject(constructor.prototype);
  }

  reinstallInObject (object) {
    const partialLayer = ensurePartialLayer(this, object);
    partialLayer.reinstall();
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
    return String(this.name); // could be a symbol
  }
}

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
  constructor (obj, functionName, baseFunction, methodType) {
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
  }

  get object() {
    return this._object;
  }
  
  get partialMethods () {
    return this._partialMethods;
  }
}

resetLayerStack();

// vim: sw=2
