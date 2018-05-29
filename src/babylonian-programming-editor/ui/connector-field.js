import Connector from "./connector.js";
import { abstract } from "../utils/defaults.js";

export default class ConnectorField {
  constructor(example, name, changeCallback) {
    this._example = example;
    this._name = name;
    this._id = `${this._example.id}_${this._name}`;
    this._changeCallback = changeCallback;
  }
  
  fireChange() {
    abstract();
  }
  
  _makeConnector(targetKind) {
    this._connector = new Connector(this, this._onConnectorChange.bind(this), targetKind);
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
  
  get element() {
    return this._element;
  }
  
  get id() {
    return this._id;
  }
  
  get input() {
    return this._input;
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
  
  get value() {
    abstract();
  }
  
  get valueFroSave() {
    abstract();
  }
  
  set value(value) {
    abstract();
  }
}