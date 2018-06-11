import FormWidget from "./form-widget.js";
import {
  DeleteButton,
  ExpandButton,
  PrePostscriptButton,
} from "./buttons.js";


export default class InstanceWidget extends FormWidget {
  constructor(editor, location, kind, instances, customInstances, changeCallback, deleteCallback) {
    super(editor, location, kind, instances, customInstances, changeCallback, deleteCallback);
  }
  
  // UI Generators
  
  _getNameElement() {
    return super._getNameElement("example-name space-before");
  }
  
  _addButtonElement() {
    const buttonElement = <span class="buttons"></span>;
    buttonElement.appendChild(DeleteButton(this._deleteCallback));
    buttonElement.appendChild(ExpandButton(this._onExpandClicked.bind(this)));
    this._element.appendChild(buttonElement);
  }
  
  _update() {
    this._element.innerHTML = "";
    this._addButtonElement();
    this._element.appendChild(this._getNameElement().element);
    this._addFormElements();
  }
}
