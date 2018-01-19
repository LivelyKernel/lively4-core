/*
 * 
 *
 */
import Morph from 'src/components/widgets/lively-morph.js';

class HTMLElementStyleProxy {
  constructor(target) {
    this.target = target
    this.setupAccessors()
   
  }
  
  setupAccessors() {    
    this.createAttributeAccessor("fill", "backgroundColor")
    this.createAttributeAccessor("strokeColor", "borderColor")
    this.createAttributeAccessor("strokeWidth", "borderWidth", v => v + "px")
    this.createAttributeAccessor("strokeStyle", "borderStyle")
  }
  
  createAttributeAccessor(name, styleName, map= v => v) {
    Object.defineProperty(this, name, {
      get() { 
        return this.target.style[styleName]; 
      },
      set(newValue) { 
        this.target.style[styleName] = map(newValue)   
      },
      enumerable: true,
      configurable: true
    });
  }
}

class SVGElementStyleProxy extends HTMLElementStyleProxy {
  
  setupAccessors() {    
    this.createAttributeAccessor("fill", "fill")
    this.createAttributeAccessor("strokeColor", "stroke")
    this.createAttributeAccessor("strokeWidth", "stroke-width")
    this.createAttributeAccessor("strokeStyle", "stroke-dasharray", (v,t) => {
      if (v == "dashed") {
        return [3,1].map(ea => (Number(t.getAttribute("stroke-width") || 1) * ea)) 
      } else {
        return ""
      }
    })
  }
  
  createAttributeAccessor(name, styleName, map= v => v) {
    Object.defineProperty(this, name, {
      get() { 
        return this.target.getAttribute(styleName); 
      },
      set(newValue) { 
         this.target.setAttribute(styleName, map(newValue, this.target));  
      },
      enumerable: true,
      configurable: true
    });
  }

}

export default class LivelyStyleEditor extends Morph {
  async initialize() {
    this.windowTitle = "LivelyStyleEditor";   
    this.choosers = new Map()
    this.get("#target-button").addEventListener("target-changed", (evt) => {
      this.onUpdateTarget(evt.detail.target)
    })
    
    this.register('#fillChooser', 'fill')
    this.register('#strokeColorChooser', 'strokeColor')
    this.register('#strokeWidthChooser', 'strokeWidth')
    this.register('#strokeStyleChooser', 'strokeStyle', "change", (e,c) => c.value)
  }
  
  register(elementSelector, styleName, eventName="value-changed", map= (e,c) => e.detail.value) {
    var element = this.get(elementSelector)
    this.choosers.set(element, styleName)
    
    element.addEventListener(eventName, e => {
      if (!this.target) return;
      debugger
      lively.notify("set " + styleName + " " + map(e, this.target))
      this.proxy[styleName] = map(e, element)
    });  
  }
  
  setTarget(target) {
    lively.showElement(target)
    this.onUpdateTarget(target)
  }
  
  hideTargetButton() {
    this.get("lively-target-button").style.display = "none"
  }
  
  onUpdateTarget(target) {
    this.target = target
    if (!this.target) return
    // dispatch to a proxy that does the translation work 
    if (target instanceof SVGElement) {
      this.proxy = new SVGElementStyleProxy(target)
    } else {
      this.proxy = new HTMLElementStyleProxy(target)      
    }
    // fill the style editor with values found in the target
    this.choosers.forEach((style, chooser) => {
      chooser.value = this.proxy[style] 
    })
  }  
}