import InputAnnotation from "./input-annotation.js";
import ExampleWidget from "../ui/example-widget.js";


export default class Example extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback, stateCallback, defaultIsOn, instances) {
    super(editor, location, changeCallback, null, deleteCallback);
    let newStateCallback = (newState) => {
      stateCallback(this, newState);
    }
    this._widget = new ExampleWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback, newStateCallback, defaultIsOn, instances);
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
  
  set error(error) {
    this._widget.error = error;
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey,
      id: this.id,
      name: this.name,
      color: this._widget.color,
      values: this._widget.valuesArray,
      instanceId: this._widget.instanceId,
      prescript: this._widget.prescript,
      postscript: this._widget.postscript,
    };
  }
  
  serializeForSave() {
    return {
      location: this.locationAsKey,
      id: this.id,
      name: this.name,
      color: this._widget.color,
      values: this._widget.values,
      instanceId: this._widget.instanceId,
      prescript: this._widget.prescript,
      postscript: this._widget.postscript,
    };
  }
  
  load(serialized) {
    this._widget.id = serialized.id;
    this._widget.values = serialized.values;
    this._widget.name = serialized.name;
    this._widget.color = serialized.color;
    this._widget.instanceId = serialized.instanceId;
    this._widget.prescript = serialized.prescript;
    this._widget.postscript = serialized.postscript;
  }
}