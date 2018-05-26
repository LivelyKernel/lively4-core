import InputWidget from "./input-widget.js";
import InputField from "./input-field.js";
import {
  defaultInstance,
  guid,
  abstract
} from "../utils/defaults.js";

export default class FormWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._id = guid();
    this._keys = []; // [key]
    this._nameElement = null; // InputField
    this._elements = new Map(); // Map(key, {element, input})
  }
  
  // UI Generators
  
  _getFormElementForKey(key) {
    if(!this._elements.has(key)) {
      this._elements.set(key, this._makeFormElementForKey(key));
    }
    return this._elements.get(key);
  }
  
  _makeFormElementForKey(key) {
    // Textfield
    const input = new InputField(this, key, "null", this._changeCallback);

    // Label
    const label = <label
                    for={input.id}
                  >{key + ":"}</label>

    return {
      element: <span>
                 {label}
                 {input.element}
               </span>,
      input: input
    };
  }
  
  _getNameElement(className, style) {
    if(!this._nameElement) {
      const input =  new InputField(this,
                                    "__name",
                                    "name",
                                    this._changeCallback,
                                    className,
                                    style,
                                    false);

      this._nameElement = input;
    }

    this._nameElement.style.backgroundColor = this._color;

    return this._nameElement;
  }
  
  _update() {
    abstract();
  }
  
  // Getters and Setters
  
  get code() {
    abstract();
  }
  
  get id() {
    return this._id;
  }
  
  set id(id) {
    this._id = id;
  }
  
  set keys(keys) {
    this._keys = keys;
    this._update();
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
  }
  
  get values() {
    let result = {};
    this._keys.forEach(k => {
      result[k] = this._elements.get(k).input.valueForSave
    });
    return result;
  }
  
  set values(values) {
    this.keys = Object.keys(values);
    for(let key of this._keys) {
      this._elements.get(key).input.value = values[key];
      this._elements.get(key).input.fireChange();
    }
  }
  
  get valuesArray() {
    return this._keys.map(k => this._elements.get(k).input.value);
  }
  
}

FormWidget.idCounter = 1;
const nextId = () => FormWidget.idCounter++;