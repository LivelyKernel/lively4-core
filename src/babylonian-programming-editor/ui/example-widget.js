import FormWidget from "./form-widget.js";
import InputField from "./input-field.js";
import {
  DeleteButton,
  SwitchButton,
  ExpandButton,
  ErrorButton,
  PrePostscriptButton,
} from "./buttons.js";
import { defaultInstance } from "../utils/defaults.js";


export default class ExampleWidget extends FormWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback, stateCallback, defaultIsOn, instances, customInstances) {
    super(editor, location, kind, instances, customInstances, changeCallback, deleteCallback);
    this._isOn = defaultIsOn;
    this._color = randomColor();
    this._stateCallback = stateCallback;
    this._instanceElement = null; // {element, input}
    this._error = null;
    this._update();
  }
  
  // UI Generators
  
  _getNameElement() {
    return super._getNameElement("example-name space-before", `background-color: ${this._isOn ? this._color : "lightgray"}`);
  }
  
  _getAdditionalFormElements() {
    if(!this._instanceElement) {
      this._instanceElement = new InputField(this, "this", "null", this._onSelectChanged.bind(this));
    }
    this._instanceElement.options = this._getOptions();
    return [
      {
        element:<span class="space-before">this: {this._instanceElement.element}</span>
      }
    ];
  }
  
  _addButtonElement() {
    const buttonElement = <span class="buttons"></span>;
    buttonElement.appendChild(DeleteButton(this._deleteCallback));
    buttonElement.appendChild(SwitchButton(this._onSwitchClicked.bind(this),
                                           this._isOn));
    buttonElement.appendChild(PrePostscriptButton(
      this._onPrePostscriptClicked.bind(this),
      this._prescript.length || this._postscript.length
    ));
    buttonElement.appendChild(ExpandButton(this._onExpandClicked.bind(this)));
    if(this._error) {
      buttonElement.appendChild(ErrorButton(this._error));
    }
    this._element.appendChild(buttonElement);
  }
  
  _update() {
    this._element.innerHTML = "";
    this._addButtonElement();
    this._element.appendChild(this._getNameElement().element);
    this._addFormElements();
  }
                                           
  _onSwitchClicked() {
    this._isOn = !this._isOn;
    
    // just debug feedback, because it often does not work the first time...
    var color = this._isOn ? "green" : "red"
    this._element.animate([
       { background: getComputedStyle(this._element).background,  }, 
       { background: color,   }, 
       { background: getComputedStyle(this._element).background, }], 
      {
        duration: 500
      });
    
    
    this._stateCallback(this._isOn);
  }
  
  _onSelectChanged() {
    this._changeCallback(this._id);
  }
  
  // Getters and Setters
  
  get instanceId() {
    return this._instanceElement.value
  }
  
  set instanceId(instanceId) {
    this._instanceElement.value = instanceId;
  }
  
  get color() {
    return this._color;
  }
  
  set color(color) {
    if(color) {
      this._color = color;
    }
  }
  
  set error(error) {
    this._error = error;
  }
}

const randomColor = () => {
  const hue = Math.round(Math.random() * 36) * 10;
  return `hsl(${hue}, 30%, 70%)`;
}
