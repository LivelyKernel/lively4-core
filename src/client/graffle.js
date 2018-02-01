import {pt} from 'src/client/graphics.js';
import Halo from "src/components/halo/lively-halo.js"
import SVG from "src/client/svg.js"
import { debounce } from "utils";
import * as events from 'src/client/morphic/event-helpers.js'

export default class Graffle {
  
  // Graffle.keysDown 
  static load() {
    lively.removeEventListener("Graffle", document.body)
    lively.removeEventListener("Graffle", document)
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
    lively.addEventListener("Graffle", document, "selectionchange", 
      (evt) => { this.onSelectionHide(evt) } )
    lively.addEventListener("Graffle", document, "selectionchange", 
      ((evt) => { this.onSelectionChange(evt) })::debounce(600) )
    this.keysDown = {}
  }

  
  static async showStyleBalloon(target) {
    if (!target) {
      return;
    }
    // console.log("show balloon " + target)
    // lively.showElement(target)
    if (!lively.styleBalloon) {
      lively.styleBalloon = await lively.openPart("formatting")
      lively.styleBalloon.style.zIndex = 500
    }
    document.body.appendChild(lively.styleBalloon);
    // lively.showElement(lively.styleBalloon)

    // console.log("pos " + lively.getGlobalBounds(target).bottomLeft())
    lively.setGlobalPosition(lively.styleBalloon, lively.getGlobalBounds(target).bottomLeft())
  }
  
    
  static async hideStyleBalloon() {
    // console.log("hide balloon")
    if (lively.styleBalloon) {
      lively.styleBalloon.remove()
      
      // lively.styleBalloon = null; // for developing
    }
  }
  
   static onSelectionHide(evt) {
    var selection = window.getSelection()
    if (!document.activeElement || !document.activeElement.isContentEditable) {
      if (document.activeElement === document.body) {
        this.hideStyleBalloon() 
      }
    } else if (!selection.anchorNode || !selection.isCollapsed) {
      this.hideStyleBalloon() 
    }
  }
  
  static onSelectionChange(evt) {
    var selection = window.getSelection()
    if (!document.activeElement || !document.activeElement.isContentEditable) {
      return
    }
    if (document.activeElement.shadowRoot) {
      selection = document.activeElement.shadowRoot.getSelection()
    }
    if (selection.anchorNode && !selection.isCollapsed) {
      var element = selection.getRangeAt(0).endContainer.parentElement;
      while(["SPAN", "FONT", "A", "B", "I"].includes(element.tagName)) {
        element = element.parentElement
      }
      this.showStyleBalloon(element)
    }
  }
  
  static async onKeyDown(evt) {
    // console.log('down ' + evt.keyCode)
    if (!lively.isGlobalKeyboardFocusElement(evt.path[0])) 
      return; 
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = true
    if (this.specialKeyDown() && !(evt.ctrlKey || evt.metaKey)) {
      lively.selection.disabled = true
      if (!evt.ctrlKey && !evt.altKey && !evt.altKey) {
        // console.log('disable ' + evt.keyCode)
        evt.stopPropagation()
        evt.preventDefault()
      }
      var hand = await lively.ensureHand();
      if (hand) {
        hand.style.visibility = "visible"
        var info = ""
        // #KeyboardShortcut HOLD-S+Drag create shape
        if (this.keysDown["S"]) {
          info = "shape"
        }
        // #KeyboardShortcut HOLD-C+Drag create connector
        if (this.keysDown["C"]) {
          info = "connect"
        }
        // #KeyboardShortcut HOLD-T+Drag create text
        if (this.keysDown["T"]) {
          info = "text"
        }
        // #KeyboardShortcut HOLD-D+Drag create svg path
        if (this.keysDown["D"]) {
          info = "draw"
        }

        if (hand.info)
          hand.info.textContent = info;
          hand.info.style.userSelect = "none"
      }
    }
  }
  
  static changeFontSize(element, factor) {
      if (element) {
        var fontSize = element.style.fontSize
        if (!fontSize || !fontSize.match(/%$/)) {
          fontSize = "100%"
        }    
        fontSize = "" + (Math.round(Number(fontSize.replace(/%/,"")) * factor)) + "%"
        element.style.fontSize = fontSize
        // lively.notify("font size: " +  element.style.fontSize)
      }
  }  

  
  static changeCurrentFontSize(factor) {
    var range = window.getSelection().getRangeAt(0);
    var element = range.commonAncestorContainer.parentElement
    var oldSize = element.style.fontSize

    // make a new region 
    document.execCommand("styleWithCSS", true, true)
    document.execCommand("fontSize", true, 1)    
    element = window.getSelection().getRangeAt(0).commonAncestorContainer.parentElement
    element.style.fontSize  = oldSize.match("%$") ? oldSize : "100%";
    this.changeFontSize(element, factor)
  }  


