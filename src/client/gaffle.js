import {pt} from 'src/client/graphics.js';
import Halo from "templates/lively-halo.js"

export default class Graffle {
  
  
  static load() {
    lively.notify("load graffle")
    lively.removeEventListener("Graffle", document.body)
    lively.addEventListener("Graffle", document.body, "keydown", (evt) => {
      this.onKeyDown(evt)
    })
    lively.addEventListener("Graffle", document.body, "keyup", (evt) => {
      this.onKeyUp(evt)
    })

    lively.removeEventListener("GraffleMouse", document)
    lively.addEventListener("GraffleMouse", document, "mousedown", (evt) => {
      this.onMouseDown(evt)
    })
    lively.addEventListener("GraffleMouse", document, "mousemove", (evt) => {
      this.onMouseMove(evt)
    })
    lively.addEventListener("GraffleMouse", document, "mouseup", (evt) => {
      this.onMouseUp(evt)
    })

    this.keysDown = {}
  }
  
  static onKeyDown(evt) {
    if (evt.path[0] !== document.body) return; 
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = true
    // lively.notify("down: " + key)
    if (this.specialKeyDown()) {
      lively.selection.disabled = true
    }
  }

  static onKeyUp(evt) {
    if (evt.path[0] !== document.body) return; 
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = false
    lively.notify("up: " + key)
    lively.selection.disabled = false
    
    
    // if (this.lastElement)
    //   this.lastElement.focus(); // no, we can focus.... and continue typing
  }
  
  
  static specialKeyDown() {
    return this.keysDown["S"] || this.keysDown["T"]
  }
  
  static eventPosition(evt) {
     return pt(evt.clientX, evt.clientY)
  }
  
  static onMouseDown(evt) {
    if (!this.specialKeyDown()) return
    lively.notify("dowsn")
    
    
    var div
    if (this.keysDown["S"]) {
      div= document.createElement("div")
      div.style.backgroundColor = "lightgray"
      div.style.border = "1px solid gray"
    
    } else if (this.keysDown["T"]) {
      div= document.createElement("div")
      div.textContent = "text"
      div.style.backgroundColor = "white"
      div.style.padding = "3px"
      
      div.contentEditable = true

    
    }
    
    if (!div) return
    // div.innerHTML = "This is a shapes"
    div.classList.add("lively-content")
    this.currentElement = div
    document.body.appendChild(div)
    var pos = this.eventPosition(evt)
    lively.setGlobalPosition(div, pos)
    this.lastMouseDown = pos
    evt.stopPropagation()
    evt.preventDefault()
  }
  
  static onMouseMove(evt) {
    if (!this.specialKeyDown()) return

    var pos = pt(evt.clientX, evt.clientY)
    // lively.showPoint(pos)
    
    if (!this.lastMouseDown) return 
    
    var extent = this.eventPosition(evt).subPt(this.lastMouseDown)
    lively.setExtent(this.currentElement, extent)
  }

  static onMouseUp(evt) {
    if (!this.specialKeyDown()) return
    if(this.currentElement) {
      this.lastMouseDown = null
      this.currentElement = null
      this.lastElement = this.currentElement
    } else {
      this.lastElement = null
    }
  }
  
}

Graffle.load()