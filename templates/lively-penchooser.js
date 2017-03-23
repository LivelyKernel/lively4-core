import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';


export default class PenChooser extends Morph {
      
  initialize() {
    this.drawPens()
    this.get("#penChooser").style.display = "none"
    this.style.overflow = "hidden"
  
    
    this.get("#field").addEventListener("click", evt => this.onChoosePen(evt))
    
  }

  drawPens() { 
    var chooser = this.get("#penChooser");
    [1,2,4,8,12,16,20].forEach(penSize => {
      var pen = document.createElement("div")
      pen.innerHTML = this.penSvgShape(penSize)
      pen.classList.add("pen")
      chooser.appendChild(pen)
      pen.size = penSize
      pen.addEventListener("click", evt => this.onPenChoosen(pen))
    })
  }
  
  penSvgShape(size) {
    return '<svg><path d="M 3 15 l 15 -5 l 15 5 l 15 -5" stroke="black" stroke-width="' +size+'" fill=none><path></svg>'
  }
  
  onChoosePen() {
     if(this.get("#penChooser").style.display == "block")
      this.get("#penChooser").style.display = "none"
    else
      this.get("#penChooser").style.display = "block"
  }

  onPenChoosen(pen) {
    this.value = pen.size
    this.get("#penChooser").style.display = "none"
  }
  
  get value() {
    return this.getAttribute("value")
  }

  set value(value) {
    this.setAttribute("value", value)
    this.get("#field").innerHTML = this.penSvgShape(value)
    this.dispatchEvent(new CustomEvent("value-changed", {detail: {value: value}}))
  }
  
}
      

     
      