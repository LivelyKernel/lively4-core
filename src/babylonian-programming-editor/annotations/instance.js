import InstanceWidget from "../ui/instance-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Instance extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback, instances, customInstances) {
    super(editor, location, changeCallback, null, deleteCallback);
    this._widget = new InstanceWidget(editor, location, this.kind, instances, customInstances, this._changeCallback, this._deleteCallback);
  }
  
  get id() {
    return this._widget._id;
  }
  
  get name() {
    return this._widget.name;
  }
  
  set keys(keys) {
    this._widget.keys = keys;
  }
  
  serializeForWorker() {
    return Object.assign(super.serializeForWorker(), {
      id: this.id,
      name: this.name,
      values: this._widget.valuesArray
    });
  }
  
  serializeForSave() {
    return Object.assign(super.serializeForSave(), {
      id: this.id,
      name: this.name,
      values: this._widget.values
    });
  }
  
  load(serialized) {
    this._widget.id = serialized.id;
    this._widget.values = serialized.values;
    this._widget.name = serialized.name;
  }
}