import ReplacementWidget from "../ui/replacement-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Replacement extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, deleteCallback);
    this._widget = new ReplacementWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
  }
  
  get id() {
    return this._widget.id;
  }

  serializeForWorker() {
    return Object.assign(super.serializeForWorker(), {
      id: this.id,
      location: this.locationAsKey,
      value: this._widget.value
    });
  }
  
  serializeForSave() {
    return this.serializeForWorker();
  }
  
  load(serialized) {
    this._widget.id = serialized.id;
    this._widget.value = serialized.value;
  }
}