import Morph from 'src/components/widgets/lively-morph.js';

/*MD 
## Combobox Widget
  <edit://test/templates/input-combobox-test.js>

MD*/

export default class InputCombobox extends Morph {
  
  get input() {
    return this.get("#input")
  }
  
  initialize() { 
    lively.html.registerAttributeObservers(this)  
    
    this.input.addEventListener("change", evt => {
      // lively.notify('change')
      this.setAttribute("value",  this.input.value )  
      this.dispatchEvent(new Event("change"))
    })

    this.setupAutocomplete()
  }
  
  setupAutocomplete() {
    let fromCompletion = false

    this.input.onkeydown = evt => {
      // lively.notify(evt.key)
      // lively.notify(fromCompletion, 'fromCompletion')
      if (evt.key === 'Backspace') {
        const valueLength = this.input.value.length;
        const selectionStart = this.input.selectionStart;
        const selectionEnd = this.input.selectionEnd;
        const hasSelection = selectionEnd !== selectionStart;
        const hasSelectionAtEnd = selectionEnd === valueLength

        if (hasSelection && hasSelectionAtEnd && fromCompletion) {
          const value = this.input.value;
          this.input.value = value.slice(0, selectionStart) + value.slice(selectionEnd);
          this.input.setSelectionRange(selectionStart, selectionStart);
          this.input.focus();
        }
      }
    }

    this.input.oninput = evt => {
      fromCompletion = false
      // lively.notify(evt.inputType)

      // that = evt
      // lively.openInspector(evt)

      const inputValue = this.input.value.toLowerCase();
      const cursorPosition = this.input.selectionStart;
      const match = this.suggestionsAsStrings.find(item => item.startsWith(inputValue));

      const inputType = evt.inputType;
      if (['format', 'delete', 'history'].some(match => inputType.startsWith(match))) {
        return true;
      }

      if (inputType.startsWith('insert')) {
        // return true;
      }

      if (match && inputValue !== match) {
        if (cursorPosition === inputValue.length) {
          fromCompletion = true
          this.input.value = match;
          this.input.setSelectionRange(inputValue.length, match.length);
        }
      }
    }
  }

  get suggestionsAsStrings() {
    return [...this.get("#options").children || []].map(option => option.getAttribute('value'))
  }

  focus() {
    this.input.focus();
  }

  get value() {
    return this.getAttribute("value")
  }
  
  set value(s) {
    this.setAttribute("value", s)
    this.updateView()  
  }
  
  onValueChanged() {
    this.updateView()  
  }

  updateView() {
    var newValue = this.getAttribute("value")  
    if (this.input.value != newValue) {
      this.input.value = newValue
    }
  }
  
  setOptions(list) {
    var optionsElement = this.get("#options")
    optionsElement.innerHTML = ""
    for(var ea of list) {
      if (ea.value && ea.string) {
        optionsElement.appendChild(<option value={ea.value}>{ea.string}</option>)
      } else {
        optionsElement.appendChild(<option value={ea}>{ea}</option>)
      }
    }
    optionsElement.value = ""
  }
  
  
  async livelyExample() {
    this.setOptions(["Apple", "Babanna", "Oranges"])
    
    
  }
  
  
}