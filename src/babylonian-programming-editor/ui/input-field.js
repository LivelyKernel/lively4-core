import Connector from "./connector.js";

export default class InputField {
  
  constructor(example, name, placeholder, changeCallback, className = "", style = "", hasConnector = true) {
    this._example = example;
    this._name = name;
    this._id = `${this._example.id}_${this._name}`;
    this._placeholder = placeholder;
    this._changeCallback = changeCallback;
    
    // Text input
    this._input = <input
        type="text"
        id={this._id}
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
    this._connector = new Connector(this, this._onConnectorChange.bind(this));
    
    // Element
    this._element = <span class={"input-field " + className} style={style}>
        {this._input}
        {hasConnector ? this._connector.element : ""}
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
  
  _onConnectorChange(newTarget){
    if(newTarget) {
      // New target
      this._input.style.display = "none"
      this._element.style.border = "none"; 
    } else {
      // Clear target
      this._input.style.display = "";
      this._element.style.border = "";
    }
    this.fireChange();
  }
  
  get id() {
    return this._id;
  }
  
  get element() {
    return this._element;
  }
  
  get value() {
    if(this.target) {
      return `window.__connectors["${this._id}"]()`;
    } else {
      return this._input.value;
    }
  }
  
  get valueForSave() {
    if(this.target) {
      return "";
    } else {
      return this._input.value;
    }
  }
  
  set value(value) {
    this._input.value = value;
    this.fireChange();
  }
  
  get style() {
    return this._element.style;
  }
  
  set style(style) {
    this._element.style = style;
  }
  
  get target() {
    return this._connector.target;
  }
}