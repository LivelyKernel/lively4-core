import * as cop  from "src/client/ContextJS/src/contextjs.js";

var resolveCounter  = 0
cop.layer(window, "LogPromisesLayer").refineClass(Promise, {

  then(onresolve, onerror) {
    // console.log("Promise.then ... ");
    var s = lively.currentStack();
    var newResolve = function(...args) {
      cop.withoutLayers([LogPromisesLayer], () => {
        resolveCounter++
        console.log("stack " + s)
        // console.log("execute promise " );
      })
      return onresolve(...args)
      // return cop.withLayers(layers, () => onresolve(...rest));
      };
    var newError = function(...args) {
      return onerror(...args)
      // return cop.withLayers(layers, () => onerror.apply(window, args));
    };
    return cop.proceed(
      onresolve ? newResolve : undefined,
      onerror ? newError : undefined);
  }
})


// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()
