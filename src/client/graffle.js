import {pt} from 'src/client/graphics.js';
import Halo from "src/components/halo/lively-halo.js"
import SVG from "src/client/svg.js"
import { debounce } from "utils";
import {Grid} from 'src/client/morphic/snapping.js';
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
    lively.setGlobalPosition(lively.styleBalloon,
      lively.getGlobalBounds(target).bottomLeft())
  }
  
    
  static async hideStyleBalloon() {
    // console.log("hide balloon")
    if (lively.styleBalloon) {
      lively.styleBalloon.remove()
      
      // lively.styleBalloon = null; // for developing
    }
  }
  
   static onSelectionHide(evt) {
    // var selection = window.getSelection()
    // if (!document.activeElement || !document.activeElement.isContentEditable) {
    //   if (document.activeElement === document.body) {
    //     this.hideStyleBalloon() 
    //   }
    // } else if (!selection.anchorNode || !selection.isCollapsed) {
    //   this.hideStyleBalloon() 
    // }
    this.hideStyleBalloon() 
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
    if (!lively.preferences.get("GraffleMode")) return;

    if (!lively.isGlobalKeyboardFocusElement(evt.path[0])) 
      return; 
    var key = String.fromCharCode(evt.keyCode)

    // console.log("" + Date.now() + " down " + key + " " +  evt.altKey)

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
        // #KeyboardShortcut HOLD-F+Drag create freehand drawing
        if (this.keysDown["F"]) {
          info = "freehand"
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
    
    // console.log("" + Date.now() + " up " + key + " " +  evt.altKey)
    
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
    return this.keysDown["S"] || this.keysDown["T"] || this.keysDown["C"] || this.keysDown["D"] || this.keysDown["F"]
  }
  
  static eventPosition(evt) {
     return pt(evt.clientX, evt.clientY)
  }
  
  static async startShapeDrawing(evt) {
    var shape = document.createElement("div")
    shape.style.backgroundColor = "lightgray"
    shape.style.border = "1px solid gray"    
    this.openAsLivelyContent(shape, evt)
    return shape
  }
  
  static async startTextDrawing(evt) {
    var text = document.createElement("div")
    text.textContent = ""
    text.classList.add("lively-text")
    
    // #TODO move this to CSS as defaults?
    text.style.width = "auto"
    text.style.height = "auto"
    text.style.whiteSpace = "nowrap";
    text.style.padding = "3px"
    
    text.contentEditable = true
    this.openAsLivelyContent(text, evt)
    return text
  }

  static async startConnectorDrawing(evt) {
    var connector = document.createElement("lively-connector")
    await lively.components.openIn(this.targetContainer, connector)
    lively.setGlobalPosition(connector, pt(evt.clientX, evt.clientY))
    window.that = connector
    HaloService.showHalos(connector)
    let cp = lively.halo.ensureControlPoint(connector.getPath(), 1, true)
    this.currentControlPoint = cp
    cp.setVerticePosition(pt(0,0))
    cp.start(evt, connector)
    this.currentPath = connector        
    this.openAsLivelyContent(connector, evt)
    if (cp.targetElement) {
      connector.connectFrom(cp.targetElement)
    }   
    connector.connectTo(lively.hand)
    return connector
  }
  
  static async startFreehandDrawing(evt) {
    var freehand = await lively.create("lively-drawboard")
    freehand.freehand()
    this.currentFreehand = freehand
    this.openAsLivelyContent(freehand, evt)
    lively.setExtent(freehand, pt(100,100))
    freehand.onPointerDown(evt)
    return freehand
  }
  
  static async startPathDrawing(evt) {
    var continueDrawing = true && this.currentPath;
    if (!this.currentPath) {
      var path = await lively.openPart("path", this.targetContainer)
      this.currentPath = path
      window.that = path
      this.openAsLivelyContent(path, evt) 
      // split position in global and local part to snap locally...
      var offset = lively.getGlobalPosition(path.parentElement)
      var pos = pt(evt.clientX, evt.clientY).subPt(offset)
      
      if (!evt.ctrlKey) {
        pos = Grid.snapPt(pos, 10, 5) 
      }
      HaloService.showHalos(path)
      lively.setPosition(path, pos)
    } 
    var svgPath = this.currentPath.querySelector("path")
    var vertices = SVG.getPathVertices(svgPath)
    let cp = lively.halo.ensureControlPoint(svgPath, vertices.length - 1)
    this.currentControlPoint = cp
    if (continueDrawing) {
      cp.addControlPoint()        
    } else {
      cp.setVerticePosition(pt(0,0))
    }
    cp.start(evt, this.currentPath)
    if (continueDrawing) {
      cp.eventOffset = this.lastMouseUpPos // #ContinueHere 
    }
    return path
  }
  
  static openAsLivelyContent(div, evt) {
    div.classList.add("lively-content")
    this.currentElement = div
    this.targetContainer.appendChild(div)
    var pos = this.eventPosition(evt)    
    
    lively.setGlobalPosition(div, pos)
    this.lastMouseDown = pos;
    return div
  }
  
  static ensureTargetContainer(evt) {
    var targetContainer = evt.path.find(ea => ea.tagName == "LIVELY-CONTAINER")
    if (targetContainer) {
      lively.showElement(targetContainer)
      this.targetContainer = targetContainer
    } else {
      this.targetContainer = document.body
    }
  }
  
  static async onMouseDown(evt) {    
    if (!this.specialKeyDown()) return
    evt.stopPropagation()
    evt.preventDefault()
    document.documentElement.style.touchAction = "none"    
    this.ensureTargetContainer(evt)
    if (this.keysDown["S"]) {
      await this.startShapeDrawing(evt)
    } else if (this.keysDown["T"]) {
      await this.startTextDrawing(evt)
    }  else if (this.keysDown["C"]) {
      await this.startConnectorDrawing(evt)
    }  else if (this.keysDown["D"]) {
      await this.startPathDrawing(evt)
    } else if (this.keysDown["F"]) {
      await this.startFreehandDrawing(evt)
    }
  }
  
  static onMouseMove(evt) {
    if (this.specialKeyDown()) {
        lively.setGlobalPosition(lively.hand, pt(evt.clientX - 2, evt.clientY -2))    
    }
    if (this.currentControlPoint) {
      this.currentControlPoint.move(evt)
    }
    if (this.currentFreehand) {
      this.currentFreehand.onPointerMove(evt)
    }
    
    if (!this.lastMouseDown || !this.currentElement) return;
    var extent = this.eventPosition(evt).subPt(this.lastMouseDown)
    if (!this.currentPath && !this.currentFreehand) {
      lively.setExtent(this.currentElement, extent)
    }
  }

  static onMouseUp(evt) {
    if (!evt) return;
    this.lastMouseUpPos = lively.getPosition(evt)
    if (this.currentControlPoint) {
      this.currentControlPoint.stop(evt)
       if (!this.keysDown["T"]) {
          HaloService.hideHaloItems()        
        } 
    }
    if (this.currentFreehand) {
      this.currentFreehand.onPointerUp(evt)      
      var svg = this.currentFreehand.get("#svg")
      var path = svg.querySelector("path")

      var bounds = SVG.childBounds(svg)
      var p1 = lively.getGlobalPosition(this.currentFreehand)
      var p2 = pt(bounds.x, bounds.y)
      var delta = p2.subPt(p1)

      lively.moveBy(this.currentFreehand, delta)
      lively.moveBy(path, delta.scaleBy(-1))
      lively.setExtent(this.currentFreehand, pt(bounds.width, bounds.height))
      
      this.currentFreehand = null
      this.currentElement = null
      // lively.showElement(svg)
  
      // lively.setGlobalPosition(this.currentFreehand, bounds.topLeft())
      // lively.setExtent(this.currentFreehand, pt(bounds.width, bounds.height))
    } else if(this.currentElement) {
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