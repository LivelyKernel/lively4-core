import InputAnnotation from "./input-annotation.js";
import ExampleWidget from "../ui/example-widget.js";


export default class Example extends InputAnnotation {
  constructor(editor, location, changeCallback) {
    super(editor, location, changeCallback);
  }
  
  _makeWidget(editor, location) {
    return new ExampleWidget(editor, location, this.kind, this._changeCallback);
  }
  
  fire() {
    this._widget.fire();
  }
  
  get id() {
    return this._widget._id;
  }
  
  get name() {
    return this._widget.name;
  }
  
  get color() {
    return this._widget._color;
  }
  
  set keys(keys) {
    this._widget.keys = keys;
  }
  
  serializeForWorker() {
    return {
      location: this.locationAsKey,
      id: this.id,
      code: this._widget.code
    };
  }
  
  serializeForSave() {
    return {
      location: this.locationAsKey,
    };
  }
}