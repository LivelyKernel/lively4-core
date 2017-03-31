import {pt} from 'src/client/graphics.js';

/*
 * Implements World (html body) panning!
 */

export default class ViewNav {
  
  constructor(target) {
    this.target = target
  }
  
  static enable(container) {
    
    if (container.viewNav) {
       container.viewNav.disable()
    }
    container.viewNav = new ViewNav(container)
    container.viewNav.enable()
  }
  
  enable() {
    this.eventSource =  document.body.parentElement
    lively.addEventListener("ViewNav", this.eventSource, "pointerdown", e => this.onPointerDown(e))
    lively.addEventListener("ViewNav", this.eventSource, "resize", e => this.onResize(e))

  }
  
  disable() {
    lively.removeEventListener("ViewNav", this.eventSource)
    
  }
  
  eventPos(evt) {
    return pt(evt.clientX, evt.clientY)
  }
  
  onResize(evt) {
    lively.notify("resize")
  }
  
  onPointerDown(evt) {
    if (!evt.ctrlKey || evt.button != 0)
      return;
      
    this.showDocumentGrid()
    this.eventOffset = this.eventPos(evt)
    this.originalPos = lively.getPosition(this.target)
      
    lively.addEventListener("ViewNav", this.eventSource, "pointermove", e => this.onPointerMove(e))
    lively.addEventListener("ViewNav", this.eventSource, "pointerup", e => this.onPointerUp(e))
  }
  
  onPointerMove(evt) {
    var delta = this.eventOffset.subPt(this.eventPos(evt))
    lively.setPosition(this.target, this.originalPos.subPt(delta))
  }
  
  onPointerUp(evt) {
    this.hideDocumentGrid()
    lively.removeEventListener("ViewNav", this.eventSource, "pointermove")
    lively.removeEventListener("ViewNav", this.eventSource, "pointerup")
  }
  
  showDocumentGrid() {
    ([-2,-1,0,1,2]).forEach(i => {
    	([-2,-1,0,1,2]).forEach(j => {
    		var w = 1980
    		var h = 1020
    		var div = document.createElement("div")
    		if (i ==0 && j == 0) {
    			div.style.background = "white"
    		} else {
    			div.style.background = "rgb(245,245,245)"
    		}
    		lively.setPosition(div, {x: i*w, y: j*h})
    		div.style.border = "1px dashed gray"
    		div.style.width = w  +"px"
    		div.style.height = h +"px"
    		div.livelyAcceptsDrop = function() {}
    		div.setAttribute("data-lively4-donotpersist", "all")
    		div.style.pointerEvents = "none"
    		div.style.zIndex = -100
    		div.classList.add("document-grid")
    		document.body.appendChild(div)
    	})
    })
  }
  
  hideDocumentGrid() {
    document.body.querySelectorAll(".document-grid").forEach(ea => {
      ea.remove()
    })
  }
  
  static resetView() {
    lively.setPosition(document.body,pt(0,0)) 
  }
  
} 

// ViewNav.enable(document.body)


