'use strict';

var _contextjs = require('./contextjs.js');

if (typeof window !== 'undefined') {
  window.withLayers = _contextjs.withLayers;
  window.withoutLayers = _contextjs.withoutLayers;
  window.layer = _contextjs.layer;
  window.proceed = _contextjs.proceed;
  window.Layer = _contextjs.Layer;
}
if (typeof global !== 'undefined') {
  global.withLayers = _contextjs.withLayers;
  global.withoutLayers = _contextjs.withoutLayers;
  global.layer = _contextjs.layer;
  global.proceed = _contextjs.proceed;
  global.Layer = _contextjs.Layer;
}