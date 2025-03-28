import * as cop  from 'src/client/ContextJS/src/contextjs.js'

// var beforeEvent = new WeakMap()


export default class Events {
  
  /* before */
    
  static disconnectBeforeEvent(cb) {
    if (!this.beforeEventCallbacks) return
    this.beforeEventCallbacks.delete(cb)
  }
  
  static registerBeforeEvent(cb) {
    if (!this.beforeEventCallbacks) {
      this.beforeEventCallbacks = new Set()
    }  
    this.beforeEventCallbacks.add(cb)
  }
  
  // before and after are easier to use, but not so powerful without the additional Map
  static logBeforeEvent(obj, type, evt, cb) {
    
    if (this.beforeEventCallbacks) {
      this.beforeEventCallbacks.forEach(eaCb => {
        eaCb(obj, type, evt, cb)
      })
    }
    
  }
  
  /* after */
  static disconnectAfterEvent(cb) {
    if (!this.afterEventCallbacks) return
    this.afterEventCallbacks.delete(cb)
  }
  
  static registerAfterEvent(cb) {
    if (!this.afterEventCallbacks) {
      this.afterEventCallbacks = new Set()
    }  
    this.afterEventCallbacks.add(cb)
  }

  static logAfterEvent(obj, type, evt, cb) {
    if (this.afterEventCallbacks) {
      this.afterEventCallbacks.forEach(eaCb => {
        eaCb(obj, type, evt, cb)
      })
    }
  }

  static installHooks() {
    // this.installHooksContextJS()
    this.installHooksPlain()
  }
//   // Alternative Implementation using Contetjs 
//   static installHooksContextJS() {
  
//     if (!window.__Events_callbackbMap) {
//       window.__Events_callbackbMap = new WeakMap()
//     }
//     var cbMap = window.__Events_callbackbMap

//     var layer = cop.layer(window, "EventHookLayer")
//     layer.refineClass(HTMLElement, {
    
//     removeEventListener(type, cb, ...rest) {
//       var wrappedCB = cbMap.get(cb) // we have to keep the illusion
//       return cop.proceed(type, wrappedCB || cb, ...rest)
//     },
    
//     addEventListener(type, cb, ...rest) {
//         // we cannot just wrapp a callback cb, because callbacks are also used in removeEventListener...
//         var func = cbMap.get(cb) || (function(...args) {
//           cop.withoutLayers([layer], () => {
//             EventHooks.logBeforeEvent(this, type, args[0], cb)
//           })
//           var result = cb.apply(this, args)
//           cop.withoutLayers([layer], () => {
//             EventHooks.logAfterEvent(this, type, args[0], cb)
//           })
//           return result
//         })
//         cbMap.set(cb, func)
//         return cop.proceed(type, func, ...rest);
//       }
//     })
    
//     layer.beGlobal()
//   }

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
        if (!cb) {
          console.warn("addEventListener: registering empty callback for " + type)
          return
        }
        var func = cbMap.get(cb) || (function(...args) {
          
          // this becomes dangerous... without COP, we need a global flag
          try {
            if (!EventHooks.__isLogging) {
              try {
                EventHooks.__isLogging = true
                EventHooks.logBeforeEvent(this, type, args[0], cb)
              } finally {
                EventHooks.__isLogging = false
              }
            }            
          } catch(e) {
            console.error(e)
          }
          var result = cb.apply(this, args)
          try {
            if (!EventHooks.__isLogging) {
              try {
                EventHooks.__isLogging = true
                EventHooks.logAfterEvent(this, type, args[0], cb)
              } finally {
                EventHooks.__isLogging = false
              }
            }            
          } catch(e) {
            console.error(e)
          }
          return result
        })
        cbMap.set(cb, func)
        return window.__originalAddEventListener.apply(this, [type, func, ...rest])
    }
  }
}

window.EventHooks = Events



