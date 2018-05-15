import Annotation from "./annotation.js";

/**
 * The base class for all annotations that get user input
 */
export default class InputAnnotation extends Annotation {
  constructor(editor, location, changeCallback, examples, deleteCallback) {
    super(editor, location, deleteCallback);
    this._changeCallback = (exampleId, newValue) => {
      changeCallback(this, exampleId, newValue);
    };
    this._widget = this._makeWidget(editor, location, examples);
  }
}