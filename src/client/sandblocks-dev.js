/*MD 
# Sandblock Dev Hacks...

MD*/
import * as cop from "src/client/ContextJS/src/contextjs.js"

/* globals SandblocksComponentProxies */

if (!window.SandblocksComponentProxies) {
  window.SandblocksComponentProxies = new Map() 
}

export let SandblocksLayer = cop.layer(window, "SandblocksLayer")

let _log = function(...args) {
  console.log("sandblock custom element: ", ...args)
}

SandblocksLayer.refineObject( window.customElements, {
  define(componentName, aClass) {
    var proxy = SandblocksComponentProxies.get(componentName)
    if (!proxy) {
        proxy = class extends HTMLElement {
          static get name() {
            return componentName
          }
          
          // static  observedAttributes = ["text"]
          static get observedAttributes() {
            debugger
            return this.__proto__.observedAttributes
          } 

      
          // TODO do we really still need this?
          connectedCallback( args) {
            _log('connectedCallback ' + componentName )
            if (this.constructor.__proto__.prototype.connectedCallback) {
              return this.constructor.__proto__.prototype.connectedCallback.apply(this, args)
            }
          }
          disconnectedCallback(...args) {
            _log('disconnectedCallback ' + componentName )
            if (this.constructor.__proto__.prototype.disconnectedCallback) {
              return this.constructor.__proto__.prototype.disconnectedCallback.apply(this, args)
            }
          }
          // TODO does not get called...
          attributeChangedCallback(...args) {
            _log('attributeChangedCallback ' + componentName )
            if (this.constructor.__proto__.prototype.attributeChangedCallback) {
              return this.constructor.__proto__.prototype.attributeChangedCallback.apply(this, args)
            }
          }
          adoptedCallback(...args)	{
            _log('adoptedCallback ' + componentName )
            if (this.constructor.__proto__.prototype.adoptedCallback) {
              return this.constructor.__proto__.prototype.adoptedCallback.apply(this, args)  
            }          
          }
        }
      SandblocksComponentProxies.set(componentName, proxy)
      proxy.__proto__ = aClass
      proxy.prototype.__proto__ = aClass.prototype
      cop.withoutLayers([SandblocksLayer], () => {
        cop.proceed(componentName, proxy)
      })
    } else {
        // do nothing
      proxy.__proto__ = aClass
      proxy.prototype.__proto__ = aClass.prototype
    }
  }
})

