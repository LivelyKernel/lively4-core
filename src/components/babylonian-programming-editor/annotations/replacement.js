import ReplacementWidget from "../ui/replacement-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Replacement extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, null, deleteCallback);
    this._widget = new ReplacementWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
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