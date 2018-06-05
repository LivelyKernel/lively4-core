import Connector from "./connector.js";
import {
  abstract,
  defaultConnections,
} from "../utils/defaults.js";

export default class ConnectorField {
  constructor(parent, name, changeCallback) {
    this._parent = parent;
    this._name = name;
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
      this._element.classList.add("connected");
    } else {
      this._element.classList.remove("connected");
    }
    this.fireChange();
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
    abstract();
  }
  
  get valueFroSave() {
    abstract();
  }
  
  set value(value) {
    abstract();
  }
}