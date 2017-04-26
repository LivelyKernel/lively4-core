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
    ViewNav.updateDocumentGrid()
  }
  
  onPointerUp(evt) {
    if (!Preferences.isEnabled("ShowDocumentGrid", false))
      ViewNav.hideDocumentGrid()
    lively.removeEventListener("ViewNav", this.eventSource, "pointermove")
    lively.removeEventListener("ViewNav", this.eventSource, "pointerup")
  }
  
  onResize(evt) {
    if (!this.lastScaleTime || (Date.now() - this.lastScaleTime) > 1000) {
      return // there was no previous scale with mouse wheel
    }

    // this.lastPoint = pt(LastEvt.clientX, LastEvt.clientY)
    var scale = window.innerWidth / window.outerWidth
    // lively.notify("scale " + (scale / this.lastScale))

    var newPos = this.lastPoint.scaleBy(scale / this.lastScale)
    var offset = this.lastPoint.subPt(newPos)
    lively.setPosition(document.body, lively.getPosition(document.body).subPt(offset) )

    // lively.showPoint(newPos).style.backgroundColor = "green"

    ViewNav.updateDocumentGrid(true)
    
  }
  
  onMouseWheel(evt) {
    window.LastEvt = evt
    
    
    var bounds = document.body.getBoundingClientRect()
    // lively.notify("wheel bounds " + pt(bounds.left, bounds.top))

    this.lastPoint = pt(evt.clientX, evt.clientY)
    this.lastScale = window.innerWidth / window.outerWidth
    this.lastScaleTime = Date.now()
    
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

  static showDocumentGridItem(pos, color, border, w, h, parent) {
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
  
  static updateDocumentGrid(zoomed) {
    if (!this.documentGrid) return;
    
    if (zoomed) {
      this.hideDocumentGrid()
      this.showDocumentGrid()
    }
    
    
    lively.setGlobalPosition(this.documentGrid, pt(0,0))
    lively.setExtent(this.documentGrid, pt(window.innerWidth - 20, window.innerHeight -20))
    var pos = lively.getGlobalPosition(document.body)
    var grid = this.documentGrid.grid
    lively.setPosition(grid, pt( pos.x % grid.gridSize - 100, pos.y % grid.gridSize - 100) )
    
    lively.setGlobalPosition(this.documentGrid.documentSquare, pos)
    
    // lively.setGlobalPosition(grid, pos )
    
    
  }
  
  static showDocumentGrid() {
    this.documentGrid = document.createElement("div")
    this.documentGrid.isMetaNode = true
    this.documentGrid.id = "DocumentGrid"
  	this.documentGrid.setAttribute("data-lively4-donotpersist", "all")
  	this.documentGrid.style.overflow = "hidden"

    document.body.appendChild(this.documentGrid)

    let gridSize = 100,
      w = window.innerWidth + gridSize,
      h =  window.innerHeight + gridSize
      
    let grid = document.createElement("div")
    grid.gridSize = gridSize
    grid.isMetaNode = true
    
    lively.setExtent(this.documentGrid, pt(window.innerWidth, window.innerHeight))



    this.documentGrid.documentSquare = this.showDocumentGridItem(pt(0, 0), 
          "white", "0.5px dashed rgb(50,50,50)", 4000, 2000,  this.documentGrid )

    this.documentGrid.grid = grid
    
    this.documentGrid.appendChild(grid)
    lively.setPosition(grid, pt(0,0))
    

    
    for (var k=0; k < w; k += gridSize) {
      for (var l=0; l < h; l += gridSize) {
        this.showDocumentGridItem(pt(k, l), 
          undefined, "0.2px dashed rgb(190,190,190)", gridSize, gridSize, grid)
      }  
    }
    
    
    
    
    lively.addEventListener("ViewNav", window, "scroll", () => this.updateDocumentGrid())
    ViewNav.updateDocumentGrid()
  }
  
  static hideDocumentGrid() {
    lively.addEventListener("ViewNav", window)
    document.body.querySelectorAll(".document-grid").forEach(ea => {
      ea.remove()
    })
  }
  
  static resetView() {
    lively.setPosition(document.body,pt(0,0)) 
  }
} 

if (window.lively) {
  ViewNav.enable(document.body)
  ViewNav.hideDocumentGrid()
  ViewNav.showDocumentGrid()
}


