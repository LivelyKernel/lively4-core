export default class Connector {
  
  constructor(source, changeCallback, targetKind) {
    this._sourceId = source.id;
    this._target = null;
    this._changeCallback = changeCallback;
    this._targetKind = targetKind;
    
    // Global connector table
    if(!window.__connectors) {
      window.__connectors = {};
    }
    
    // Set up element
    this._element = <span class="icon connector off"></span>;
    this._element.addEventListener("click", () => {
      if(this.target) {
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
  
  get target() {
    return this._target;
  }
  
  set target(target) {
    this._target = target;
    if(target) {
      this._element.classList.remove("off");      
      
      // Set up target
      window.__connectors[this._sourceId] = () => {
        if(this._targetKind === "canvas") {
          target.getContext("2d").clearRect(0, 0, target.width, target.height);
        }
        return target;
      };
    } else {
      this._element.classList.add("off");
      delete window.__connectors[this._sourceId];
    }
    this._changeCallback(target);
  }
  
  get element() {
    return this._element;
  }
}

