import InputAnnotation from "./input-annotation.js";
import SliderWidget from "../ui/slider-widget.js";


export default class Slider extends InputAnnotation {
  constructor(editor, location, changeCallback, examples, deleteCallback) {
    super(editor, location, changeCallback, examples, deleteCallback);
  }
  
  _makeWidget(editor, location, examples) {
    return new SliderWidget(editor, location, this.kind, this._changeCallback, examples, this._deleteCallback);
  }
  
  set maxValues(maxValues) {
    this._widget.maxValues = maxValues;
  }
  
  empty() {
    this._widget.maxValues = new Map();
  }

  fire() {
    this._widget.fire();
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey
    };
  }
  
  serializeForSave() {
    return this.serializeForWorker();
  }
}