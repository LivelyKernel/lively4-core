import Morph from 'src/components/widgets/lively-morph.js';

/*MD 
## Combobox Widget
  <edit://test/templates/input-combobox-test.js>

MD*/

export default class InputCombobox extends Morph {
  async initialize() {
    this.updateView()
  }

  get value() {
    return this.getAttribute("value")
  }
  
  set value(s) {
    this.setAttribute("value", s)
    this.updateView()
  }
  
  updateView() {
    this.get("#input").value = this.getAttribute("value")  
  }
  
  setOptions(list) {
    var optionsElement = this.get("#options")
    optionsElement.innerHTML = ""
    for(var ea of list) {
      optionsElement.appendChild(<option>{ea}</option>)
    }
  }
  
  
  async livelyExample() {
    this.setOptions(["Apple", "Babanna", "Oranges"])
    
    
  }
  
  
}