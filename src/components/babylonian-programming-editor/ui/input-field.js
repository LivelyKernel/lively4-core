export default class InputField {
  
  constructor(example, name, placeholder, className, changeCallback) {
    this._example = example;
    this._name = name;
    this._id = `${this._example.id}_${this._name}`;
    this._placeholder = placeholder;
    this._changeCallback = changeCallback;
    this._target = null;
    
    // Text input
    this._input = <input
        type="text"
        id={this._id}
        class={className}
        name={name}
        size={placeholder.length}
        value=""
        placeholder={placeholder}>
      </input>;

    this._input.addEventListener("input", () => {
      this._adjustSize();
    });
    
    this._input.addEventListener("change", () => {
      this.fireChange();
    });
    
    // Connector
    this._connector = <span class="connector"></span>;
    this._connector.addEventListener("click", () => {
      setTimeout(() => {
        document.addEventListener("click", (e) => {
          this.target = e.target.shadowRoot ? e.target.shadowRoot.querySelector("canvas") : e.target.querySelector("canvas");
        }, {once : true});
      }, 100);
    });
    
    // Element
    this._element = <span class="input-field">
        {this._input}
        {this._connector}
      </span>;
    
  }
  
  fireChange() {
    this._adjustSize();
    this._changeCallback(this._id, this._name);
  }
  
  _adjustSize() {
    this._input.setAttribute(
        "size",
        this._input.value.length ? this._input.value.length : this._placeholder.length);
  }
  
  get id() {
    return this._id;
  }
  
  get element() {
    return this._element;
  }
  
  get value() {
    if(this._target) {
      return `window.__connectors["${this._id}"]()`;
    } else {
      return this._input.value;
    }
  }
  
  set value(value) {
    this._input.value = value;
    this.fireChange();
  }
  
  set target(target) {
    this._target = target;
    if(this._target) {
      this._input.style.display = "none"
      // Set up target
      if(!window.__connectors) {
        window.__connectors = {};
      }
      window.__connectors[this._id] = () => {
        target.getContext("2d").clearRect(0, 0, target.width, target.height);
        target.style.border = `3px solid ${this._example.color}`;
        return target;
      };
    }
    this.fireChange();
  }
}