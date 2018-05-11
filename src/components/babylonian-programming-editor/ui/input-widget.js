import Widget from "./widget.js";

export default class InputWidget extends Widget {
  constructor(editor, location, kind, changeCallback) {
    super(editor, location, kind);
    this._changeCallback = changeCallback
  }
}