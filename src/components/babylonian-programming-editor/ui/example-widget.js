import InputWidget from "./input-widget.js";


export default class ExampleWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback) {
    super(editor, location, kind, changeCallback);
    this._id = nextId();
    this._color = nextColor();
    this._keys = [] // [key]
    this._nameElement = null; // {element, input}
    this._elements = new Map() // Map(key, {element, input})
    this._fireFunctions = new Map(); // Map(exampleId, function)
  }
  
  set keys(keys) {
    this._keys = keys;
    this._update();
  }
  
  _update() {
    const elementForKey = (key) => {
      if(!this._elements.has(key)) {
        this._elements.set(key, makeElementForKey(key));
      }
      return this._elements.get(key);
    }
    
    // Creates a single form element
    const makeElementForKey = (key) => {
      const fieldId = `form-${this._id}-${key}`;

      // Textfield
      const input = <input
                      type="text"
                      id={fieldId}
                      name={key}
                      size="1"
                      value=""></input>

      input.addEventListener("input", () => {
        input.setAttribute("size", input.value.length ? input.value.length : 1);
      });
      input.addEventListener("change", () => {
        this._changeCallback(this._id);
      });
      
      // Label
      const label = <label
                      for={fieldId}
                    >{key + ":"}</label>

      return {
        element: <span>
                   {label}
                   {input}
                 </span>,
        input: input
      };
    };
    
    // Create a field for the example name
    const nameElement = () => {
      if(!this._nameElement) {
        const input = <input
                        type="text"
                        id={`form-${this._id}-__name`}
                        class="example-name"
                        style={"background-color:"+this._color}
                        name="__name"
                        size="4"
                        placeholder="name"
                        value=""></input>
        
        input.addEventListener("input", () => {
          input.setAttribute("size", input.value.length ? input.value.length : 1);
        });
        input.addEventListener("change", () => {
          this._changeCallback(this._id);
        });
              
        this._nameElement = {
          element: (
            <span>↖︎ 
              {input}
            </span>),
          input: input
        };
      }
      return this._nameElement;
    }
    
    this._element.textContent = "";
    this._element.appendChild(nameElement().element);
    this._keys.forEach((key) => {
      this._element.appendChild(elementForKey(key).element);
    })
  }
  
  fire() {
    this._examples.forEach((e) => this._fireFunctions.get(e.id)());
  }
  
  get code() {
    return `[${this._keys.map(k => this._elements.get(k).input.value)
                         .join(",")}]`;
  }
  
  get name() {
    if(this._nameElement) {
      return this._nameElement.input.value;
    } else {
      return "";
    }
  }
}

ExampleWidget.idCounter = 1;
const nextId = () => ExampleWidget.idCounter++;

ExampleWidget.hue = 0
const nextColor = () => {
  const color = `hsl(${ExampleWidget.hue}, 30%, 60%)`;
  ExampleWidget.hue = (ExampleWidget.hue + 60) % 360;
  return color;
}
