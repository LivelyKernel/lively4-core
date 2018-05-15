import InputWidget from "./input-widget.js";
import { DeleteButton } from "./buttons.js";


export default class ReplacementWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    
    // Make input
    this._input = <input
                    class="space-before"
                    type="text"
                    size="1"
                    value=""></input>

    this._input.addEventListener("input", () => {
      this._input.setAttribute("size", this._input.value.length ? this._input.value.length : 1);
    });
    this._input.addEventListener("change", () => {
      this._changeCallback();
    });
    
    this._element.textContent = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._element.appendChild(this._input);
  }
  
  get code() {
    return this._input.value;
  }
  
  set code(code) {
    this._input.value = code;
    this._input.dispatchEvent(new Event("input"));
  }
}
