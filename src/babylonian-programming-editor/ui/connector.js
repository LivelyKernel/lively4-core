import { defaultConnections } from "../utils/defaults.js";

export default class Connector {
  
  constructor(source, changeCallback, targetKind) {
    this._source = source;
    this._target = null;
    this._changeCallback = changeCallback;
    this._targetKind = targetKind;
    this._isConnected = false;
    this._isBroken = false;
    
    // Set up element
    this._element = <span class="icon connector off"></span>;
    this._element.addEventListener("click", () => {
      if(this.isConnected) {
        this.target = null;
      } else {
        this._element.classList.remove("off");
        setTimeout(() => {
          document.addEventListener("click", this._onTargetSelect.bind(this), {once : true});
        }, 100);
      }
    });
  }
  
  _onTargetSelect(event) {
    switch(this._targetKind) {
      case "canvas":
        this.target = event.target.shadowRoot ?
                      event.target.shadowRoot.querySelector("canvas") :
                      event.target.querySelector("canvas");
        break;
      case "component":
        this.target = event.target;
        break;
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
      this._element.classList.remove("off");
    } else {
      this._element.classList.add("off");
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

