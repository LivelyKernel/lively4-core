export default class Widget {
  constructor(editor, location, kind) {
    this._element = <span class={"widget " + kind}></span>;
    this._lineWidget = editor.addLineWidget(location.to.line, this._element);
    this.indentation = location.from.ch;
  }
  
  clear() {
    this._widget.clear();
  }

  set indentation(indentation) {
    this._element.style.left = `${indentation}ch`;
  }
  
  _update() {
    throw new Error("Widget should not be used directly");
  }
}