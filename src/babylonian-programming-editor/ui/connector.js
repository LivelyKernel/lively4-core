import { defaultConnections } from "../utils/defaults.js";

export default class Connector {
  
  constructor(source, changeCallback) {
    this._source = source;
    this._target = null;
    this._changeCallback = changeCallback;
    this._targetKind = null;
    this._isConnected = false;
    this._isBroken = false;
    
    // Set up element
    this._element = <span class="icon connector off"></span>;
    this._element.addEventListener("click", () => {
      if(this.isConnected) {
        this.target = null;
      } else {
        this._element.classList.add("on");
        setTimeout(() => {
          document.addEventListener("click", this._onTargetSelect.bind(this), {once : true});
        }, 100);
      }
    });
  }
  
  _onTargetSelect(event) {
    debugger
    var target = event.path[0]
    // Connect to the canvas if there is one
    const canvas = target.shadowRoot ?
                   target.shadowRoot.querySelector("canvas") :
                   target.querySelector("canvas");
    
    if(canvas) {
      this.target = canvas;
      this._targetKind = "canvas";
    } else {
      this.target = target;
      this._targetKind = "component";
    }
  }
  
  get isBroken() {
    return this._isBroken;
  }
  
  set isBroken(isBroken) {
    this._isBroken = isBroken;
    if(isBroken) {
      this._element.classList.add("broken");
    } else {
      this._element.classList.remove("broken");
    }
  }
  
  get isConnected() {
    return this._isConnected;
  }
  
  set isConnected(isConnected) {
    this._isConnected = isConnected;
    if(isConnected) {
      this._element.classList.add("on");
    } else {
      this._element.classList.remove("on");
    }
  }
  
  get stringTarget() {
    if(!this._target) {
      return null;
    }
    if(this._target.__proto__.constructor) {
      return this._target.__proto__.constructor.name;
    } else {
      return "" + this._target;
    }
  }
  
  get target() {
    return this._target;
  }
  
  set target(target) {
    this._target = target;
    if(target) {
      this.isConnected = true;
      this.isBroken = false;
      
      // Set up target
      defaultConnections()[this._source.id] = target;
    } else {
      this.isConnected = false;
      this.isBroken = false;
      delete defaultConnections()[this._source.id];
    }
    this._changeCallback(target);
  }
  
  get element() {
    return this._element;
  }
}

/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */