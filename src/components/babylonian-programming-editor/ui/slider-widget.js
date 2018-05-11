import InputWidget from "./input-widget.js";
import { defaultExample } from "../utils/defaults.js";


export default class SliderWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, examples) {
    super(editor, location, kind, changeCallback);
    this._examples = examples; // [{id, name, color}]
    this._maxValues = new Map() // Map(exampleId, maxValue)
    this._elements = new Map() // Map(exampleId, {element, input})
    this._fireFunctions = new Map(); // Map(exampleId, function)
  }
  
  set maxValues(maxValues) {
    this._maxValues = maxValues;
    this._update();
  }
  
  _update() {
    // Generates the status string
    const statusString = (value, maxValue) => {
      if(value === 0) {
        return `all ${maxValue}`;
      } else {
        return `${value} of ${maxValue}`;
      }
    }
    
    // Creates a single element
    const makeElementForExample = (example) => {
      const input = <input
                      type="range"
                      min="0"
                      max="0"
                      value="0"
                      style="width: 200px"
                    ></input>;

      const status = <span></span>;

      const fireFunction = () => {
        const value = input.valueAsNumber;
        status.textContent = statusString(value, this._maxValues.get(example.id));
        this._changeCallback(example.id, value - 1);
      };
      this._fireFunctions.set(example.id, fireFunction);
      input.addEventListener("input", fireFunction);

      return {
        element: (
          <span class="widget-line">
            ↻
            <span
              class="example-name"
              style={"background-color:" + example.color}>
              {example.name.length ? example.name : "\u00A0"}
            </span>
            {input}
            {status}
          </span>),
        input: input,
        status: status
      };
    };
    
    // Gets a dom element for a single example
    const elementForExample = (example) => {
      // example: {id, name, color}
      if(!this._elements.has(example.id)) {
        this._elements.set(example.id, makeElementForExample(example));
      }
      return this._elements.get(example.id);
    }
    
    // Updates the element for a given example
    const updateElementForExample = (example) => {
      const element = elementForExample(example);
      const newMax = this._maxValues.get(example.id);
      if(newMax < element.input.valueAsNumber) {
        element.input.valueAsNumber = newMax;
        this._fireFunctions.get(example.id)();
      }
      element.input.setAttribute("max", newMax);
      element.status.textContent = statusString(element.input.valueAsNumber, newMax);
      this._element.appendChild(element.element);
    };
    
    this._element.textContent = "";
    this._examples
        .filter((e) => this._maxValues.has(e.id))
        .forEach(updateElementForExample);
    if(this._maxValues.has(defaultExample().id)) {
      updateElementForExample(defaultExample());
    }
    
    // Hide if empty
    if(this._maxValues.size === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
  
  fire() {
    this._examples.forEach((e) => this._fireFunctions.get(e.id)());
  }
}
