import ConnectorField from "./connector-field.js";

export default class SelectField extends ConnectorField {
  
  constructor(example, name, changeCallback, className = "", style = "", hasConnector = true) {
    super(example, name, changeCallback);
    
    // Selector
    this._input = <select></select>;
    this._input.addEventListener("change", this.fireChange.bind(this));
    
    // Connector
    this._makeConnector("component");
    
    // Element
    this._element = <span class={"input-field " + className} style={style}>
        {this._input}
        {hasConnector ? this._connector.element : ""}
      </span>;
    
  }
  
  fireChange() {
    this._changeCallback(this.id);
  }
  
  set options(options) {
    let oldValue = 0;
    if(this._input.options.length) {
      oldValue = this._input.options[this._input.selectedIndex].value;
    }
    
    this._input.innerHTML = "";
    
    let newIndex = 0;
    options.map((option, index) => {
      this._input.appendChild(<option value={option.id}>{option.name.value}</option>)
      if(option.id === oldValue) {
        newIndex = index;
      }
    });
    this._input.selectedIndex = newIndex;
  }
  
  get value() {
    if(this.isConnected) {
      return {
        value: this.id,
        isConnection: true,
      }
    } else {
      return {
        value: this._input.options[this._input.selectedIndex].value,
        isConnection: false,
     };
    }
  }
  
  set value(value) {
    if(value.isConnection) {
      this.setTargetKey(value.value);
    } else {
      Array.from(this._input.options).forEach((option, index) => {
        if(option.value === value.value) {
          this._input.selectedIndex = index;
        }
      });
    }
    this.fireChange();
  }
}