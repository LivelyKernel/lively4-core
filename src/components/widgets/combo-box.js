import Morph from 'src/components/widgets/lively-morph.js';

export default class ComboBox extends Morph {
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