import Connector from "./connector.js";
import { maybeUnpackString } from "../utils/utils.js";
import { defaultConnections } from "../utils/defaults.js";

export default class InputField {
  
  constructor(parent, name, placeholder, changeCallback, className = "", style = "", hasConnector = true) {
    this._parent = parent;
    this._name = name;
    this._changeCallback = changeCallback;
    this._placeholder = placeholder;
    this._mode = "input"; // input, select, connect
    
    // Input
    this._input = <input
        type="text"
        id={this.id}
        name={name}
        size={placeholder.length}
        value=""
        placeholder={placeholder}>
      </input>;
    this._input.addEventListener("input", this._adjustSize.bind(this));
    this._input.addEventListener("change", this.fireChange.bind(this));
    
    // Select
    this._select = <select></select>;
    this._select.addEventListener("change", this._onSelectChange.bind(this));
    
    // Connect
    this._connector = new Connector(this, this._onConnectorChange.bind(this), "canvas");
    
    // Element
    this._element = <span class={"input-field " + className} style={style}>
        {this._input}{hasConnector ? this._select : ""}{hasConnector ? this._connector.element : ""}
      </span>;
  }
  
  _onSelectChange() {
    if(this._select.selectedIndex) {
      this.mode = "select";
    } else {
      this.mode = "input";
    }
    this.fireChange();
  }
  
  _onConnectorChange(newTarget){
    if(newTarget) {
      this.mode = "connect";
    } else {
      this.mode = "input";
    }
    this.fireChange();
  }
  
  _adjustSize() {
    this._input.setAttribute(
        "size",
        this._input.value.length ? this._input.value.length : this._placeholder.length);
    return true;
  }
  
  fireChange() {
    this._adjustSize();
    this._changeCallback(this.id, this._name);
  }
  
  get element() {
    return this._element;
  }
  
  get id() {
    return `${this._parent.id}_${this._name}`;
  }
  
  get input() {
    return this._input;
  }
  
  get isConnected() {
    return this._connector.isConnected;
  }
  
  get mode() {
    return this._mode;
  }
  
  set mode(mode) {
    const validModes = ["input", "select", "connect"];
    if(!validModes.includes(mode)) {
      return; 
    }
    
    this._mode = mode;
    validModes.forEach(m => this._element.classList.remove(m));
    this._element.classList.add(mode);
    
    if(mode !== "input") {
      this._input.setAttribute("readonly", "readonly");
      this._input.value = this.stringValue;
    } else {
      this._input.removeAttribute("readonly");
      this._input.value = "";
    }
  }
  
  set options(options) {
    let oldValue = 0;
    if(this._select.options.length) {
      oldValue = this._select.options[this._select.selectedIndex].value;
    }
    
    this._select.innerHTML = "";
    
    let newIndex = 0;
    options.map((option, index) => {
      this._select.appendChild(<option value={option.id}>{maybeUnpackString(option.name)}</option>)
      if(option.id === oldValue) {
        newIndex = index;
      }
    });
    this._select.selectedIndex = newIndex;
  }
  
  get stringValue() {
    switch(this.mode) {
      case "input":
        return this._input.value;
      case "select":
        return this._select.options[this._select.selectedIndex].textContent;
      case "connect":
        return this._connector.stringTarget;
    }
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
  
  set target(target) {
    this._connector.target = target;
  }
  
  setTargetKey(targetKey) {
    if(targetKey in defaultConnections()) {
      this.target = defaultConnections()[targetKey];
      return true;
    } else {
      this._connector.isConnected = true;
      this._connector.isBroken = true;
      this._onConnectorChange(true);
      return false;
    }
  }
  
  get value() {
    let value;
    switch(this.mode) {
      case "input":
        value = this._input.value;
        break;
      case "select":
        value = this._select.options[this._select.selectedIndex].value;
        break;
      case "connect":
        value = this.id;
        break;
    }
    
    return {
      mode: this.mode,
      value: value
    };
  }
  
  set value(value) {
    switch(value.mode) {
      case "input":
        this.mode = value.mode;
        this._input.value = value.value;
        break;
      case "select":
        for(let i in this._select.options) {
          if(this._select.options[i].value === value.value) {
            this._select.selectedIndex = i;
          }
        }
        this.mode = value.mode;
        break;
      case "connect":
        this.setTargetKey(value.value);
        this.mode = value.mode;
        break;
    }
    this.fireChange();
  }
}
