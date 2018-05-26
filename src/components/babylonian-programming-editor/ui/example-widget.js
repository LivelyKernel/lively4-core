import FormWidget from "./form-widget.js";
import { DeleteButton, SwitchButton } from "./buttons.js";
import { defaultInstance } from "../utils/defaults.js";


export default class ExampleWidget extends FormWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback, stateCallback, defaultIsOn, instances) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._isOn = defaultIsOn;
    this._updateColor();
    this._stateCallback = stateCallback;
    this._instances = instances; // [Instance]
    this._instanceElement = null; // {element, input}
    this._errorElement = <span class="error"></span>;
    this._update();
  }
  
  // UI Generators
  
  _getNameElement() {
    return super._getNameElement("example-name space-before", `background-color: ${this._color}`);
  }
  
  _getInstanceElement() {
    if(!this._instanceElement) {
      const input = <select></select>;

      input.addEventListener("change", () => {
        this._changeCallback(this._id);
      });

      this._instanceElement = {
        element: <span>
            this: {input}
          </span>,
        input: input
      };
    }
    
    const input = this._instanceElement.input;
    let oldValue = 0;
    if(input.options.length) {
      oldValue = input.options[input.selectedIndex].value;
    }
    let newIndex = 0;
    input.innerHTML = "";
    [defaultInstance()].concat(this._instances).map((instance, index) => {
      input.appendChild(<option value={instance.id}>{instance.name}</option>)
      if(instance.id === oldValue) {
        newIndex = index;
      }
    });
    input.selectedIndex = newIndex;

    return this._instanceElement;
  }
  
  _update() {
    this._element.textContent = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._element.appendChild(SwitchButton(this._onSwitchClicked.bind(this),
                                           this._isOn));
    this._element.appendChild(this._getNameElement().element);
    this._element.appendChild(this._getInstanceElement().element);
    this._keys.forEach((key) => {
      this._element.appendChild(this._getFormElementForKey(key).element);
    })
    this._element.appendChild(this._errorElement);
  }
                                           
  _onSwitchClicked() {
    this._isOn = !this._isOn;
    this._updateColor();
    this._stateCallback(this._isOn);
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
    return this._instanceElement.input.options[this._instanceElement.input.selectedIndex].value;
  }
  
  set instanceId(instanceId) {
    [defaultInstance()].concat(this._instances).map((instance, index) => {
      if(instance.id === instanceId) {
        this._instanceElement.input.selectedIndex = index;
      }
    });
  }
  
  get color() {
    return this._color;
  }
  
  set error(error) {
    if(error && error.length) {
      this._errorElement.textContent = `Error: ${error}`;
    } else {
      this._errorElement.textContent = "";
    }
  }
}

ExampleWidget.hue = 0
const nextColor = () => {
  const color = `hsl(${ExampleWidget.hue}, 30%, 70%)`;
  ExampleWidget.hue = (ExampleWidget.hue + 60) % 360;
  return color;
}
