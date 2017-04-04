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

    lively.addEventListener("ViewNav", window, "resize", e => this.onResize(e))
    // lively.addEventListener("ViewNav", window, "keydown", e => this.onKeyDown(e))
    // lively.addEventListener("ViewNav", window, "keyup", e => this.onKeyUp(e))

    lively.addEventListener("ViewNav", window, "mousewheel", e => this.onMouseWheel(e))


  }
  
  disable() {
    lively.removeEventListener("ViewNav", this.eventSource)
    lively.removeEventListener("ViewNav", window, "resize")
    lively.removeEventListener("ViewNav", window, "keydown")
    lively.removeEventListener("ViewNav", window, "keyup")
    lively.removeEventListener("ViewNav", window, "mousewheel")
  }
  
  eventPos(evt) {
    return pt(evt.clientX, evt.clientY)
  }

  onKeyDown(evt) {
    if (event.keyCode == 17) {
        lively.notify("ctrl down ")     
      // lively.addEventListener("ViewNav", this.eventSource, "pointermove", 
      //   e => this.onPointerMoveZoom(e))   
    }
  }
  
  onKeyUp(evt) {
    if (event.keyCode == 17) {
        lively.notify("ctrl up ")
        lively.removeEventListener("ViewNav", this.eventSource, "pointermove")   

    }
  }

  onPointerMoveZoom(evt) {
    var pos = this.eventPos(evt)
    lively.showPoint(pos)
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
  
  onResize(evt) {


    // this.lastPoint = pt(LastEvt.clientX, LastEvt.clientY)
    var scale = window.innerWidth / window.outerWidth
    // lively.notify("scale " + (scale / this.lastScale))

    var newPos = this.lastPoint.scaleBy(scale / this.lastScale)
    var offset = this.lastPoint.subPt(newPos)
    lively.setPosition(document.body, lively.getPosition(document.body).subPt(offset) )

    // lively.showPoint(newPos).style.backgroundColor = "green"
  }
  
  onMouseWheel(evt) {
    // window.LastEvt = evt
    var bounds = document.body.getBoundingClientRect()
    // lively.notify("wheel bounds " + pt(bounds.left, bounds.top))

    this.lastPoint = pt(evt.clientX, evt.clientY)
    this.lastScale = window.innerWidth / window.outerWidth
    
    // lively.showPoint(this.lastPoint).style.backgroundColor = "blue"
    // lively.showPoint(pt(LastEvt.pageX, LastEvt.pageY))
    
    if (evt.altKey) {
      
    }
    
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

if (window.lively)
  ViewNav.enable(document.body)


