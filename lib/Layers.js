'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.log = log;
exports.withLogLayerCode = withLogLayerCode;
exports.getLayerDefinitionForObject = getLayerDefinitionForObject;
exports.ensurePartialLayer = ensurePartialLayer;
exports.layerMethod = layerMethod;
exports.layerProperty = layerProperty;
exports.layerPropertyWithShadow = layerPropertyWithShadow;
exports.computeLayersFor = computeLayersFor;
exports.composeLayers = composeLayers;
exports.resetLayerStack = resetLayerStack;
exports.currentLayers = currentLayers;
exports.invalidateLayerComposition = invalidateLayerComposition;
exports.lookupLayeredFunctionForObject = lookupLayeredFunctionForObject;
exports.uninstallLayersInObject = uninstallLayersInObject;
exports.uninstallLayersInAllClasses = uninstallLayersInAllClasses;
exports.allLayers = allLayers;
exports.enableLayer = enableLayer;
exports.disableLayer = disableLayer;
exports.proceed = proceed;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Config = exports.Config = {};
Config.ignoreDeprecatedProceed = true;

var log_layer_code = exports.log_layer_code = false;
function log(string) {
  if (log_layer_code) console.log(string);
}

/* 
 * Private State
 */

var proceedStack = exports.proceedStack = [];
var GlobalLayers = exports.GlobalLayers = [];
// hack, to work around absence of identity dictionaries in JavaScript
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()
// because working with objects is a serialization problem in itself, perhaps we should
// restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)
var object_id_counter = 0;

/* 
 * Private Methods
 */

// for debugging ContextJS itself
function withLogLayerCode(func) {
  try {
    var old = log_layer_code;
    exports.log_layer_code = log_layer_code = true;
    func();
  } finally {
    exports.log_layer_code = log_layer_code = old;
  }
};

var LayerObjectID = Symbol("layerObjectID");

