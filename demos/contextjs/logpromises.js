import * as cop  from "src/external/ContextJS/src/contextjs.js";

var resolveCounter = 0

window.dependendPromises = new Map()
window.dependendPromisesLogs = new Map()


window.currrentPromise = undefined
window.promiseRoots = []

function addDependend(oldPromise, newPromise) {
    if (!window.currrentPromise)  {
      window.promiseRoots.push(newPromise)
      return 
    }
    var dep = dependendPromises.get(oldPromise)
    if (!dep) {
      dep = []
      dependendPromises.set(oldPromise, dep)
    }
    dep.push(newPromise)  
}

function promisedLog(promise, args) {
    var logs = dependendPromisesLogs.get(promise)
    if (!logs) {
      logs = []
      dependendPromisesLogs.set(promise, logs)
    }
    logs.push(args)  
}

cop.layer(window, "LogPromisesLayer").refineClass(Promise, {
  then(onresolve, onerror) {
    // outside then
    this.__promise_debug_id__ =  resolveCounter++    
    
    addDependend(window.currrentPromise, this)    
    var oldPromise = this; 
    var newPromise = cop.proceed(
      onresolve ? (...args) => {
        // inside then
        cop.withoutLayers([LogPromisesLayer], () => {

          /// console.log("execute promise " + resolveCounter );
        })
        window.currrentPromise = oldPromise
        var result
        cop.withLayers([LogPromisesLayer], () => {
          result = onresolve(...args)        
        })
        window.currrentPromise = undefined
        return result
      } : undefined,
      onerror);
    addDependend(oldPromise, newPromise)
    
    return newPromise
  }
}).refineObject(console, {
  log(...args) {
    return cop.withoutLayers([LogPromisesLayer], () => {
      promisedLog(window.currrentPromise, args)
      return cop.proceed("PROMISED", ...args)
    })
  }
})

// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()