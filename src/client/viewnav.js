import {pt} from './graphics.js';
import Preferences from './preferences.js';
import Windows from "src/components/widgets/lively-window.js"


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
    this.eventSource =  this.target.parentElement
    lively.addEventListener("ViewNav", this.eventSource, "pointerdown", e => this.onPointerDown(e))

    lively.addEventListener("ViewNav", window, "resize", e => this.onResize(e))
    lively.addEventListener("ViewNav", this.eventSource, "mousewheel", e => this.onMouseWheel(e))
    lively.addEventListener("ViewNav", this.eventSource, "scroll", () => {
      if (this.target) {
        ViewNav.updateDocumentGrid(this.target.documentGrid, this.target)
      }
    })

  }
  
  disable() {
    lively.removeEventListener("ViewNav", this.eventSource)
    lively.removeEventListener("ViewNav", window, "resize")
    lively.removeEventListener("ViewNav", this.eventSource, "mousewheel")
    lively.removeEventListener("ViewNav", this.eventSource, "scroll")
  }
  
  toString() {
    return "[ViewNav on: " + this.target + "]"
  }
  
  eventPos(evt) {
    return pt(evt.clientX, evt.clientY)
  }

  onPointerMoveZoom(evt) {
    var pos = this.eventPos(evt)
    lively.showPoint(pos)
  }
  
  onPointerDown(evt) {
    if (!evt.ctrlKey || evt.button != 0)
      return;
    
    this.targetContainer = evt.composedPath().find(ea => {
      return ea.tagName == "LIVELY-CONTAINER"
    })
  
    this.eventOffset = this.eventPos(evt)
  
    
    
    if (this.targetContainer) {
      this.originalPos = lively.getPosition(this.targetContainer.get("#container-root"))
    } else {
      this.originalPos = lively.getPosition(this.target)
    }
      
    lively.addEventListener("ViewNav", this.eventSource, "pointermove", e => this.onPointerMove(e))
    lively.addEventListener("ViewNav", this.eventSource, "pointerup", e => this.onPointerUp(e))
    evt.stopPropagation()
  }
  
  onPointerMove(evt) {
    var delta = this.eventOffset.subPt(this.eventPos(evt))
    
    if (this.targetContainer) {
      lively.setPosition(this.targetContainer.get("#container-root"), this.originalPos.subPt(delta))
    } else {
      lively.setPosition(this.target, this.originalPos.subPt(delta))
      // lively.notify("pos " + this.originalPos.subPt(delta) + " " + this.target)
      ViewNav.updateDocumentGrid(this.target.documentGrid, this.target, undefined, true) 
    }  
    evt.stopPropagation()
  }
  
  onPointerUp(evt) {
    lively.removeEventListener("ViewNav", this.eventSource, "pointermove")
    lively.removeEventListener("ViewNav", this.eventSource, "pointerup")
    this.fixScrollAfterNavigation()
  }
  
  onResize(evt) {
    if (!this.lastScaleTime || (Date.now() - this.lastScaleTime) > 1000) {
      return // there was no previous scale with mouse wheel
    }

    if (this.target !== document.body) {
      return    
    }
  
    // this.lastPoint = pt(LastEvt.clientX, LastEvt.clientY)
    var scale = window.innerWidth / window.outerWidth
    // lively.notify("scale " + (scale / this.lastScale))

    var newPos = this.lastPoint.scaleBy(scale / this.lastScale)
    var offset = this.lastPoint.subPt(newPos)
    
    
      lively.setPosition(this.target, lively.getPosition(this.target).subPt(offset) )

      // lively.showPoint(newPos).style.backgroundColor = "green"

      ViewNav.updateDocumentGrid(this.target.documentGrid, this.target, true)
      
    
    
  }
  
  onMouseWheel(evt) {
    window.LastEvt = evt
    
    
    var bounds = this.target.getBoundingClientRect()
    // lively.notify("wheel bounds " + pt(bounds.left, bounds.top))

    this.lastPoint = pt(evt.clientX, evt.clientY)
    this.lastScale = window.innerWidth / window.outerWidth
    this.lastScaleTime = Date.now()
    
    // lively.showPoint(this.lastPoint).style.backgroundColor = "blue"
    // lively.showPoint(pt(LastEvt.pageX, LastEvt.pageY))
    
    if (evt.altKey) {
      // finder granular zoom? using non standard feature
      var zoom = Number(getComputedStyle(this.target).zoom) + (evt.wheelDelta / 1000 / 10)
      this.target.style.zoom= zoom

      // // zoom using CSS Transform
      // var scale = this.target._scale || 1
      // scale = scale + (evt.wheelDelta / 1000 / 5)
      // this.target._scale = scale
      // this.target.style.transform= "scale(" + scale + ")"
      
      lively.notify("zoom " + zoom)
      evt.preventDefault()
    }
    
  }

  fixScrollAfterNavigation() {
   
    if(!this.target) return;
   
    // #DoesNotWork
    // if ((this.target.scrollHeight > this.target.scrollTop + window.innerHeight) ||
    //   (this.target.scrollWidth > this.target.scrollLeft + window.innerWith))
    //   return; // don't fix when scrolled to bottom to let users pan into the void
    
    // console.log("fix scroll ")

      
    ViewNav.lastFixedScroll = Date.now()
    
    return // #Bug fixScrollAfterNavigation seems to make problems... 
    
//     var pos = lively.getGlobalPosition(this.target).scaleBy(-1)
//     var topLeft = pt(0,0).minPt(pos)
//     Windows.allWindows().forEach(ea => {
//       topLeft = topLeft.minPt(lively.getPosition(ea))
//     })
    
//     lively.setPosition(this.target, topLeft.scaleBy(-1))
    
//     var delta = topLeft.scaleBy(-1).subPt(pos.scaleBy(-1))

//     this.target.scrollLeft = delta.x 
//     this.target.scrollTop = delta.y
  }


  static showDocumentGridItem(pos, color, border, w, h, parent) {
      var div = document.createElement("div")
      div.isMetaNode = true
      lively.setPosition(div, pos)
      div.style.backgroundColor = color
      div.style.border = border
      div.style.width = w  +"px"
      div.style.height = h +"px"
      div.livelyAcceptsDrop = function() {}
      div.setAttribute("data-lively4-donotpersist", "all")
      div.style.pointerEvents = "none"
      div.classList.add("document-grid")
      parent.appendChild(div)
      return div
  }
  
  static updateDocumentGrid(documentGrid, target, zoomed, force) {
    
    if (!Preferences.get("ShowDocumentGrid")) {
      this.hideDocumentGrid(target);
      return;
    }

    // console.log("updateDocumentGrid(" + zoomed + ", " + force +")")
    if (!force && this.lastFixedScroll && ((Date.now() - this.lastFixedScroll) < 1000)) {
      // console.log("not update document grid " + (Date.now() -this.lastFixedScroll))
      return
    }
    // console.log("update document grid "  + (Date.now() - this.lastFixedScroll) )

    if (!documentGrid) return;
    
    if (zoomed) {
      this.hideDocumentGrid(target)
      this.showDocumentGrid(target)
    }
    
    
    lively.setGlobalPosition(documentGrid, pt(0,0))
    // we make the grid a bit bigger than the actual visible browser window, so that we can scroll into the void...
    lively.setExtent(documentGrid, pt(window.innerWidth + 200, window.innerHeight  + 200))
    var pos = lively.getGlobalPosition(target)
    var grid = documentGrid.grid
    lively.setPosition(grid, pt( pos.x % grid.gridSize - 100, pos.y % grid.gridSize - 100) )
    lively.setGlobalPosition(documentGrid.documentSquare, pos)
    
    
    var backgroundPos = lively.getGlobalPosition(document.body).addPt(pt(document.scrollingElement.scrollLeft, document.scrollingElement.scrollTop))
    document.body.style.backgroundPosition = "" + (backgroundPos.x % 100) +"px " + (backgroundPos.y % 100) + "px" 
  }
  
  static showDocumentGrid(target) {
    if (!target) return;
    
    document.body.style.backgroundImage= `url(${lively4url}/src/client/grid.svg)`
    // document.body.style.backgroundImage="url(' data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAC1UlEQVR4Ae2dYacyQRiGp4noQ0RERB8iov//R/oQ0YeIiEhRpOxr1rursocoudjrIWefPWv27r7OzJzZ3ZltzOfzLPwRs9ns6Ter1SpcLpenfSkZj8eh3W6X+7fbbdjv92VebAwGg9Dr9Yo0HA6HsNlsyrzY6Ha7YTgcFmm4Xq9huVyWebHRarXCZDIp0vznYrEI9/v9aV9KptNpaDab5f71eh1Op1OZFxuj0Sh0Op0iDbvdLv+UO/5v9Pv9kD5FpLJSma+RykplFpG0JY2vkbQljY0E5NX414PNf+dA/N2pPNM7DgjkHZd+eIxAfmj2O6cSyDsu/fAYgfzQ7HdO1ciy7M9/e98pwGO+64A15Lt+flyaQD628LsFCOS7fn5cWkyXQwyOA7Hq2hRHXv2U2GTBmAtEIDAHYHKsITAgjfP5nD3eXILpq50cL53AkNtkCQTmAExOTA8kGBwHYtXTIRx59VNiHwJjLhCBwByAybGG0ICkxzsNjgOO1DksciU2WQKBOQCTE9OUAIPjQKyan8GRVz8l9iEw5gIRCMwBmBxrCA1ImmBpcBxwpM5hkSuxyRIIzAGYnJgm5RscB2LVCgkcefVTYh8CYy4QgcAcgMmxhtCApCWODI4DjtQ5LHIlNlkCgTkAk2MNoQGpWv8PprFWcmLVgpG1cgD2ZW2yBAJzACbHGiIQmAMwOY3b7ZY9rvgM01c7OV46gSG3DxEIzAGYnFi1oj9MY63kxKpXNtTKAdiXtQ8RCMwBmBxriEBgDsDkNI7HY/b4ziWYvtrJcaQOQ24fIhCYAzA5Mb2nz+A4IBAOi1yJfYhAYA7A5FhDBAJzACYnPr7xGKatlnIcqcOw24cIBOYATI63cGlAfMiBRcQ+hMUjCEQgMAdgcqwhNCDeT2cRcaTO4mGnDuMhEBwQp0WzkEQXDoABYclRjeMQ2N+AQAQCcwAmJzpHnUXEkTqLR/gHE2yk2eQIeIIAAAAASUVORK5CYII=')"
    
    var documentGrid = document.createElement("div")
  	documentGrid.style["z-index"] = -200

    documentGrid.isMetaNode = true
    documentGrid.id = "DocumentGrid"
    documentGrid.classList.add("document-grid")
  	documentGrid.setAttribute("data-lively4-donotpersist", "all")
  	// documentGrid.style.overflow = "hidden"
  	documentGrid.style.pointerEvents = "none"
  	documentGrid.livelyAcceptsDrop = function() {}

    target.documentGrid = documentGrid
    target.appendChild(documentGrid)
    
    var width = window.innerWidth;
    var height = window.innerHeight

    let gridSize = 100,
      w = width + 2* gridSize,
      h =  height + 2 *gridSize
      
    let grid = document.createElement("div")
    grid.gridSize = gridSize
    grid.isMetaNode = true
    grid.style.pointerEvents = "none"
    grid.livelyAcceptsDrop = function() {}
    
    lively.setExtent(documentGrid, pt(width , height))

    documentGrid.documentSquare = this.showDocumentGridItem(pt(0, 0), 
          "rgba(250,250,240,0.5)", "0.5px solid rgb(50,50,50)", 4000, 2000, documentGrid )

    documentGrid.documentSquare.livelyAcceptsDrop = function() {}

    documentGrid.grid = grid
    documentGrid.appendChild(grid)
    lively.setPosition(grid, pt(0,0))
    
    // for (var k=0; k < w; k += gridSize) {
    //   for (var l=0; l < h; l += gridSize) {
    //     this.showDocumentGridItem(pt(k, l), 
    //       undefined, "0.2px dashed rgb(190,190,190)", gridSize, gridSize, grid)
    //   }  
    // }
    ViewNav.updateDocumentGrid(target.documentGrid, target)
  }
  
  static hideDocumentGrid(target) {
    if (!target) return;
    
    target.querySelectorAll(".document-grid").forEach(ea => {
      ea.remove()
    })
  }
  
  static resetView() {
    lively.setGlobalPosition(document.body, pt(0,0));
  }
} 

if (window.lively) {
  try {
  ViewNav.enable(document.body)
  ViewNav.hideDocumentGrid(document.body)
  ViewNav.showDocumentGrid(document.body)
  } catch(e) {
    lively.showError(e)
  }
}


