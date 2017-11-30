import * as cop  from "src/external/ContextJS/src/contextjs.js";

cop.layer(window, "LogPromisesLayer").refineClass(Promise, {

  then(onresolve, onerror) {
    console.log("Promise.then ... ");
    var newResolve = function(...args) {
      console.log("execute promise " );
      onresolve(...args)
      // return cop.withLayers(layers, () => onresolve(...rest));
      };
    var newError = function() {
      var args = arguments;
      onerror(...args)
      // return cop.withLayers(layers, () => onerror.apply(window, args));
    }; 
    return cop.proceed(
      onresolve ? newResolve : undefined,
      onerror ? newError : undefined);
  }
})


// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()