import LocationConverter from "../utils/location-converter.js";


export default class Annotation {
  constructor(editor, location) {
    this._marker = this._makeMarker(editor, location);
    this._widget = null;
  }
  
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
  
  _makeWidget(editor, location) {
    throw new Error("Annotation should not be used directly");
  }

  syncIndentation() {
    this._widget.indentation = this.location.from.ch;
  }
  
  get location() {
    return this._marker.find();
  }
  
  get locationAsKey() {
    return LocationConverter.markerToKey(this.location);
  }

  get kind() {
    return this.__proto__.constructor.name.toLowerCase();
  }
  
  serializeForWorker() {
    throw new Error("Annotation should not be used directly")
  }
  
  serializeForSave() {
    throw new Error("Annotation should not be used directly")
  }
}