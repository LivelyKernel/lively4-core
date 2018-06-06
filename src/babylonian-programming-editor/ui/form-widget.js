import InputWidget from "./input-widget.js";
import InputField from "./input-field.js";
import { abstract } from "../utils/defaults.js";

export default class FormWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._keys = []; // [key]
    this._nameElement = null; // InputField
    this._elements = new Map(); // Map(key, {element, input})
    
    this._prescript = ""
    this._postscript = ""
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
      element: <span class="space-before">
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
    
   this._nameElement.style.cssText = style;

    return this._nameElement;
  }
  
  _getAdditionalFormElements() {
    return [];
  }
  
  _addFormElements() {
    const form = <div class="form"></div>;
    this._element.appendChild(form);
    
    const elementsToAdd = [];
    this._getAdditionalFormElements().forEach(e => elementsToAdd.push(e.element));
    this._keys.forEach(key => elementsToAdd.push(this._getFormElementForKey(key).element));
    
    while(elementsToAdd.length) {
      form.appendChild(elementsToAdd.shift());
    }
  }
  
  _update() {
    abstract();
  }
  
  _onExpandClicked() {
    this._element.classList.toggle("expanded");
  }
  
  async _onPrePostscriptClicked() {
    let comp = await lively.openComponentInWindow("pre-post-script-editor");
    comp.setup(this.name, this.keys, this.prescript, this.postscript, (value) => {
      this._prescript = value.prescript;
      this._postscript = value.postscript;
      this._changeCallback();
    });
  }
  
  // Getters and Setters
  
  get code() {
    abstract();
  }
  
  get keys() {
    return this._keys;
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
  
  get prescript() {
    return this._prescript;
  }
  
  set prescript(prescript) {
    this._prescript = prescript ? prescript : "";
  }
  
  get postscript() {
    return this._postscript;
  }
  
  set postscript(postscript) {
    this._postscript = postscript ? postscript : "";
  }
  
  get values() {
    return this._keys.reduce((acc, k) => {
      acc[k] = this._elements.get(k).input.value;
      return acc;
    }, {});
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
