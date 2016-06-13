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
    return cop.basicCreate(layerName);
  }
  var parts = layerName.split(/\./);
  var context = rootContext;
  for (let i = 0; i < parts.length - 1; ++i) {
    context = context[parts[i]];
  }
  return cop.basicCreate(parts[parts.length - 1], context);
};