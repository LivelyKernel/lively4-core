import FormWidget from "./form-widget.js";
import SelectField from "./select-field.js";
import {
  DeleteButton,
  SwitchButton,
  ExpandButton,
  ErrorButton,
} from "./buttons.js";
import { defaultInstance } from "../utils/defaults.js";


export default class ExampleWidget extends FormWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback, stateCallback, defaultIsOn, instances) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._isOn = defaultIsOn;
    this._updateColor();
    this._stateCallback = stateCallback;
    this._instances = instances; // [Instance]
    this._instanceElement = null; // {element, input}
    this._error = null;
    this._update();
  }
  
  // UI Generators
  
  _getNameElement() {
    return super._getNameElement("example-name space-before", `background-color: ${this._color}`);
  }
  
  _getAdditionalFormElements() {
    if(!this._instanceElement) {
      this._instanceElement = new SelectField(this, "this", this._onSelectChanged.bind(this));
    }
    this._instanceElement.options = [defaultInstance()].concat(this._instances);
    return [
      {
        element:<span class="space-before">this: {this._instanceElement.element}</span>
      }
    ];
  }
  
  _update() {
    this._element.innerHTML = "";
    const buttonElement = <span class="buttons"></span>;
    buttonElement.appendChild(DeleteButton(this._deleteCallback));
    buttonElement.appendChild(SwitchButton(this._onSwitchClicked.bind(this),
                                           this._isOn));
    buttonElement.appendChild(ExpandButton(this._onExpandClicked.bind(this)));
    if(this._error) {
      buttonElement.appendChild(ErrorButton(this._error));
    }
    this._element.appendChild(buttonElement);
    this._element.appendChild(this._getNameElement().element);
    this._addFormElements();
  }
                                           
  _onSwitchClicked() {
    this._isOn = !this._isOn;
    this._updateColor();
    this._stateCallback(this._isOn);
  }
  
  _onSelectChanged() {
    this._changeCallback(this._id);
  }
  
  _updateColor() {
    if(this._isOn) {
      this._color = nextColor();
    } else {
      this._color = "lightgray";
    }
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
  
  set error(error) {
    this._error = error;
  }
}

ExampleWidget.hue = 0
const nextColor = () => {
  const color = `hsl(${ExampleWidget.hue}, 30%, 70%)`;
  ExampleWidget.hue = (ExampleWidget.hue + 60) % 360;
  return color;
}
