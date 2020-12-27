/*
 * Morph is a HtmlElement replacement with some API enhanncements
 */
 

// #TODO all custom elements have to inherit from HTMLElement
export default class Morph extends HTMLElement {
  /* 
   * Access subelments by name
   * shortcut for querySelector and shadowRoot.querySelector t
   * #FeatureIdea -- In Livel3, it could it also be used to look for owners and siblings  
   */ 
  connectedCallback() {
    // console.log('connected');
  }
  
  get(selector) {
    return this.getSubmorph(selector);
  }

  
  // #Depricated, please use either "get" or "querySelector" directly
  getSubmorph(selector) {
    var morph = this.querySelector(selector);
    if (!morph && this.shadowRoot) {
      morph = this.shadowRoot.querySelector(selector);
    }
    return morph;
  }

  set windowTitle(string){
    this._windowTitle = string;
    // #TODO replace with connections
    if (this.parentElement && this.parentElement.titleSpan) { // check for window?
      this.parentElement.setAttribute("title", string);
    }
  }
  
  get windowTitle(){
    return this._windowTitle;
  }

  set windowIcon(string){
    this._windowIcon = string;
    // #TODO replace with connections
    if (this.parentElement && this.parentElement.titleSpan) { // check for window?
      this.parentElement.setAttribute("icon", string);
    }
  }
  
  get windowIcon(){
    return this._windowIcon;
  }

  getAllSubmorphs(selector) {
    var morphs = Array.from(this.querySelectorAll(selector));
    if (this.shadowRoot) {
      morphs = morphs.concat(Array.from(this.shadowRoot.querySelectorAll(selector)));
    }
    
    // morphs can contain null, if either none was found in this or this.shadowRoot
    return morphs.filter(m => m);
  }
  
  withAttributeDo(name, func) {
    var value = this.getAttribute(name) 
    if (value !== undefined && value !== null) {
      func(value)
    }
  }

  registerButtons() {
    // Just an experiment for having to write less code.... which ended up in having more code here ;-) #Jens
    Array.from(this.shadowRoot.querySelectorAll('button')).forEach(node => {
      var name = node.id;
      var funcName = name.camelCase().replace(/^./, c => 'on'+ c.toUpperCase());
      // console.log('register button ' + name)
      node.addEventListener("click", evt => {
        if (this[funcName] instanceof Function) {
          this[funcName](evt);
        } else {
          alert('No callback: ' +  funcName);
        }
      });
    });
  }
  
  /* 
    catches all enter keyup events and syntesizes a new enter event! 
  */
  registerSignalEnter(rootElement = this) {
    var domain = "singnal-enter"
    lively.removeEventListener(domain, rootElement) // just in case...
    lively.addEventListener(domain, rootElement, "keyup", evt => {
      if(evt.code == "Enter") { 
        evt.target.dispatchEvent(new CustomEvent("enter-pressed", { detail: evt })) 
      }  
    })
  }
  
  registerAttributes(list) {
    for(let name of list) {
      this.registerAttribute(name)
    }
  }
  
  registerAttribute(name) {
    Object.defineProperty(this, name, {
      get() { 
        return this.getAttribute(name); 
      },
      set(newValue) { 
        this.setAttribute(name, newValue)
      },
      enumerable: true,
      configurable: true
    });
  }

  
  
  toString() {
    return "[" + this.constructor.name + "]"
  }
  
  followURLonClick(element, url) {
    lively.removeEventListener("followurl", element, "click")
    lively.addEventListener("followurl", element, "click", (evt) => {
      // distinguish between clicking and selecting text
      if(window.getSelection().toString().length == 0) {
        lively.openBrowser(url)
       }
    })
  }
  
  
  // another option is 'inplace'
  get livelyUpdateStrategy() { return 'migrate'; }
}
