import Widget from "./widget.js";

export default class InputWidget extends Widget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, deleteCallback);
    this._changeCallback = changeCallback
  }
}