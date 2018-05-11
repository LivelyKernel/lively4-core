import ReplacementWidget from "../ui/replacement-widget.js";
import InputAnnotation from "./input-annotation.js";


export default class Replacement extends InputAnnotation {
  constructor(editor, location, changeCallback) {
    super(editor, location, changeCallback);
  }
  
  _makeWidget(editor, location) {
    return new ReplacementWidget(editor, location, this.kind, this._changeCallback);
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
}