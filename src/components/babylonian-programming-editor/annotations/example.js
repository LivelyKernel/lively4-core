import InputAnnotation from "./input-annotation.js";
import ExampleWidget from "../ui/example-widget.js";


export default class Example extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback, stateCallback, defaultIsOn) {
    super(editor, location, changeCallback, null, deleteCallback);
    let newStateCallback = (newState) => {
      stateCallback(this, newState);
    }
    this._widget = new ExampleWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback, newStateCallback, defaultIsOn);
  }
  
  get id() {
    return this._widget._id;
  }
  
  get name() {
    return this._widget.name;
  }
  
  get color() {
    return this._widget._color;
  }
  
  get isOn() {
    return this._widget._isOn;
  }
  
  set keys(keys) {
    this._widget.keys = keys;
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey,
      id: this.id,
      code: this._widget.code
    };
  }
  
  serializeForSave() {
    return {
      location: this.locationAsKey,
      name: this.name,
      values: this._widget.values
    };
  }
  
  load(serialized) {
    this._widget.values = serialized.values;
    this._widget.name = serialized.name;
  }
}