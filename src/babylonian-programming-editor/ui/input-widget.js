import Widget from "./widget.js";
import { guid } from "../utils/defaults.js";

export default class InputWidget extends Widget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, deleteCallback);
    this._id = guid();
    this._changeCallback = changeCallback;
  }
  
  get id() {
    return this._id;
  }
  
  set id(id) {
    this._id = id;
  }
}