import Widget from "./widget.js";

/**
 * The base class for widgets that get user input
 */
export default class InputWidget extends Widget {
  constructor(editor, location, kind, changeCallback) {
    super(editor, location, kind);
    this._changeCallback = changeCallback
  }
}