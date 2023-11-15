import Morph from 'src/components/widgets/lively-morph.js';

/*MD 
## Combobox Widget
  <edit://test/templates/input-combobox-test.js>

MD*/

export default class InputCombobox extends Morph {
  
  initialize() { 
    lively.html.registerAttributeObservers(this)  
    
    this.get("#input").addEventListener("change", evt => {
      this.setAttribute("value",  this.get("#input").value )  
      this.dispatchEvent(new Event("change"))
    })
  }

  focus() {
    this.get("#input").focus();
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
    if (this.get("#input").value != newValue) {
      this.get("#input").value = newValue
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