function getLayerDefinitionForObject(layer, object) {
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

var PartialLayer = function () {
  function PartialLayer(layeredObject) {
    _classCallCheck(this, PartialLayer);

    this.layeredObject = layeredObject;
    this.layeredProperties = {};
  }

  _createClass(PartialLayer, [{
    key: 'setLayeredPropertyValue',
    value: function setLayeredPropertyValue(name, value) {
      this.layeredProperties[name] = value;
    }
  }, {
    key: 'defineGetter',
    value: function defineGetter(propertyName, getter) {
      return Object.defineProperty(this.layeredProperties, propertyName, { get: getter, configurable: true });
    }
  }, {
    key: 'defineSetter',
    value: function defineSetter(propertyName, setter) {
      return Object.defineProperty(this.layeredProperties, propertyName, { set: setter, configurable: true });
    }
  }, {
    key: 'getterMethod',
    value: function getterMethod(propertyName) {
      return Object.getOwnPropertyDescriptor(this.layeredProperties, propertyName).get;
    }
  }, {
    key: 'setterMethod',
    value: function setterMethod(propertyName) {
      return Object.getOwnPropertyDescriptor(this.layeredProperties, propertyName).set;
    }
  }, {
    key: 'property',
    value: function property(propertyName) {
      if (this.layeredProperties.hasOwnProperty(propertyName)) {
        return this.layeredProperties[propertyName];
      }
    }
  }, {
    key: 'reinstall',
    value: function reinstall() {
      var _this = this;

      Object.getOwnPropertyNames(this.layeredProperties).forEach(function (eachProperty) {
        var property = Object.getOwnPropertyDescriptor(_this.layeredProperties, eachProperty);
        if (typeof property.get !== 'undefined' || typeof property.set !== 'undefined') {
          makePropertyLayerAware(_this.layeredObject, eachProperty);
        } else {
          makeFunctionLayerAware(_this.layeredObject, eachProperty);
        }
      });
    }
  }]);

  return PartialLayer;
}();

function ensurePartialLayer(layer, object) {
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
function layerMethod(layer, object, property, func) {
  ensurePartialLayer(layer, object).setLayeredPropertyValue(property, func);
  func.displayName = "layered " + String(layer.name) + " " + (object.constructor ? object.constructor.type + "$" : "") + property;
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

function layerProperty(layer, object, property, defs) {
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

function layerPropertyWithShadow(layer, object, property) {
  // shadowing does not work with current implementation
  // see the shadow tests in LayersTest
  var defs = {};
  var baseValue = object[property];
  var layeredPropName = "_layered_" + layer.name + "_" + property;
  Object.defineProperty(defs, property, {
    get: function layeredGetter() {
      return this[layeredPropName] === undefined ? proceed() : this[layeredPropName];
    },
    set: function layeredSetter(v) {
      this[layeredPropName] = v;
    },
    configurable: true
  });
  layerProperty(layer, object, property, defs);
};

function computeLayersFor(obj) {
  return obj && obj.activeLayers ? obj.activeLayers(currentLayers) : currentLayers();
};

function composeLayers(stack) {
  var result = GlobalLayers.slice(0);
  for (var i = 0; i < stack.length; i++) {
    var current = stack[i];
    if (current.withLayers) {
      result = result.filter(function (l) {
        return !(current.withLayers.indexOf(l) !== -1);
      }).concat(current.withLayers);
    } else if (current.withoutLayers) {
      result = result.filter(function (l) {
        return !(current.withoutLayers.indexOf(l) !== -1);
      });
    }
  }
  return result;
};

var LayerStack = exports.LayerStack = void 0;

function resetLayerStack() {
  exports.LayerStack = LayerStack = [{
    isStatic: true,
    toString: function toString() {
      return "BaseLayer";
    },
    composition: null
  }];
  invalidateLayerComposition();
};

function currentLayers() {
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
function invalidateLayerComposition() {
  LayerStack.forEach(function (ea) {
    ea.composition = null;
  });
};

function lookupLayeredFunctionForObject(self, layer, function_name, methodType, n) {
  if (!layer) {
    return undefined;
  }
  // we have to look for layer defintions in self, self.prototype,
  // ... there may be layered methods in a subclass of "obj"
  var partialFunction = void 0;
  var partialLayerForObject = getLayerDefinitionForObject(layer, self);
  if (partialLayerForObject) {
    // log("  found layer definitions for object");
    if (methodType == 'getter') {
      partialFunction = partialLayerForObject.getterMethod(function_name);
    } else if (methodType == 'setter') {
      partialFunction = partialLayerForObject.setterMethod(function_name);
    } else {
      partialFunction = partialLayerForObject.property(function_name);
    }
  }
  if (!partialFunction) {
    // try the superclass hierachy
    // log("look for superclass of: " + self.constructor)
    var superclass = Object.getPrototypeOf(self);
    if (superclass) {
      // log("layered function is not found
      //in this partial method, lookup for my prototype?")
      return lookupLayeredFunctionForObject(superclass, layer, function_name, methodType);
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

function makeSlotLayerAwareWithNormalLookup(obj, slotName, baseValue, type, isHidden) {
  var wrapped_function = function wrapped_function() {
    var composition = new PartialLayerComposition(this, obj, slotName, baseValue, type);
    proceedStack.push(composition);
    try {
      return proceed.apply(this, arguments);
    } finally {
      proceedStack.pop();
    };
  };
  wrapped_function.isLayerAware = true;
  // this is more declarative outside of COP context
  wrapped_function.isContextJSWrapper = true;
  if (isHidden) {
    wrapped_function.toString = function () {
      return this.getOriginal().toString();
    };
  }
  // For wrapped_function.getOriginal()
  wrapped_function.originalFunction = baseValue;
  if (type == "getter") {
    Object.defineProperty(obj, slotName, { get: wrapped_function });
  } else if (type == "setter") {
    Object.defineProperty(obj, slotName, { set: wrapped_function });
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
    base_function = function base_function() {
      return null;
    };
  };
  pvtMakeFunctionOrPropertyLayerAware(base_obj, function_name, base_function, undefined, isHidden);
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
    getter = function getter() {
      return this[propName];
    };
    Object.defineProperty(baseObj, property, { get: getter, configurable: true });
  };
  var setter = baseObjProperty && baseObjProperty.set;
  if (!setter) {
    setter = function setter(value) {
      return this[propName] = value;
    };
    Object.defineProperty(baseObj, property, { set: setter, configurable: true });
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
  while (typeof currentFunction.originalFunction == 'function' && !currentFunction.isLayerAware) {
    var prevFunction = currentFunction;
    currentFunction = currentFunction.originalFunction;
  }
  if (!currentFunction.isLayerAware) {
    return; // nothing to do here
  }
  var originalFunction = currentFunction.originalFunction;
  if (!(originalFunction instanceof Function)) {
    throw new Error("makeFunctionLayerUnaware Error: no orignal function");
  }
  if (prevFunction instanceof Function) {
    prevFunction.originalFunction = originalFunction;
  } else {
    base_obj[function_name] = originalFunction;
  }
};

function uninstallLayersInObject(object) {
  Object.getOwnPropertyNames(object).forEach(function (ea) {
    if (typeof object[ea] === 'function') makeFunctionLayerUnaware(object, ea);
  });
};

function uninstallLayersInAllClasses() {
  Global.classes(true).forEach(function (ea) {
    uninstallLayersInObject(ea.prototype);
  });
};

function allLayers() {
  var optObject = arguments.length <= 0 || arguments[0] === undefined ? Global : arguments[0];

  // does not really return all layers... layers in namepsaces are not found!
  // therefore you can query all layers in an optObject
  return Object.values(optObject).select(function (ea) {
    return ea instanceof Layer;
  });
};

/* 
 * PUBLIC COP Layer Definition
 */

var globalContextForNamedLayers = {};

exports.GlobalNamedLayers = globalContextForNamedLayers;

// Gloabl Layer Activation

function enableLayer(layer) {
  if (GlobalLayers.indexOf(layer) !== -1) {
    return;
  }
  GlobalLayers.push(layer);
  invalidateLayerComposition();
};

function disableLayer(layer) {
  var idx = GlobalLayers.indexOf(layer);
  if (idx < 0) {
    return;
  }
  GlobalLayers.splice(idx, 1);
  invalidateLayerComposition();
};

function proceed() /* arguments */{
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
      if (!Config.ignoreDeprecatedProceed && partialMethod.toString().match(/^[\t ]*function ?\(\$?proceed/)) {
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
 * Layer Class
 */

var Layer = exports.Layer = function () {
  function Layer(name, context) {
    _classCallCheck(this, Layer);

    this._name = name;
    this._context = context;
    // this._layeredFunctionsList = {};
  }

  // Accessing


  _createClass(Layer, [{
    key: 'fullName',
    value: function fullName() {
      return '' + this._context + '.' + this._name;
    }
  }, {
    key: 'layeredObjects',
    value: function layeredObjects() {
      var _this2 = this;

      return Object.getOwnPropertyNames(this).map(function (ea) {
        return _this2[ea] && _this2[ea]._layered_object;
      }).filter(function (ea) {
        return ea;
      }); // filters falsy things
    }
    // TODO: doesn't differentiate between functions and classes - necessary?

  }, {
    key: 'layeredClasses',
    value: function layeredClasses() {
      return this.layeredObjects().map(function (ea) {
        return ea.constructor;
      });
    }

    // Removing

  }, {
    key: 'remove',
    value: function remove() {
      // Deletes the LayerClass, but keeps the layered Functions.
      if (this.isGlobal()) {
        this.beNotGlobal();
      }
      var context = this._context;
      if (typeof context !== 'undefined') delete context[this.name];
    }
  }, {
    key: 'uninstall',
    value: function uninstall() {
      // Uninstalls just this Layer.
      // functions that are layered by other Layers will not be reset.
      var layer = this;
      this.layeredObjects().forEach(function (eachLayeredObj) {
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

  }, {
    key: 'refineClass',
    value: function refineClass(classObject, methods) {
      if (!classObject || !classObject.prototype) {
        throw new Error("ContextJS: can not refine class '" + classObject + "' in " + layer);
      }
      this.refineObject(classObject.prototype, methods);
      return this;
    }

    // Layering objects may be a garbage collection problem, because the layers keep strong
    // reference to the objects

  }, {
    key: 'refineObject',
    value: function refineObject(object, methods) {
      var _this3 = this;

      // log("cop refineObject");

      // Bookkeeping:
      // typeof object.getName === 'function' && (layer._layeredFunctionsList[object] = {});
      Object.getOwnPropertyNames(methods).forEach(function (function_name) {
        // log(" layer property: " + function_name)
        layerProperty(_this3, object, function_name, methods);
      });
      return this;
    }
  }, {
    key: 'unrefineObject',
    value: function unrefineObject(obj) {
      var id = obj[LayerObjectID];
      if (id !== undefined) {
        delete this[id];
      }
    }
  }, {
    key: 'unrefineClass',
    value: function unrefineClass(classObj) {
      this.unrefineObject(classObj.prototype);
    }
  }, {
    key: 'reinstallInClass',
    value: function reinstallInClass(constructor) {
      this.reinstallInObject(constructor.prototype);
    }
  }, {
    key: 'reinstallInObject',
    value: function reinstallInObject(object) {
      var partialLayer = ensurePartialLayer(this, object);
      partialLayer.reinstall();
    }

    // Layer activation

  }, {
    key: 'beGlobal',
    value: function beGlobal() {
      enableLayer(this);
      return this;
    }
  }, {
    key: 'beNotGlobal',
    value: function beNotGlobal() {
      disableLayer(this);
      return this;
    }
  }, {
    key: 'hide',
    value: function hide() {
      // Hidden Layers do not appear when evaluating the sourcecode of a function
      // TODO: this function has to be called BEFORE the layer refines any class,
      // due to problems in unrefining classes.
      this.isHidden = true;
      return this;
    }

    // Testing

  }, {
    key: 'isLayer',
    value: function isLayer() {
      return true;
    }
  }, {
    key: 'isGlobal',
    value: function isGlobal() {
      return GlobalLayers.indexOf(this) !== -1;
    }

    // Debugging

  }, {
    key: 'toString',
    value: function toString() {
      return String(this.name); // could be a symbol
    }

    // Deprecated serialization

  }, {
    key: 'toLiteral',
    value: function toLiteral() {
      if (!this.name) {
        console.warn("Layer: Can not serialize without a name!");
      }
      return { name: this.name };
    }

    // Deserialization

  }, {
    key: 'fromLiteral',
    value: function fromLiteral(literal) {
      // console.log("Deserializing Layer activation from: " + literal.name);
      return create(literal.name, false);
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }
  }]);

  return Layer;
}();

/*
 * Example implementation of a layerable object
 */


var LayerableObjectTrait = exports.LayerableObjectTrait = function () {
  function LayerableObjectTrait() {
    _classCallCheck(this, LayerableObjectTrait);
  }

  _createClass(LayerableObjectTrait, [{
    key: 'activeLayers',
    value: function activeLayers() {
      var result = { withLayers: [], withoutLayers: [] };
      this.dynamicLayers(result);
      this.structuralLayers(result);
      this.globalLayers(result);
      return result.withLayers;
    }
  }, {
    key: 'collectWithLayersIn',
    value: function collectWithLayersIn(layers, result) {
      for (var i = 0; i < layers.length; i++) {
        var ea = layers[i];
        if (result.withLayers.indexOf(ea) === -1 && result.withoutLayers.indexOf(ea) === -1) {
          result.withLayers.unshift(ea);
        }
      }
    }
  }, {
    key: 'collectWithoutLayersIn',
    value: function collectWithoutLayersIn(layers, result) {
      for (var i = 0; i < layers.length; i++) {
        var ea = layers[i];
        if (result.withoutLayers.indexOf(ea) === -1) {
          result.withoutLayers.push(ea);
        }
      }
    }
  }, {
    key: 'dynamicLayers',
    value: function dynamicLayers(result) {
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
  }, {
    key: 'structuralLayers',
    value: function structuralLayers(result) {
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
  }, {
    key: 'globalLayers',
    value: function globalLayers(result) {
      this.collectWithLayersIn(GlobalLayers, result);
      return result;
    }
  }, {
    key: 'setWithLayers',
    value: function setWithLayers(layers) {
      this.withLayers = layers;
    }
  }, {
    key: 'addWithLayer',
    value: function addWithLayer(layer) {
      var layers = this.getWithLayers();
      if (!(layers.indexOf(layer) !== -1)) {
        this.setWithLayers(layers.concat([layer]));
      }
    }
  }, {
    key: 'removeWithLayer',
    value: function removeWithLayer(layer) {
      var layers = this.getWithLayers();
      if (layers.indexOf(layer) !== -1) {
        this.setWithLayers(layers.filter(function (l) {
          return l !== layer;
        }));
      }
    }
  }, {
    key: 'addWithoutLayer',
    value: function addWithoutLayer(layer) {
      var layers = this.getWithoutLayers();
      if (!layers.include(layer)) {
        this.setWithoutLayers(layers.concat([layer]));
      }
    }
  }, {
    key: 'removeWithoutLayer',
    value: function removeWithoutLayer(layer) {
      var layers = this.getWithoutLayers();
      this.setWithoutLayers(layers.filter(function (l) {
        return l !== layer;
      }));
    }
  }, {
    key: 'setWithoutLayers',
    value: function setWithoutLayers(layers) {
      this.withoutLayers = layers;
    }
  }, {
    key: 'getWithLayers',
    value: function getWithLayers(layers) {
      return this.withLayers || [];
    }
  }, {
    key: 'getWithoutLayer',
    value: function getWithoutLayer(layers) {
      return this.withoutLayers || [];
    }
  }]);

  return LayerableObjectTrait;
}();

var LayerableObject = exports.LayerableObject = function (_LayerableObjectTrait) {
  _inherits(LayerableObject, _LayerableObjectTrait);

  function LayerableObject() {
    _classCallCheck(this, LayerableObject);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(LayerableObject).apply(this, arguments));
  }

  return LayerableObject;
}(LayerableObjectTrait);

var COPError = exports.COPError = function () {
  function COPError(message) {
    _classCallCheck(this, COPError);

    this._msg = msg;
  }

  _createClass(COPError, [{
    key: 'toString',
    value: function toString() {
      return "COP ERROR: " + this._msg;
    }
  }]);

  return COPError;
}();

var PartialLayerComposition = exports.PartialLayerComposition = function () {
  function PartialLayerComposition(obj, prototypeObject, functionName, baseFunction, methodType) {
    _classCallCheck(this, PartialLayerComposition);

    this._partialMethods = [baseFunction];
    var layers = computeLayersFor(obj);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var partialMethod = lookupLayeredFunctionForObject(obj, layer, functionName, methodType);
      if (partialMethod) {
        this._partialMethods.push(partialMethod);
      }
    }
    this._object = obj;
    this._prototypeObject = prototypeObject;
    this._functionName = functionName;
  }

  _createClass(PartialLayerComposition, [{
    key: 'object',
    get: function get() {
      return this._object;
    }
  }, {
    key: 'partialMethods',
    get: function get() {
      return this._partialMethods;
    }
  }, {
    key: 'functionName',
    get: function get() {
      return this._functionName;
    }
  }, {
    key: 'prototypeObject',
    get: function get() {
      return this._prototypeObject;
    }
  }]);

  return PartialLayerComposition;
}();

resetLayerStack();

// vim: sw=2