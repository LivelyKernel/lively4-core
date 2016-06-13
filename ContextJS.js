import * as cop from "./Layers.js";

// Layerfunction proceeding
export function proceed() {
  return cop.proceed();
}

// Layer Activation
export function withLayers(layers, func) {
  cop.LayerStack.push({withLayers: layers});
  // console.log("callee: " + withLayers.callee);
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

export function withoutLayers(layers, func) {
  cop.LayerStack.push({withoutLayers: layers});
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

// Layer creation
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
  isLayer() {
    return true;
  }
  isGlobal () {
    return cop.GlobalLayers.indexOf(this) !== -1;
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

// Private helpers
function basicCreate(layerName, context) {
  if (typeof layerName === 'undefined')
    layerName = Symbol('COP Layer');
  if (typeof context === 'undefined')
    context = cop.Global;
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