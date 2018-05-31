import ConnectorField from "./connector-field.js";

export default class InputField extends ConnectorField {
  
  constructor(parent, name, placeholder, changeCallback, className = "", style = "", hasConnector = true) {
    super(parent, name, changeCallback);
    this._placeholder = placeholder;
    
    // Text input
    this._input = <input
        type="text"
        id={this.id}
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
    this._makeConnector("canvas");
    
    // Element
    this._element = <span class={"input-field " + className} style={style}>
        {this._input}
        {hasConnector ? this._connector.element : ""}
      </span>;
    
  }
  
  fireChange() {
    this._adjustSize();
    this._changeCallback(this.id, this._name);
  }
  
  _adjustSize() {
    this._input.setAttribute(
        "size",
        this._input.value.length ? this._input.value.length : this._placeholder.length);
  }
  
  get value() {
    if(this.isConnected) {
      return {
        value: this.id,
        isConnection: true,
      }
    } else {
      return {
        value: this._input.value,
        isConnection: false,
     };
    }
  }
  
  set value(value) {
    if(value.isConnection) {
      this.setTargetKey(value.value);
    } else {
      this._input.value = value.value;
    }
    this.fireChange();
  }
}