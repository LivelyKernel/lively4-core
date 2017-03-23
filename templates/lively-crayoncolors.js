import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import Colors from 'src/client/crayoncolors.js';


export default class CrayonColors extends Morph {
      
  initialize() {
    this.drawColorTable()
    this.get("#colorChooser").style.display = "none"
    this.get("#field").addEventListener("click", evt => this.onChooseColor(evt))
  }

  drawColorTable() { 
    var chooser = this.get("#colorChooser")
    Colors.colorTable().forEach(row => {
      var rowElement = document.createElement("div")
      rowElement.classList.add("row")
      chooser.appendChild(rowElement)
      row.forEach( color => {
        var colorField = document.createElement("div")
        colorField.classList.add("color")
        rowElement.appendChild(colorField)
        colorField.style.backgroundColor = color.value
        colorField.addEventListener("click", evt => this.onColorChoosen(color.value))
      })
      
    })
  }

  onChooseColor() {
    if(this.get("#colorChooser").style.display == "block")
      this.get("#colorChooser").style.display = "none"
    else
      this.get("#colorChooser").style.display = "block"
  }

  onColorChoosen(color) {
    this.value = color
    this.get("#colorChooser").style.display = "none"
  }
  
  get value() {
    return this.get("#field").style.backgroundColor
  }

  set value(color) {
    this.get("#field").style.backgroundColor = color
    this.dispatchEvent(new CustomEvent("value-changed", {detail: {value: color}}))
  }
  
}
      

     
      