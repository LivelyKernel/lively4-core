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

// Layer creation by name
export function layer(...args) {
  let layerName, rootContext;
  if (args.length === 2) {
    [rootContext, layerName] = args;
  } else if (args.length === 1) {
    [layerName] = args;
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
    context = cop.GlobalNamedLayers;
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
