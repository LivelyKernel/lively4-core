import InputWidget from "./input-widget.js";
import { DeleteButton } from "./buttons.js";
import { guid } from "../utils/defaults.js";


export default class InstanceWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    
    this._id = guid();
    
    this._element.textContent = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._makeNameElement();
    this._makeInputElement();
  }
  
  _makeNameElement() {
    this._nameElement = <input
                          type="text"
                          class="instance-name space-before"
                          size="4"
                          placeholder="name"
                          value=""></input>

    this._nameElement.addEventListener("input", () => {
      this._nameElement.setAttribute(
        "size", 
        this._nameElement.value.length ? this._nameElement.value.length : 4
      );
    });
    this._nameElement.addEventListener("change", () => {
      this._changeCallback(this._id);
    });
    
    this._element.appendChild(this._nameElement);
  }
  
  _makeInputElement() {
    this._input = <input
                    class="space-before"
                    type="text"
                    size="4"
                    value=""
                    placeholder="init"></input>

    this._input.addEventListener("input", () => {
      this._input.setAttribute("size", this._input.value.length ? this._input.value.length : 4);
    });
    this._input.addEventListener("change", () => {
      this._changeCallback();
    });
    
    this._element.appendChild(this._input);
  }
  
  get id() {
    return this._id;
  }
  
  set id(id) {
    this._id = id;
  }
  
  get code() {
    return this._input.value;
  }
  
  set code(code) {
    this._input.value = code;
    this._input.dispatchEvent(new Event("input"));
  }
  
  get name() {
    if(this._nameElement) {
      return this._nameElement.value;
    } else {
      return "";
    }
  }
    
  set name(name) {
    this._nameElement.value = name;
    this._nameElement.dispatchEvent(new Event("input"));
  }
}

InstanceWidget.idCounter = 1;
const nextId = () => InstanceWidget.idCounter++;
