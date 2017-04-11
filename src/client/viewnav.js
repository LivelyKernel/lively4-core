import {pt} from './graphics.js';
import Preferences from './preferences.js';

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
      
    if (!Preferences.isEnabled("ShowDocumentGrid", false))
      ViewNav.showDocumentGrid(); // 
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
    if (!Preferences.isEnabled("ShowDocumentGrid", false))
      ViewNav.hideDocumentGrid()
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
    window.LastEvt = evt
    
    
    var bounds = document.body.getBoundingClientRect()
    // lively.notify("wheel bounds " + pt(bounds.left, bounds.top))

    this.lastPoint = pt(evt.clientX, evt.clientY)
    this.lastScale = window.innerWidth / window.outerWidth
    
    // lively.showPoint(this.lastPoint).style.backgroundColor = "blue"
    // lively.showPoint(pt(LastEvt.pageX, LastEvt.pageY))
    
    if (evt.altKey) {
      // finder granular zoom? using non standard feature
      var zoom = Number(getComputedStyle(document.body).zoom) + (evt.wheelDelta / 1000 / 10)
      document.body.style.zoom= zoom


      // // zoom using CSS Transform
      // var scale = document.body._scale || 1
      // scale = scale + (evt.wheelDelta / 1000 / 5)
      // document.body._scale = scale
      // document.body.style.transform= "scale(" + scale + ")"
      
      lively.notify("zoom " + zoom)
      evt.preventDefault()
    }
    
  }

  static showDocumentGridItem(pos, color,border, w, h, parent) {
      var div = document.createElement("div")
  		lively.setPosition(div, pos)
  		div.style.backgroundColor = color
  		div.style.border = border
  		div.style.width = w  +"px"
  		div.style.height = h +"px"
  		div.livelyAcceptsDrop = function() {}
  		div.setAttribute("data-lively4-donotpersist", "all")
  		div.style.pointerEvents = "none"
  		div.style.zIndex = -100
  		div.classList.add("document-grid")
  		parent.appendChild(div)
  		return div
  }
  
  static showDocumentGrid() {
    let w = 3000,
      h = 2000,
      smallGridSize = 100,
      quadrants =[0]
    
    let grid = document.createElement("div")
  	grid.setAttribute("data-lively4-donotpersist", "all")
    lively.setPosition(grid, pt(0,0))
    document.body.appendChild(grid)

    quadrants.forEach(i => {
    	quadrants.forEach(j => {
    		var color = (i ==0 && j == 0) ? "white" : "rgb(245,245,245)";
        var bigGrid = this.showDocumentGridItem(pt(i*w, j*h), color, "1px dashed gray", w, h, grid)
    	})
    })
    for (var k=0; k < w; k += smallGridSize) {
      for (var l=0; l < h; l += smallGridSize) {
        this.showDocumentGridItem(pt(k, l), 
          undefined, "0.5px dashed rgb(240,240,240)", smallGridSize, smallGridSize, grid)
      }  
    }
  }
  
  static hideDocumentGrid() {
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


