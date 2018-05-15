import InstanceWidget from "../ui/instance-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Instance extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, null, deleteCallback);
    this._widget = new InstanceWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey,
      id: this._widget.id,
      name: this._widget.name,
      code: this._widget.code
    };
  }
  
  serializeForSave() {
    return this.serializeForWorker();
  }
  
  get id() {
    return this._widget.id;
  }
  
  get name() {
    return this._widget.name;
  }
  
  load(serialized) {
    this._widget.id = serialized.id;
    this._widget.name = serialized.name;
    this._widget.code = serialized.code;
  }
}