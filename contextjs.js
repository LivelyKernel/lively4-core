'use strict'; 

import * as cop from "./Layers.js";
export { proceed, Layer } from "./Layers.js";

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
    return context[layerName] = new cop.Layer(layerName, context);
  }
};