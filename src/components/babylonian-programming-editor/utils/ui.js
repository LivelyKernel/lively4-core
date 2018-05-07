/**
 * Adds a new marker to the editor
 */
export const addMarker = (editor, loc, classNames) => {
  const marker = editor.markText(
    loc.from,
    loc.to,
    {
      className: `marker ${classNames.join(" ")}`,
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
  constructor(editor, line, kind) {
    this._indent = 0;
    
    this._element = document.createElement("span");
    this._element.classList.add("line-widget");
    this._element.classList.add(kind);
    
    this._widget = editor.addLineWidget(line, this._element);
  }
}

/**
 * An Annotation shows values for probes
 */
export class Annotation extends LineWidget {
  constructor(editor, line, kind) {
    super(editor, line, kind);
    this._values = []

    this._updateElement();
  }
  
  update(values, indent) {
    this._values = values;
    this._indent = indent;
    this._updateElement();
  }
  
  _updateElement() {
    const valuesString = this._values.length ? this._values.map((e)=>e[1]).join(" | ") : "??";
    this._element.textContent = `↘︎ ${valuesString}`;
    this._element.style.left = `${this._indent}ch`;
  }
  
  clear() {
    this._widget.clear();
  }
}

/**
 * An Input is used to enter a single value
 */
export class Input extends LineWidget {
  constructor(editor, line, kind, changeCallback) {
    super(editor, line, kind);
    this._element.textContent = "↖︎";
    
    // Make textfield
    const textfield = document.createElement("input");
    textfield.setAttribute("type", "text");
    const autoWidth = () => {
      textfield.setAttribute("size", textfield.value.length ? textfield.value.length : 1);
    };
    autoWidth();

    textfield.addEventListener("input", autoWidth);
    textfield.addEventListener("change", () => {
      changeCallback(textfield.value);
    });
    this._element.appendChild(textfield);
  }
  
  update(indent) {
    this._indent = indent;
    this._updateElement();
  }
  
  _updateElement() {
    this._element.style.left = `${this._indent}ch`;
  }
}


/**
 * A Form is used to enter keyed values
 */
let FORM_ID_COUNTER = 0;
export class Form extends LineWidget {
  constructor(editor, line, kind, keys = [], changeCallback) {
    super(editor, line, kind);
    this.changeCallback = changeCallback;
    this._keys = keys;
    this._values = {};
    
    this.update(keys, 0);
  }
  
  update(keys, indent) {
    this._keys = keys;
    this._indent = indent;
    this._updateElement();
  }
  
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
        this.changeCallback(this.valueArrayString);
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
      this._element.style.display = "hidden";
    } else {
      this._element.style.display = "";
    }
  }
  
  get valueArrayString() {
    return `[${this._keys.map(k => this._values[k]).join(",")}]`; 
  }
}

