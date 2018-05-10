import Annotation from "./annotation.js";
import ProbeWidget from "../ui/probe-widget.js";

/**
 * A probe shows values
 */
export default class Probe extends Annotation {
  constructor(editor, location, value = new Map()) {
    super(editor, location, value);
    this._widget = this._makeWidget(editor, location);
    this.value = value;
  }
  
  /**
   * Creates a new widget
   */
  _makeWidget(editor, location) {
    return new ProbeWidget(editor, location, this.kind);
  }
  
  /**
   * Sets the displayed run (loops)
   */
  setActiveRunForExampleId(exampleId, activeRun) {
    this._widget.setActiveRunForExampleId(exampleId, activeRun);
  }
  
  /**
   * Unsets s the displayed run (loops)
   */
  unsetActiveRunForExample(exampleId) {
    this._widget.unsetActiveRunForExample(exampleId);
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