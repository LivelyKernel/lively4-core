import InstanceWidget from "../ui/instance-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Instance extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, null, deleteCallback);
  }
  
  _makeWidget(editor, location) {
    return new InstanceWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey,
      code: this._widget.code
    };
  }
  
  serializeForSave() {
    return this.serializeForWorker();
  }
  
  load(serialized) {
    this._widget.code = serialized.code;
  }
}