export default class Connector {
  constructor(source, changeCallback) {
    this._sourceId = source.id;
    this._target = null;
    this._changeCallback = changeCallback;
    
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
          document.addEventListener("click", (e) => {
            this.target = e.target.shadowRoot ? e.target.shadowRoot.querySelector("canvas") : e.target.querySelector("canvas");
          }, {once : true});
        }, 100);
      }
    });
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
        target.getContext("2d").clearRect(0, 0, target.width, target.height);
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

