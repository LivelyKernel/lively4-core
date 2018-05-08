/**
 * Adds a new marker to the editor
 */
export const addMarker = (editor, loc, className = "") => {
  const marker = editor.markText(
    loc.from,
    loc.to,
    {
      className: `marker ${className}`,
      startStyle: "start",
      endStyle: "end",
      inclusiveLeft: true,
      inclusiveRight: true
    }
  );
  marker._babylonian = true;
  return marker;
}

/**
 * The base class for LineWidgets
 */
class LineWidget {
  constructor(editor, loc, kind) {
    this._indent = loc.to.ch;
    this._element = <span class={"line-widget " + kind}></span>;
    this._widget = editor.addLineWidget(loc.to.line, this._element);
  }
  
  /**
   * Removes the Widget from it's editor
   */
  clear() {
    this._widget.clear();
  }
}

/**
 * An Annotation shows values for probes
 */
export class Annotation extends LineWidget {
  constructor(editor, loc, kind) {
    super(editor, loc, kind);
    this._values = null;
    this._activeRun = null;
    this._updateElement();
  }
  
  /**
   * Updates the annotation's values and indent
   */
  update(values, indent) {
    this._values = values;
    this._indent = indent;
    this._updateElement();
  }
  
  /**
   * Sets the displayed run (loops)
   */
  setActiveRun(activeRun) {
    this._activeRun = activeRun;
    this._updateElement();
  }
  
  /**
   * Updates the internal DOM element
   */
  _updateElement() {
    let valueString = "??";
    if(this._values) {
      if(this._activeRun !== null) {
        valueString = this._values.get(this._activeRun)[1];
      } else {
        valueString = Array.from(this._values)
                           .map(([,v]) => v[1])
                           .join(" | ");
      }
    }

    this._element.textContent = `↘︎ ${valueString}`;
    this._element.style.left = `${this._indent}ch`;
  }
}

/**
 * An Input is used to enter a single value
 */
export class Input extends LineWidget {
  constructor(editor, loc, kind, changeCallback) {
    super(editor, loc, kind);
    this._element.textContent = "↖︎";
    
    // Prepare values for input
    
    
    // Make input textfield
    const input = <input type="text" size="1"></input>;
    input.addEventListener("input", this._onChange);
    input.addEventListener("change", () => {
      changeCallback(input.value);
    });
    this._element.appendChild(input);
  }
  
  /**
   * Updates the inputs's indent
   */
  update(indent) {
    this._indent = indent;
    this._updateElement();
  }
  
  /**
   * Updates the internal DOM element
   */
  _updateElement() {
    this._element.style.left = `${this._indent}ch`;
  }
  
  /**
   * Called when the input's value changes
   * "this" refers to the DOM element
   */
  _onChange() {
    this.setAttribute("size", this.value.length ? this.value.length : 1);
  }
}


/**
 * A Form is used to enter keyed values
 */
let FORM_ID_COUNTER = 0;
export class Form extends LineWidget {
  constructor(editor, loc, kind, keys = [], changeCallback) {
    super(editor, loc, kind);
    this._changeCallback = changeCallback;
    this._keys = keys;
    this._values = {};
    
    this.update(keys, 0);
  }
  
  /**
   * Updates the inputs's keys and indent
   */
  update(keys, indent) {
    this._keys = keys;
    this._indent = indent;
    this._updateElement();
  }
  
  /**
   * Updates the internal DOM element
   */
  _updateElement() {
    // Adds a single field to the element
    const addField = (name = "") => {
      const id = FORM_ID_COUNTER++;
      
      // Label
      const label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = `${name}: `;
      this._element.appendChild(label);
      
      // Textfield
      const textfield = document.createElement("input");
      textfield.setAttribute("id", id);
      textfield.setAttribute("type", "text");
      if(name.length) {
        textfield.setAttribute("name", name);
      }
      
      if(this._values[name]) {
        textfield.setAttribute("value", this._values[name]);
      }
      
      const autoWidth = () => {
        textfield.setAttribute("size", textfield.value.length ? textfield.value.length : 1);
      };
      autoWidth();
      
      textfield.addEventListener("input", autoWidth);
      textfield.addEventListener("change", () => {
        this._values[name] = textfield.value;
        this._changeCallback(this.valueArrayString);
      });
      this._element.appendChild(textfield);
    }
    
    // Clear the element
    this._element.textContent = "↖︎";
    
    // Generate Fields
    this._keys.forEach(addField);
    
    // Indent
    this._element.style.left = `${this._indent}ch`;
    
    // Hide empty elements
    if(!this._keys.length) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
  
  /**
   * Returns a string representation of the current form values
   */
  get valueArrayString() {
    return `[${this._keys.map(k => this._values[k]).join(",")}]`; 
  }
}

/**
 * A Slider is used to slide through a loop
 */
export class Slider extends LineWidget {
  constructor(editor, loc, kind, changeCallback) {
    super(editor, loc, kind);
    this._value = 0;
    this._maxValue = 0;
    this._element.textContent = "↻ ";
    
    // Make slider input
    this._input = <input
                    type="range"
                    min="0"
                    max={this._maxValue}
                    value={this._value}
                    style="width: 200px"
                  ></input>;
    
    this._input.addEventListener("input", () => {
      this._value = this._input.valueAsNumber;
      this._updateElement();
      changeCallback(this._value);
    });
    this._element.appendChild(this._input);
    
    // Make current value output
    this._output = <span> {this._value + 1}</span>;
    this._element.appendChild(this._output);
  }
  
  /**
   * Updates the slider's maximum value and indent
   */
  update(maxValue, indent) {
    this._maxValue = maxValue;
    if(this._value > this._maxValue) {
      this._value = this._maxValue;
    }
    this._indent = indent;
    this._updateElement();
  }
  
  /**
   * Updates the internal DOM element
   */
  _updateElement() {
    this._input.setAttribute("max", this._maxValue);
    this._output.textContent = ` ${this._value + 1}`;
    this._element.style.left = `${this._indent}ch`;
  }
}