  static changeTextColor() {
    var color = "orange"; // #TODO make this interactive... 
    var element = window.getSelection().getRangeAt(0).startContainer.parentElement;
    if (element.style.color == color) {
      color = "black"; // TODO how can we unset a color? 
    }
    document.execCommand("styleWithCSS", true, true)
    document.execCommand("foreColor", true, color)
  }  
  
  static changeHiliteColor() {
    var color = "yellow"; // #TODO make this interactive... 
    var element = window.getSelection().getRangeAt(0).startContainer.parentElement;
    if (element.style.color == color) {
      color = "transparent"; // TODO how can we unset a color? 
    }
    document.execCommand("styleWithCSS", true, true)
    document.execCommand("hiliteColor", true, color)
  }  
  
  
  static async onKeyUp(evt) {
    var key = String.fromCharCode(evt.keyCode)
    this.keysDown[key] = false
    
    
    if (key == "D" || key == "C") {
      this.currentPath = null;
      HaloService.showHaloItems()
    }
    
    lively.selection.disabled = false
  
    var hand = await lively.ensureHand();
    if (hand) {
      hand.style.visibility = "hidden"
      if (hand.info) hand.info.textContent = ""
    }
    // if (this.lastElement)
    //   this.lastElement.focus(); // no, we can focus.... and continue typing

    if (evt.altKey &&   evt.keyCode == 187 /* + */) {
      this.changeCurrentFontSize(1.1)
    }
    
    if (evt.altKey &&  evt.keyCode == 189 /* - */) {
      this.changeCurrentFontSize(0.9)
    }

    if (evt.altKey && key == "C") {
      this.changeTextColor()
    }

    if (evt.altKey && key == "H") {
      this.changeHiliteColor()
    }
  }
  
  static specialKeyDown() {
    return this.keysDown["S"] || this.keysDown["T"] || this.keysDown["C"] || this.keysDown["D"]
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
      
      div.style.width = "auto"
      div.style.height = "auto"
      div.style.whiteSpace = "nowrap";

      div.style.padding = "3px"
      div.contentEditable = true
    }  else if (this.keysDown["C"]) {
      div = document.createElement("lively-connector")
      await lively.components.openIn(this.targetContainer, div)
      lively.setGlobalPosition(div, pt(evt.clientX, evt.clientY))
      window.that = div
      HaloService.showHalos(div)
      this.currentControlPoint  = HaloService.halo[0].ensureControlPoint(div.getPath(), 1, true)
      this.currentControlPoint.setVerticePosition(pt(0,0))
      this.currentControlPoint.start(evt, div)
    
      
      if (this.currentControlPoint.targetElement) {
        this.currentConnectFrom = this.currentControlPoint.targetElement
      }
      this.currentPath = div
    }  else if (this.keysDown["D"]) {
      var continueDrawing = true && this.currentPath;
      if (!this.currentPath) {
        div = await lively.openPart("path", this.targetContainer)
        this.currentPath = div
        window.that = div
      } 
      // HaloService.showHalos(this.currentPath)
      var svgPath = this.currentPath.querySelector("path")
      var vertices = SVG.getPathVertices(svgPath)
      this.currentControlPoint  = HaloService.halo[0].ensureControlPoint(svgPath, vertices.length - 1)
      if (continueDrawing) {
        var pos = lively.getGlobalPosition(this.currentControlPoint)
        this.currentControlPoint.addControlPoint()        
      } else {
        this.currentControlPoint.setVerticePosition(pt(0,0))
      }
      
      this.currentControlPoint.start(evt, this.currentPath)
      if (continueDrawing) {
        this.currentControlPoint.eventOffset = pos
      }
      if (this.currentControlPoint.targetElement) {
        this.currentConnectFrom = this.currentControlPoint.targetElement
      }
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
        lively.setGlobalPosition(lively.hand, pt(evt.clientX - 2, evt.clientY -2))    
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
      
      if (this.keysDown["D"]) {
        HaloService.hideHaloItems()
      }
    }

    if(this.currentElement) {
      if (this.currentPath) {
        // if (this.currentPath.resetBounds) {
        //   this.currentPath.resetBounds()
        //   HaloService.showHalos(that)
        // }
      }
      if (this.currentElement.classList.contains("lively-text")) {
        if (!this.keysDown["T"]) {
          this.currentElement.focus()        
        } 
      }
      this.lastMouseDown = null
      this.currentElement = null
      this.lastElement = this.currentElement
      document.documentElement.style.touchAction = ""

    } else {
      this.lastElement = null
    }
    this.currentControlPoint = null
    this.currentConnectFrom = null
  }
}

Graffle.load()