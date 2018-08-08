// import * as cop  from 'src/client/ContextJS/src/contextjs.js'
// import {LayerStack} from 'src/client/ContextJS/src/Layers.js'

// export function replayStack(layerStack, index, callback) {
//   if (index >= layerStack.length) { 
//     return callback()
//   }
//   var comp = layerStack[index]
//   var cont = function() {
//     return replayStack(layerStack, index + 1, callback)
//   }
//   if (comp.withLayers)
//     return cop.withLayers(comp.withLayers, cont)
//   if (comp.withoutLayers)
//     return cop.withoutLayers(comp.withoutLayers, cont)
//   throw new Error("unknown layer composition")
// }

// cop.layer(self, "DelayedLayerActivationLayer").refineObject(self, {
//   setTimeoutMethod(callback, delay) {
//     var layerStack = Array.from(LayerStack)
//     return cop.proceed(() => {
//       return replayStack(layerStack, 1, callback);
//     }, delay);
//   }
// })

// self.DelayedLayerActivationLayer.beGlobal();

// if (!self.OriginalPromise) {
//   self.OriginalPromise = Promise;
// }
// self.Promise = function Promise(...args) {
//   if (this.constructorHook) {
//     var p = (...rest) => {
//       return new self.OriginalPromise(...rest)
//     }
//     return this.constructorHook(p, args)
//   }
//   return new self.OriginalPromise(...args)
// }

// debugger
// self.Promise.prototype = self.OriginalPromise.prototype;
// self.Promise.__proto__ = self.OriginalPromise // meta-class inheritance... Promise.all should work
// self.Promise.prototype.constructorHook = function(p, args) {
//  return p(...args)
// }

// cop.layer(self, "ReplayLayerActivationsLayer").refineClass(Promise, {
//   then(onFulfilled, onRejected) {
//     var layerStack = Array.from(LayerStack)
//     return cop.proceed(
//       onFulfilled ? (...args) => {
//         return replayStack(layerStack, 1, () => onFulfilled(...args));
//       } : undefined,
//       onRejected ? (...args) => {
//         return replayStack(layerStack, 1, () => onRejected(...args));
//       } : undefined,);
//   }
// })

// self.ReplayLayerActivationsLayer.beGlobal()

export function wrapAwait(p) {
  return p
  
  // var a  = currentLayers()
  // var r = p.then(x => x)
  // r.isMySpecialAwait = Array.from(LayerStack)
  // r.isMySpecialAwait = Layers.currentLayers().filter(ea => ea.isAsyncLayer)
  
  // return r
} 
