/**
 * The base class for widgets
 */
export default class Widget {
  constructor(editor, location, kind) {
    this._element = <span class={"widget " + kind}></span>;
    this._lineWidget = editor.addLineWidget(location.to.line, this._element);
    this._value = null;
    this.indentation = location.from.ch;
  }
  
  /**
   * Removes the widget from its editor
   */
  clear() {
    this._widget.clear();
  }
  
  /**
   * Sets the widget's value
   */
  set value(value) {
    this._value = value;
    this._update();
  }
  
  /**
   * Sets the widget's indentation
   */
   set indentation(indentation) {
     this._element.style.left = `${indentation}ch`;
   }
  
  /**
   * Updates the Widget's UI
   */
  _update() {
    throw new Error("Widget should not be used directly");
  }
}