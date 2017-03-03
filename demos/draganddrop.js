// import * as cop  from "src/external/ContextJS/src/contextjs.js";

import {pt} from 'src/client/graphics.js';

// #TODO don't create a new class on every save!!! #Important
export default class Hand {
  
  initialize() {
    
    
  }
  
  enable() {
    lively.addEventListener("Hand", document, "mousedown", 
      (evt) => this.onMouseDown(evt), true)
    lively.addEventListener("Hand", document, "mouseup", 
      (evt) => this.onMouseUp(evt), true)

  }
  
  inspect(evt) {
    var inspector = document.querySelector("#handinspector")
    if (!inspector) return
    
    inspector.inspect(evt)
  }
  
  disable() {
    lively.removeEventListener("Hand", document, "mousedown")
    lively.removeEventListener("Hand", document, "mouseup")
    lively.removeEventListener("Hand", document, "mousemove")
  }

  grabElement(element) {
    if (this.target) 
      this.dropElement(this.target)
    
    this.target = element    
    lively.addEventListener("Hand", document, "mousemove", 
      (evt) => this.onMouseMove(evt))
  }

  dropElement(element) {
    lively.removeEventListener("Hand", document, "mousemove")
  }
  
  
  onMouseDown(evt) {
    this.inspect(evt)
    var div = lively.showPoint(pt(evt.clientX, evt.clientY))
    div.style.backgroundColor = "green"
    div.innerHTML = "down"
  }
  
  onMouseUp(evt) {
    var div = lively.showPoint(pt(evt.clientX, evt.clientY))
    div.style.backgroundColor = "blue"
    div.innerHTML = "up"
  }
  
  onMouseMove(evt) {
    if (this.highlight) this.highlight.remove()
    if (evt.path)
      this.highlight = lively.showElement(evt.path[0])
    
    
    lively.showPoint(pt(evt.clientX, evt.clientY))

  }
  
  toString() {
    return "[object Hand: " + this.target + "]"
  }
}

// ShowFocusLayer.beNotGlobal()