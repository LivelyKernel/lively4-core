import * as cop  from "src/client/ContextJS/src/contextjs.js";


// FUCK could not look left nor right see src/client/tracer.js


export default class Tracing {
  
  static traceClass(aClass) {
    let partialLayer = {}
    for(let name of lively.methods(aClass.prototype)) {
      partialLayer[name] = function (...args) {
          let start = performance.now()
          let result = cop.proceed(...args)

          var finish = () => console.log("[trace] " + aClass.name + ">> " + name + " " + (performance.now() - start) + "ms")
          if (result && result.then) {
            result.then(finish)
          } else {
              finish
          }
          return result
      }  
    }
    cop.layer(window, "TraceLayer").refineClass(aClass, partialLayer)
    window.TraceLayer.beGlobal()
  }             
  
  
    static traceObject(obj) {
      let partialLayer = {}
      for(let name of lively.methods(obj)) {
        partialLayer[name] = function (...args) {
            let start = performance.now()
            let result = cop.proceed(...args)

            var finish = () => console.log("[trace] " + obj.name + "." + name + " " + (performance.now() - start) + "ms")
            if (result && result.then) {
              result.then(finish)
            } else {
                finish
            }
            return result
        }  
      }
      cop.layer(window, "TraceLayer").refineObject(obj, partialLayer)
      window.TraceLayer.beGlobal()
  }             
  
}


