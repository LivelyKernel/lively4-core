import * as cop  from "src/external/ContextJS/src/contextjs.js";

if (!window.OriginalPromise) {
  window.OriginalPromise = Promise;  
}
window.Promise = function Promise(...args) {
  if (this.constructorHook) {
    args = this.constructorHook(args)
  } 
  return new OriginalPromise(...args)
};
Promise.prototype = OriginalPromise.prototype;
Promise.prototype.constructorHook = function(args) {  return args }
Promise.__proto__ = OriginalPromise


export default class LogPromises {
  static resetLogs() {
    this.resolveCounter = 0
    this.dependendPromises = new Map()
    this.dependendPromisesLogs = new Map()
    this.currrentPromise = undefined
    this.promiseRoots = new Set()    
  }
  
  
  static addDependend(oldPromise, newPromise) {
    if (!LogPromises.currrentPromise)  {
      LogPromises.promiseRoots.add(newPromise)
      return 
    }
    var dep = this.dependendPromises.get(oldPromise)
    if (!dep) {
      dep = []
      this.dependendPromises.set(oldPromise, dep)
    }
    dep.push(newPromise)  
  }

  static promisedLog(promise, args) {
    var logs = this.dependendPromisesLogs.get(promise)
    if (!logs) {
      logs = []
      this.dependendPromisesLogs.set(promise, logs)
    }
    logs.push(args)  
  }
  
  static dependenciesTree(p) {
    return {
      name: "Promise " + p.__promise_debug_id__,
      logs: this.dependendPromisesLogs.get(p) ,
      children: (this.dependendPromises.get(p) || []).map(ea => this.dependenciesTree(ea)) 
    }  
  }

  static printPromisedLogs(p) {
    var logs = this.dependendPromisesLogs.get(p)
    if (logs) {
      cop.withoutLayers([LogPromisesLayer], () => {
        logs.forEach(ea => {
          console.log(...ea)          
        })
      });
      (this.dependendPromises.get(p) || []).forEach(ea => this.printPromisedLogs(ea)) 
    }
  } 
  
  static promisedAllDependendPromises(p, all=new Set()) {
    all.add(p)
    var deps = this.dependendPromises.get(p)
    if (deps) {
      for(let ea of deps) {
        if (!all.has(ea)) {
          this.promisedAllDependendPromises(ea, all)
        }
      }    
    }
    return all
  }
}

LogPromises.resetLogs()

cop.layer(window, "LogPromisesLayer").refineClass(Promise, {
  constructorHook(args) {
    var func = args[0]
    if (func) {
      args[0] = (...rest) => {
        LogPromises.addDependend(LogPromises.currrentPromise, this)    
        var oldPromise = this; 
        LogPromises.currrentPromise = oldPromise
        var result
        cop.withLayers([LogPromisesLayer], () => {
          result =  func(...rest)
        })
        LogPromises.currrentPromise = undefined
        return result
      }  
    }
    return cop.proceed(args)
  },
  
  then(onresolve, onerror) {
    // outside then
    this.__promise_debug_id__ =  LogPromises.resolveCounter++    
    
    LogPromises.addDependend(LogPromises.currrentPromise, this)    
    var oldPromise = this; 
    var newPromise = cop.proceed(
      onresolve ? (...args) => {
        // inside then
        cop.withoutLayers([LogPromisesLayer], () => {

          /// console.log("execute promise " + resolveCounter );
        })
        LogPromises.currrentPromise = oldPromise
        var result
        cop.withLayers([LogPromisesLayer], () => {
          result = onresolve(...args)        
        })
        LogPromises.currrentPromise = undefined
        return result
      } : undefined,
      onerror);
    LogPromises.addDependend(oldPromise, newPromise)
    
    return newPromise
  }
}).refineObject(console, {
  log(...args) {
    return cop.withoutLayers([LogPromisesLayer], () => {
      LogPromises.promisedLog(LogPromises.currrentPromise, args)
      return cop.proceed("PROMISED", ...args)
    })
  }
})

// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()