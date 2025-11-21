import * as cop from "src/client/ContextJS/src/contextjs.js"


/**
 * Tracer -- An example for using ContextJS
 *
 */




export default class Tracer {

  static trace(aClass) {
    this.callCounter = 0
    this.layer = cop.layer(document, "TraceLayer");
    var obj = {};
    Object.getOwnPropertyNames(aClass.prototype).filter(ea => ea != "constructor").forEach(methodName => {
      if (aClass.prototype[methodName] instanceof Function) {
        obj[methodName] = function() {
          var callId = this.callCounter++
          cop.withoutLayers([this.layer], () => {
            Tracer.onMethodCalled(this, aClass.name, methodName, arguments, callId);
          });
          var result = cop.proceed.apply(this, arguments);
          cop.withoutLayers([this.layer], () => {
            Tracer.onMethodResult(this, aClass.name, methodName, arguments, callId, result);
          });
          return result
        };
      }
    });
    this.layer.refineClass(aClass, obj);

    this.enable();
  }
  static allMethods(obj) {
    var props = Object.getOwnPropertyNames(obj).filter(ea => {
      try {
        return obj[ea] instanceof Function;
      } catch (e) {
        return false;
      }
    });
    props = props
      .filter(ea => !ea.match(/^__/))
      .filter(ea => ea !== "constructor")
      .filter(ea => ea !== "hasOwnProperty");

    var proto = Reflect.getPrototypeOf(obj);
    if (proto) {
      props = props.concat(this.allMethods(proto));
    }
    return Array.from(new Set(props)).sort();
  }

  static onMethodCalled(obj, className, methodName, args, callId) {
    if (Tracer.logTarget) {
      Tracer.logTarget.log(obj, className, methodName, args)
    } else {
      console.log(" " + obj + "." + methodName + " " + args);
    }
  }
  
  static onMethodResult(obj, className, methodName, args, callId, result) {
    if (Tracer.logTarget  && Tracer.logTarget.logResult) {
      Tracer.logTarget.logResult(obj, className, methodName, args)
    } else {
      // console.log(" " + obj + "." + methodName + " " + args);
    }
  }

  static traceObject(anObject) {
    var layer = cop.layer(anObject, "TraceLayer");
    this.layer = layer; // keep reference.... for development

    var partialMethods = {};
    this.allMethods(anObject)
      .filter(name => name != "constructor")
      .filter(name => {
        try {
          return anObject[name] instanceof Function;
        } catch (e) {
          return false;
        }
      })
      .forEach(methodName => {
        partialMethods[methodName] = function() {
          cop.withoutLayers([layer], () => {
            Tracer.onMethodCalled(anObject,
              anObject.constructor.name, methodName, arguments);
          });
          return cop.proceed.apply(this, arguments);
        };

      });
    layer.refineObject(anObject, partialMethods);
    layer.beGlobal();
  }


  static disable() {
    this.layer.beNotGlobal();
  }

  static enable() {
    this.layer.beGlobal();
  }
}
