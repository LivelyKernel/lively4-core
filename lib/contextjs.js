'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Layer = exports.proceed = undefined;

var _Layers = require("./Layers.js");

Object.defineProperty(exports, "proceed", {
  enumerable: true,
  get: function get() {
    return _Layers.proceed;
  }
});
Object.defineProperty(exports, "Layer", {
  enumerable: true,
  get: function get() {
    return _Layers.Layer;
  }
});
exports.withLayers = withLayers;
exports.withoutLayers = withoutLayers;
exports.layer = layer;

var cop = _interopRequireWildcard(_Layers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Layer Activation
function withLayers(layers, func) {
  cop.LayerStack.push({ withLayers: layers });
  // console.log("callee: " + withLayers.callee);
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

function withoutLayers(layers, func) {
  cop.LayerStack.push({ withoutLayers: layers });
  try {
    return func();
  } finally {
    cop.LayerStack.pop();
  }
};

// Layer creation by name
function layer() {
  var layerName = void 0,
      rootContext = void 0;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 2) {
    rootContext = args[0];
    layerName = args[1];
  } else if (args.length === 1) {
    layerName = args[0];
  }
  if (typeof rootContext === 'undefined') {
    return basicCreate(layerName);
  }
  var parts = layerName.split(/\./);
  var context = rootContext;
  for (var i = 0; i < parts.length - 1; ++i) {
    context = context[parts[i]];
  }
  return basicCreate(parts[parts.length - 1], context);
};

// Private helpers
function basicCreate(layerName, context) {
  if (typeof layerName === 'undefined') layerName = Symbol('COP Layer');
  if (typeof context === 'undefined') context = cop.GlobalNamedLayers;
  if (typeof context[layerName] !== 'undefined') {
    var existing = context[layerName];
    if (!existing.isLayer /* undefined or falsy */ || !existing.isLayer()) {
      throw new Error('Will not overwrite existing property ' + layerName);
    }
    return existing;
  } else {
    return context[layerName] = new cop.Layer(layerName, context);
  }
};