import Annotation from "./annotation.js";
import ProbeWidget from "../ui/probe-widget.js";

/**
 * A probe shows values
 */
export default class Probe extends Annotation {
  constructor(editor, location, value = new Map()) {
    super(editor, location, value);
  }
  
  /**
   * Creates a new widget
   */
  _makeWidget(editor, location) {
    return new ProbeWidget(editor, location, this.kind);
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