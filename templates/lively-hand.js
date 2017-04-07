import Morph from './Morph.js';
import {pt} from "src/client/graphics.js"

import Selecting from "src/client/morphic/selecting.js"

/*
 * Classic old Morphic-like drag and drop of graphical elements
 */

export default class LivelyHand extends Morph {
  
  initialize() {
    this.setAttribute("data-lively4-donotpersist","all");

    lively.removeEventListener("Hand", document.body.parentElement)
    lively.addEventListener("Hand", document.body.parentElement, "pointerdown", 
      e => this.onPointerDown(e))
  }
  
  worldContext() {
    return this.parentNode || document.body
  }
  
  toString() {
   return "[LivelyHand]" 
  }
  
  grab(element) {
    this.drop() 
    var pos = lively.getGlobalPosition(element)
    this.appendChild(element)
    lively.setGlobalPosition(element, pos)
  } 

  drop() {
    this.childNodes.forEach(element => {
      var pos = lively.getGlobalPosition(element)
      var droptarget = this.dropTarget || this.worldContext()
      droptarget.appendChild(element)
      lively.setGlobalPosition(element, pos)
    })
  } 

  elementUnderHand(evt) {
    var path = evt.path
        .filter(ea => ! Selecting.isIgnoredOnMagnify(ea))
    return path[0]
  }

  startGrabbing(target, evt) {
    this.style.display = "block"

    if (evt) {
      lively.setGlobalPosition(this, pt(evt.clientX, evt.clientY));
    
    }
    lively.addEventListener("Hand", document.body.parentElement, "pointermove", 
        e => this.onPointerMove(e))
    lively.addEventListener("Hand", document.body.parentElement, "pointerup", 
        e => this.onPointerUp(e))
    this.grab(target)
  }

  onPointerDown(evt) {
    document.body.parentElement.setPointerCapture(evt.pointerId)
    if (evt.altKey) {
      var target = this.elementUnderHand(evt)
      if (!target) return;
      // lively.notify("grab this" + target)
      evt.preventDefault()
      this.startGrabbing(target, evt)
    }
    // this.offset = lively.globalPosition(this)
  }
  
  onPointerMove(evt) {

    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
    lively.setGlobalPosition(this, pt(evt.clientX, evt.clientY))
  }
 

  onPointerUp(evt) {
    document.body.parentElement.releasePointerCapture(evt.pointerId)
    lively.removeEventListener("Hand", document.body.parentElement, "pointermove")
    lively.removeEventListener("Hand", document.body.parentElement, "pointerup")
    this.drop()
    this.style.display = "none"

  }
 
 
  
}