import FormWidget from "./form-widget.js";
import { DeleteButton } from "./buttons.js";


export default class InstanceWidget extends FormWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
  }
  
  // UI Generators
  
  _getNameElement() {
    return super._getNameElement("space-before");
  }
  
  _update() {
    this._element.textContent = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._element.appendChild(this._getNameElement().element);
    this._keys.forEach((key) => {
      this._element.appendChild(this._getFormElementForKey(key).element);
    });
  }
  
}
