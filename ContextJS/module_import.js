import { withLayers, withoutLayers, layer, proceed, Layer } from "./contextjs.js";

if (typeof window !== 'undefined') {
  window.withLayers = withLayers;
  window.withoutLayers = withoutLayers;
  window.layer = layer;
  window.proceed = proceed;
  window.Layer = Layer;
}
if (typeof global !== 'undefined') {
  global.withLayers = withLayers;
  global.withoutLayers = withoutLayers;
  global.layer = layer;
  global.proceed = proceed;
  global.Layer = Layer;
}