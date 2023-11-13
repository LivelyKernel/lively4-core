import InputWidget from "./input-widget.js";
import { DeleteButton } from "./buttons.js";
import { defaultExample } from "../utils/defaults.js";
import BabylonianManager from "../worker/babylonian-manager.js";


export default class SliderWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._maxValues = new Map() // Map(exampleId, maxValue)
    this._elements = new Map() // Map(exampleId, {element, input})
    this._fireFunctions = new Map(); // Map(exampleId, function)
  }
  
  get maxValues() {
    return this._maxValues;
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
                      class="slider-input space-after"
                    ></input>;

      const status = <span class="status"></span>;

      const fireFunction = () => {
        const value = input.valueAsNumber;
        status.textContent = statusString(value, this._maxValues.get(example.id));
        this._changeCallback(example.id, value - 1);
      };
      this._fireFunctions.set(example.id, fireFunction);
      input.addEventListener("input", fireFunction);
      
      let exampleName = "";
      if(example.id !== defaultExample().id) {
        exampleName = <span
          class="example-name space-after"
          style={"background-color:" + example.color}>
          {example.name.value.length ? example.name.value : "\u00A0"}
        </span>;
      }
      
      return {
        element: (
          <tr class="widget-line">
            <td class="probe-meta">
              <span class="left-space space-after"></span>
            </td>
            <td class="probe-example">
              {exampleName}
              {input}
              {status}
            </td>
          </tr>),
        input: input,
        nameElement: exampleName,
        status: status
      };
    };
    
    // Gets a dom element for a single example
    const elementForExample = (example) => {
      // example: {id, name, color}
      if(!this._elements.has(example.id)) {
        this._elements.set(example.id, makeElementForExample(example));
      }
      
      const element = this._elements.get(example.id);
      if(element.nameElement instanceof HTMLElement) {
        element.nameElement.style.backgroundColor = example.color;
      }
      
      return element;
    }
    
    // Updates the element for a given example
    const updateElementForExample = (example, index) => {
      const element = elementForExample(example);
      const newMax = this._maxValues.get(example.id);
      if(newMax < element.input.valueAsNumber) {
        element.input.valueAsNumber = newMax;
        this._fireFunctions.get(example.id)();
      }
      element.input.setAttribute("max", newMax);
      element.status.textContent = statusString(element.input.valueAsNumber, newMax);
      
      // Show a delete button for the first element, and just a space for all others
      let leftSpace = <span></span>;
      if(index === 0) {
        leftSpace = DeleteButton(this._deleteCallback);
      }
      const leftSpaceContainer = element.element.querySelector(".left-space");
      leftSpaceContainer.innerHTML = "";
      leftSpaceContainer.appendChild(leftSpace);
      
      this._table.appendChild(element.element);
    };
    
    this._element.textContent = "";
    this._table = <table></table>;
    this._element.appendChild(this._table);
    
    // Generate UI for all examples
    let examples = Array.from(BabylonianManager.activeExamples);
    examples.filter((e) => this._maxValues.has(e.id))
            .forEach(updateElementForExample);
    
    // Hide if empty
    if(this._maxValues.size === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
  
  fire() {
    Array.from(BabylonianManager.activeExamples).forEach((e) => {
      const fireFunction = this._fireFunctions.get(e.id);
      if(typeof fireFunction === "function") {
        fireFunction();
      }
    });
  }
}
