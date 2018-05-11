import InputAnnotation from "./input-annotation.js";
import SliderWidget from "../ui/slider-widget.js";


export default class Slider extends InputAnnotation {
  constructor(editor, location, changeCallback, examples) {
    super(editor, location, changeCallback, examples);
  }
  
  _makeWidget(editor, location, examples) {
    return new SliderWidget(editor, location, this.kind, this._changeCallback, examples);
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