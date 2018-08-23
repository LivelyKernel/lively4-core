import LocationConverter from "../utils/location-converter.js";


export default class Annotation {
  constructor(editor, location, deleteCallback) {
    this._marker = this._makeMarker(editor, location);
    this._widget = null;
    this._deleteCallback = () => {
      deleteCallback(this);
    };
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
    if(this.location) {
      this._widget.indentation = this.location.from.ch;
    }
  }
  
  clear() {
    if(this._marker) {
      this._marker.clear();
    }
    if(this._widget) {
      this._widget.clear();
    }
  }
  
  get location() {
    return this._marker.find();
  }
  
  get locationAsKey() {
    if(this.location) {
      return LocationConverter.markerToKey(this.location);
    }
  }

  get kind() {
    return this.__proto__.constructor.name.toLowerCase();
  }
  
  _serialize() {
    return {
      kind: this.kind,
      location: this.locationAsKey
    };
  }
  
  serializeForSave() {
    return this._serialize();
  }
  
  serializeForWorker() {
    return this._serialize();
  }
  
  load(serialized) {
    throw new Error("Annotation should not be used directly");
  }
}