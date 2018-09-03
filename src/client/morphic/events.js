import * as cop  from 'src/client/ContextJS/src/contextjs.js'

export default class Events {
  
  static logBeforeEvent(obj, type, evt, cb) {
    // do nothing
    // console.log("before evt ", evt)
  }

//   static logAroundEvent(obj, type, event, cb, proceed) {
//     return proceed()
//   }

//   static logAroundEvent(obj, type, event, cb) {
//     // do nothing
//   }
  
  static installHooks() {
    this.installHooksContextJS()
    // this.installHooksPlain()
  }
  
  static installHooksContextJS() {
  
    if (!window.__Events_callbackbMap) {
      window.__Events_callbackbMap = new WeakMap()
    }
    var cbMap = window.__Events_callbackbMap

    var layer = cop.layer(window, "EventHookLayer")
    layer.refineClass(HTMLElement, {
    
    removeEventListener(type, cb, ...rest) {
      var wrappedCB = cbMap.get(cb) // we have to keep the illusion
      return cop.proceed(type, wrappedCB || cb, ...rest)
    },
    
    addEventListener(type, cb, ...rest) {
        // we cannot just wrapp a callback cb, because callbacks are also used in removeEventListener...
        var func = cbMap.get(cb) || (function(...args) {
          cop.withoutLayers([layer], () => {
            EventHooks.logBeforeEvent(this, type, args[0], cb)
          })
          return cb.apply(this, args)
        })
        cbMap.set(cb, func)
        cop.proceed(type, func, ...rest) 
      }
    })
    
    layer.beGlobal()
  }

  static installHooksPlain() {
  
    if (!window.__Events_callbackbMap) {
      window.__Events_callbackbMap = new WeakMap()
    }
    var cbMap = window.__Events_callbackbMap

    
    if (!window.__originalRemoveEventListener) {
      window.__originalRemoveEventListener = HTMLElement.prototype.removeEventListener
    }
    if (!window.__originalAddEventListener) {
      window.__originalAddEventListener = HTMLElement.prototype.addEventListener
    }
 
    HTMLElement.prototype.removeEventListener = function(type, cb, ...rest) {
      var wrappedCB = cbMap.get(cb) // we have to keep the illusion
      return window.__originalRemoveEventListener.apply(this, [type, wrappedCB, ...rest])
    }
    
    HTMLElement.prototype.addEventListener = function(type, cb, ...rest) {
        // we cannot just wrapp a callback cb, because callbacks are also used in removeEventListener...
        var func = cbMap.get(cb) || (function(...args) {
          
          // this becomes dangerous... without COP, we need a global flag
          if (!EventHooks.__isLogging) {
            try {
              EventHooks.__isLogging = true
              EventHooks.logBeforeEvent(this, type, args[0], cb)
            } finally {
              EventHooks.__isLogging = false
            }
          }
          return cb.apply(this, args)
        })
        cbMap.set(cb, func)
        return window.__originalAddEventListener.apply(this, [type, func, ...rest])
    }
  }
}

window.EventHooks = Events



