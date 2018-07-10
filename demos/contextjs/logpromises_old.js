/***
 * Better Promise Logging Support Experiment
 */

import * as cop  from "src/client/ContextJS/src/contextjs.js"
import * as Layers  from "src/client/ContextJS/src/Layers.js"

// BEGIN #TODO #ContextJS cannot layer constructors
if (!self.OriginalPromise) {
  self.OriginalPromise = Promise;
}
self.Promise = function Promise(...args) {
  
  this.is_not_a_promise = true;
  if (this.constructorHook) {
    var p = (...rest) => {
      return new OriginalPromise(...rest)
    }
    return this.constructorHook(p, args)
  }
  return new OriginalPromise(...args)
};
self.Promise.prototype = OriginalPromise.prototype;
self.Promise.prototype.constructorHook = function(p, args) {
 return p(...args)
}
self.Promise.__proto__ = OriginalPromise
// END


export function defereLogging(msg) {
  return LogPromises.defereLogging(this)
}

export default class LogPromises {
  static resetLogs() {
    this.resolveCounter = 0
    this.dependendPromises = new Map()
    this.dependendPromisesReplace = new Map()
    this.dependendPromisesLogs = new Map()
    this.currrentPromise = undefined
  }

  static allDependends() {
    var allDependends = new Set();
    Array.from(this.dependendPromises.values()).forEach(deps => {
      deps.forEach(ea => allDependends.add(ea))
    })
    return allDependends
  }

  static get promiseRoots() {
    return LogPromises.dependendPromises.get(undefined)
  }

  static async defereLogging(promise, msg) {
    await promise;
    var rootPromise = LogPromises.findRoot(promise)
    // await this.promisedAllDependendPromises(rootPromise); // wait on sibling promises too
    console.group(msg || ("REPLAY " + rootPromise.__promise_debug_id__))
    LogPromises.printPromisedLogs(rootPromise)
    console.groupEnd();
    return promise
  }

  static currentPromiseLayer(currentPromise) {
    // #Example #COP #DynamicVariables
    // #Idia as the async nature of "Promises" renders global state logging useless and lexical scoping is limited, we have to actually use dynamic scoping again! We have not other option! The alternative is to implement a domain specific dynamic scope base on the domain specific object structure at hand
    return cop.layer("CurrentPromiseLayer").refineObject(LogPromises, {
      get currrentPromise() {
        return  LogPromises.dependendPromisesReplace.get(currentPromise) || currentPromise
      }
    })
  }

  static print(promise) {
     return (promise && (promise.__promise_debug_id__ || promise)) || "undefined"
  }

  static addDependend(oldPromise, newPromise) {
    oldPromise = this.dependendPromisesReplace.get(oldPromise) || oldPromise;
    newPromise = this.dependendPromisesReplace.get(newPromise) || newPromise;
    // console.log("addDependend " + LogPromises.print(oldPromise) + " <- "  + LogPromises.print(newPromise))
    var dep = this.dependendPromises.get(oldPromise)
    if (!dep) {
      dep = []
      this.dependendPromises.set(oldPromise, dep)
    }
    dep.push(newPromise)
  }

  static replacePlaceholder(placeholder, actualPromise) {
    // console.log("replace " + placeholder.__promise_debug_id__ + " with " + actualPromise.__promise_debug_id__)
    // now, we are getting ugly #TODO find a better design
    this.dependendPromisesReplace.set(placeholder, actualPromise)
    var dep = this.dependendPromises.get(placeholder)
    if (dep) {
      this.dependendPromises.delete(placeholder)
      this.dependendPromises.set(actualPromise, dep)
    }
    for(let [key, deps] of this.dependendPromises) {
      for (let i in deps) {
        if (deps[i] === placeholder) deps[i] = actualPromise;
      }
    }

    var prevLogs = this.dependendPromisesLogs.get(placeholder);
    if (prevLogs) {
      var logs = this.dependendPromisesLogs.get(actualPromise) || [];
      this.dependendPromisesLogs.set(actualPromise, prevLogs.concat(logs));
    }


  }

  static findParent(promise) {
    for(let [key, deps] of this.dependendPromises) {
        if (deps.includes(promise)) return key
    }
    return undefined
  }

  static findRoot(promise) {
    var parent = this.findParent(promise)
    if (!parent) return promise
    return this.findParent(parent)
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

  static debugPrint() {
    return Array.from(this.dependendPromises).map( pair => {
      return (pair[0] && pair[0].__promise_debug_id__) + " => "
        + (pair[1].map(ea => ea.__promise_debug_id__ || ea).join(", "))
    }).join("\n")
  }

  static ensureDebugId(promise) {
    if (promise.__promise_debug_id__ === undefined) {
     promise.__promise_debug_id__ =  LogPromises.resolveCounter++
  }
    return promise.__promise_debug_id__
  }
}

LogPromises.resetLogs()

cop.layer(window, "LogPromisesLayer").refineClass(Promise, {
  constructorHook(proceed, args) {
    var func = args[0]
    var oldPromise = this;
    if (func) {
      args[0] = (...rest) => {
        LogPromises.ensureDebugId(this)
        if (oldPromise) {
          LogPromises.addDependend(LogPromises.currrentPromise, oldPromise)
        } else {
          console.log("no old promise")
        }
        var r
        cop.withLayers([LogPromisesLayer, LogPromises.currentPromiseLayer(oldPromise)], () => {
          r =  func(...rest)
        })
        return r
      }
    }
    var result = cop.proceed(proceed, args)
    LogPromises.ensureDebugId(result)

    this.replace_with = result
    LogPromises.replacePlaceholder(this, result)
    return result
  },

  then(onresolve, onerror) {
    var oldPromise = this;
    var debugId = LogPromises.ensureDebugId(oldPromise)
    var newPromise = cop.proceed(
      onresolve ? (...args) => {
        var result
        cop.withLayers([LogPromisesLayer, LogPromises.currentPromiseLayer(oldPromise)], () => {
          result = onresolve(...args)
        })
        return result
      } : undefined,
      onerror);
    LogPromises.ensureDebugId(newPromise)
    LogPromises.addDependend(oldPromise, newPromise)
    return newPromise
  }
}).refineObject(console, {
  log(...args) {
    return cop.withoutLayers([LogPromisesLayer], () => {
      // console.log("current layer: " + LogPromises.print(LogPromises.currrentPromise));
      LogPromises.promisedLog(LogPromises.currrentPromise, args)
      return cop.proceed(...args)
    })
  }
})

// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()
