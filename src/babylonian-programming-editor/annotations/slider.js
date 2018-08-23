import InputAnnotation from "./input-annotation.js";
import SliderWidget from "../ui/slider-widget.js";


export default class Slider extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, deleteCallback);
    this._widget = new SliderWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
  }
  
  set maxValues(maxValues) {
    this._widget.maxValues = maxValues;
  }
  
  get maxValues() {
    return this._widget.maxValues;
  }
  
  empty() {
    this._widget.maxValues = new Map();
  }

  fire() {
    this._widget.fire();
  }
}