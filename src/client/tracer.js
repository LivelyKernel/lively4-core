import * as cop from 'src/external/ContextJS.js'

export default class Tracer { 

  static trace(aClass) {
    this.layer = cop.create(document, "TraceLayer") 
    var obj = {}
    Object.getOwnPropertyNames(aClass.prototype).filter(ea => ea != "constructor").forEach( methodName => {
    	obj[methodName] = function() {
    		console.log(" " + this.constructor.displayName +"."+ methodName + " " + Array.from(arguments).join(", "))
    		return cop.proceed.apply(this, arguments)
    	}
    })
    this.layer.refineClass(aClass, obj)
    
    this.enable()
  }
  
  static disable() {
    this.layer.beNotGlobal()
  }

  static enable() {
    this.layer.beGlobal()
  }
}

