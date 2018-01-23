/*
 * Style Editor
 *
 */
import Morph from 'src/components/widgets/lively-morph.js';

class HTMLElementStyleProxy {
  constructor(target) {
    this.target = target
    this.setupAccessors()
   
  }
  
  toString() {
    return "["+this.constructor.name + " on: " + this.target+"]"
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
  
  static proxyFor(target) {
    if (target instanceof SVGElement) {
      return new SVGElementStyleProxy(target)
    } else if (target.tagName == "LIVELY-SELECTION") {
      return new SelectionStyleProxy(target)
    } else {
      return new HTMLElementStyleProxy(target)      
    }
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



class SelectionStyleProxy extends HTMLElementStyleProxy {
  
  constructor(target) {
    super(target)
    this.proxies = target.nodes.filter(ea => {
      return !ea.isMetaNode
    }).map(ea => HTMLElementStyleProxy.proxyFor(ea))   
  }

  setupAccessors() {    
    this.createAttributeAccessor("fill")
    this.createAttributeAccessor("strokeColor")
    this.createAttributeAccessor("strokeWidth")
    this.createAttributeAccessor("strokeStyle")
  }
  
  createAttributeAccessor(name, styleName, map= v => v) {
    Object.defineProperty(this, name, {
      get() { 
        return this.proxies[0] && this.proxies[0][name]; 
      },
      set(newValue) { 
        debugger
        lively.notify("set " + newValue)
        this.proxies.forEach(ea => ea[name] = newValue);  
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
    
    this.shadowRoot.querySelectorAll("lively-crayoncolors").forEach(ea => {
      ea.useAlwaysCustom();
    })
  }
  
  register(elementSelector, styleName, eventName="value-changed", map= (e,c) => e.detail.value) {
    var element = this.get(elementSelector)
    this.choosers.set(element, styleName)
    
    element.addEventListener(eventName, e => {
      if (!this.target || this.isInitializing) return;
      // lively.notify("set " + styleName + " " + map(e, this.target))
      this.proxy[styleName] = map(e, element)
    });  
  }
  
  setTarget(target) {
    if (target.tagName == "svg") {
       var paths = target.querySelectorAll(":not(marker) > path")
       if (paths.length == 1) {
         // we are a single path... the user wan's to style it!
         target = paths[0]
         // either we do this... or we do the magic in the proxies? 
         // e.g. modifying all paths when editing an svg... 
         // part of the problem is that we currently have problems selecting 
         // the contents of the svg...
       }
    }
    
    this.onUpdateTarget(target)
  }
  
  hideTargetButton() {
    this.get("lively-target-button").style.display = "none"
  }
  
  onUpdateTarget(target) {
    this.target = target
    if (!this.target) return
    // dispatch to a proxy that does the translation work 
    this.proxy = HTMLElementStyleProxy.proxyFor(target)
    this.isInitializing = true; // cheap #COP
    // fill the style editor with values found in the target
    this.choosers.forEach((style, chooser) => {
      chooser.value = this.proxy[style] 
    })
    this.isInitializing = false;
  }  
}