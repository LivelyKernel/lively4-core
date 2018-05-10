import LocationConverter from "../utils/location-converter.js";

/**
 * The base class for all annotations
 */
export default class Annotation {
  constructor(editor, location, value = null) {
    this._marker = this._makeMarker(editor, location);
    this._widget = this._makeWidget(editor, location);
    this.value = value;
  }
  
  /**
   * Creates a new marker and adds it to the editor
   */
  _makeMarker(editor, location) {
    const marker = editor.markText(
      location.from,
      location.to,
      {
        className: `marker ${this.kind}`,
        startStyle: "start",
        endStyle: "end",
        inclusiveLeft: false,
        inclusiveRight: true
      }
    );
    marker._babylonian = true;
    return marker;
  }
  
  /**
   * Creates a new widget
   */
  _makeWidget(editor, location) {
    throw Error("Annotation should not be used directly");
  }
  
  /**
   * Force the indent to be synced between marker and widget
   */
  syncIndentation() {
    this._widget.indentation = this.location.from.ch;
  }
  
  /**
   * Return the current value of the annotation
   */
  get value() {
    return this._widget._value;
  }
  
  /**
   * Sets the value and updates the widget
   */
  set value(value) {
    this._widget.value = value;
  }
  
  /**
   * Returns the current location of the corresponding marker
   */
  get location() {
    return this._marker.find();
  }
  
  /**
   * Returns the current location of the corresponding marker in key location
   */
  get locationAsKey() {
    return LocationConverter.markerToKey(this.location);
  }
  
  /**
   * Return the kind of widget
   */
  get kind() {
    return this.__proto__.constructor.name.toLowerCase();
  }
  
  /**
   * Returns a serialized version of this annotation
   */
  serialize() {
    throw Error("Annotation should not be used directly");
  }
}