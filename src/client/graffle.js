import {pt} from 'src/client/graphics.js';
import Halo from "src/components/halo/lively-halo.js"
import svg from "src/client/svg.js"

export default class Graffle {
  
  // Graffle.keysDown 
  static load() {
    lively.removeEventListener("Graffle", document.body)
    lively.addEventListener("Graffle", document.body, "keydown", 
      (evt) => { this.onKeyDown(evt)}, true)
    lively.addEventListener("Graffle", document.body, "keyup", 
      (evt) => { this.onKeyUp(evt) }, true)
    lively.removeEventListener("GraffleMouse", document.documentElement)
    lively.addEventListener("GraffleMouse", document.documentElement, "pointerdown", 
      (evt) => { this.onMouseDown(evt) }, true)
    lively.addEventListener("GraffleMouse", document.documentElement, "pointermove", 
      (evt) => { this.onMouseMove(evt) })
    lively.addEventListener("GraffleMouse", document.documentElement, "pointerup", 
      (evt) => { this.onMouseUp(evt) })
    this.keysDown = {}
  }
  
  static onKeyDown(evt) {
    // console.log('down ' + evt.keyCode)
    if (!lively.isGlobalKeyboardFocusElement(evt.path[0])) 
      return; 
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = true
    // lively.notify("down: " + key)
    if (this.specialKeyDown() && !(evt.ctrlKey || evt.metaKey)) {
      lively.selection.disabled = true
      if (!evt.ctrlKey && !evt.altKey && !evt.altKey) {
        // console.log('disable ' + evt.keyCode)
        evt.stopPropagation()
        evt.preventDefault()
      }
      lively.hand.style.display = "block"
      var info = ""
      if (this.keysDown["S"]) {
        info = "shape"
      }
      if (this.keysDown["C"]) {
        info = "connect"
      }
      if (this.keysDown["T"]) {
        info = "text"
      }
      if (lively.hand.info)
        lively.hand.info.textContent = info  
    }
  }

  static onKeyUp(evt) {
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = false
    // lively.notify("up: " + key)
    lively.selection.disabled = false
  
    lively.hand.style.display = "none"
    
    if (lively.hand.info)
     lively.hand.info.textContent = ""
    
    // if (this.lastElement)
    //   this.lastElement.focus(); // no, we can focus.... and continue typing
  }
  
  static specialKeyDown() {
    return this.keysDown["S"] || this.keysDown["T"] || this.keysDown["C"]
  }
  
  static eventPosition(evt) {
     return pt(evt.clientX, evt.clientY)
  }
  
  static async onMouseDown(evt) {    
    if (!this.specialKeyDown()) return

    document.documentElement.style.touchAction = "none"
    
    //  lively.addEventListener("GraffleMouse", document.documentElement, "pointermove", (evt) => {
    //   this.onMouseMove(evt)
    // })
    // lively.addEventListener("GraffleMouse", document.documentElement, "pointerup", (evt) => {
    //   this.onMouseUp(evt)
    // })

    var targetContainer = evt.path.find(ea => ea.tagName == "LIVELY-CONTAINER")

    if (targetContainer) {
      lively.notify("c " + targetContainer)
      lively.showElement(targetContainer)
      this.targetContainer = targetContainer
    } else {
      this.targetContainer = document.body
    }
    var div
    if (this.keysDown["S"]) {
      div= document.createElement("div")
      div.style.backgroundColor = "lightgray"
      div.style.border = "1px solid gray"    
    } else if (this.keysDown["T"]) {
      div= document.createElement("div")
      div.textContent = ""
      div.classList.add("lively-text")
      div.style.padding = "3px"
      div.contentEditable = true
    }  else if (this.keysDown["C"]) {
      div = document.createElement("lively-connector")
      await lively.components.openIn(this.targetContainer, div)
      window.that = div
      HaloService.showHalos(div)
      HaloService.halo[0].shadowRoot.querySelectorAll(".halo").forEach(ea => {
        // ea.style.visibility = "hidden"
      })
      this.currentControlPoint  = HaloService.halo[0].ensureControlPoint(div.getPath(), 1)
      this.currentControlPoint.setVerticePosition(pt(0,0))
      this.currentControlPoint.start(evt, div)
      if (this.currentControlPoint.targetElement) {
        this.currentConnectFrom = this.currentControlPoint.targetElement
      }
      this.currentPath = div
    }
    
    if (!div) return
    // div.innerHTML = "This is a shapes"
    div.classList.add("lively-content")
    this.currentElement = div
    this.targetContainer.appendChild(div)
    var pos = this.eventPosition(evt)
    lively.setGlobalPosition(div, pos)

    if (this.currentConnectFrom) {    
      div.connectFrom(this.currentConnectFrom)
      div.connectTo(lively.hand)
    }

    this.lastMouseDown = pos;
    evt.stopPropagation()
    evt.preventDefault()
  }
  
  static onMouseMove(evt) {
    if (this.specialKeyDown()) {
        lively.setGlobalPosition(lively.hand, pt(evt.clientX, evt.clientY))    
    }
    if (this.currentControlPoint) {
      this.currentControlPoint.move(evt)
    }
    var pos = pt(evt.clientX, evt.clientY)
    // lively.showPoint(pos)
    
    if (!this.lastMouseDown) return;
    var extent = this.eventPosition(evt).subPt(this.lastMouseDown)

    if (this.currentPath) {
      // if (this.currentPath.pointTo)
      // this.currentPath.pointTo(extent)
    } else {
      lively.setExtent(this.currentElement, extent)
    }
  }

  static onMouseUp(evt) {
    // lively.removeEventListener("GraffleMouse", document.documentElement, "pointerup")
    // lively.removeEventListener("GraffleMouse", document.documentElement, "pointermove")
    
    if (this.currentControlPoint) {
      if (this.currentConnectFrom) { 
        // div.connectFrom(this.currentConnectFrom)
      }
      this.currentControlPoint.stop(evt)
    }

    if(this.currentElement) {
      if (this.currentPath) {
        // this.currentPath.resetBounds()
      }
      if (this.currentElement.classList.contains("lively-text")) {
        // this.currentElement.focus()
      }
      this.lastMouseDown = null
      this.currentElement = null
      this.lastElement = this.currentElement
      document.documentElement.style.touchAction = ""

    } else {
      this.lastElement = null
    }
    this.currentPath = null
    this.currentControlPoint = null
    this.currentConnectFrom = null
  }
}

Graffle.load()