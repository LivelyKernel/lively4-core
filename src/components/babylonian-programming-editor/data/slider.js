import InputAnnotation from "./input-annotation.js";
import SliderWidget from "../ui/slider-widget.js";

/**
 * A slider is used to scrub through loop
 */
export default class Slider extends InputAnnotation {
  constructor(editor, location, changeCallback, value = new Map()) {
    super(editor, location, changeCallback, value);
  }
  
  /**
   * Creates a new widget
   */
  _makeWidget(editor, location) {
    return new SliderWidget(editor, location, this.kind, this._changeCallback);
  }
  
  /**
   * Forces all change events to fire
   */
  fire() {
    this._widget.fire();
  }
  
  /**
   * Returns a serialized version of this annotation
   */
  serialize() {
    return {
      location: this.locationAsKey
    };
  }
}