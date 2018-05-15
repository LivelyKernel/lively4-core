import InputAnnotation from "./input-annotation.js";
import ExampleWidget from "../ui/example-widget.js";


export default class Example extends InputAnnotation {
  constructor(editor, location, changeCallback, deleteCallback) {
    super(editor, location, changeCallback, null, deleteCallback);
  }
  
  _makeWidget(editor, location) {
    return new ExampleWidget(editor, location, this.kind, this._changeCallback, this._deleteCallback);
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
      name: this.name,
      values: this._widget.values
    };
  }
  
  load(serialized) {
    this._widget.values = serialized.values;
    this._widget.name = serialized.name;
  }
}