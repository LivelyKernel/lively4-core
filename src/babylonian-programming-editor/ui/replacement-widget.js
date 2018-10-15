import InputWidget from "./input-widget.js";
import InputField from "./input-field.js";
import { DeleteButton } from "./buttons.js";


export default class ReplacementWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    
    // Make input
    this._input = new InputField(this,
                                 "value",
                                 "replacement",
                                 this._changeCallback,
                                 "space-before");
    
    this._element.innerHTML = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._element.appendChild(this._input.element);
  }
  
  get value() {
    return this._input.value;
  }
  
  set value(value) {
    this._input.value = value;
  }
}
