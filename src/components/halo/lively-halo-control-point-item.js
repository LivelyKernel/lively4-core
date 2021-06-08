import HaloItem from 'src/components/halo/lively-halo-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'
import {pt} from 'src/client/graphics.js';
import {Grid} from 'src/client/morphic/snapping.js';
import Strings from 'src/client/strings.js';
import SVG from "src/client/svg.js"
import _ from 'src/external/lodash/lodash.js'

export default class HaloControlPointItem extends HaloItem {
  
  get isMetaNode() {
    return true
  }
  
  initialize() {
    lively.addEventListener("Morphic", this, 'pointerdown',  e => this.onMouseDown(e));
  }
  
  setup(halo, path, index) {
    this.halo = halo
    this.path = path
    this.index = index
    lively.setPosition(this, pt(0,0))
//    this.offset = lively.getGlobalPosition(this.path.parentElement).subPt(lively.getGlobalPosition(this))
    this.offset = lively.getGlobalPosition(this.path)
      .subPt(lively.getGlobalPosition(this))
    this.updatePosition()
    if (this.isConnector) {
      this.get("#shape").classList.add("connector")
    } 
    if (this.curveIndex > 1) {
      this.get("#shape").classList.add("curve")
    }

  }
  
  getCurvePoint(cp, curveIndex) {
    if (curveIndex === undefined) curveIndex = 1;
    return pt(cp["x" + curveIndex],cp["y" + curveIndex])
  }
  
 
  setCurvePoint(cp, curveIndex, pos) {
    if (curveIndex === undefined) curveIndex = 1;
    cp["x" + curveIndex] = pos.x 
    cp["y" + curveIndex] = pos.y  
  }
  
  updatePosition() {
    var v = SVG.getPathVertices(this.path)
    var cp = v[this.index]
    let cpPos = this.getCurvePoint(cp, this.curveIndex)
    lively.setPosition(this, this.offset.addPt(cpPos))
    // lively.showPoint(lively.getGlobalPosition(this))
  }

  onMouseDown(evt) {
    evt.preventDefault();
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.addEventListener("HaloControlPoint", document.documentElement, 'pointermove', (evt) => {
      evt.preventDefault();
      this.move(evt);
    });
    // and capture the following mouse up anywere 
    lively.addEventListener("HaloControlPoint", document.documentElement, 'pointerup',  e => this.onPointerUp(e));
  }

  onPointerUp(evt) {
    lively.removeEventListener("HaloControlPoint", document.documentElement);
    this.stop(evt);
  }

  start(evt, target) {    
    this.target = target || window.that
    // lively.notify("svg start " + lively.getPosition(this.target))

    // this.snapping = new Snapping(this.target) 
    if (evt.shiftKey && evt.ctrlKey) {
      this.addCurvePoint(evt)
    } else if (evt.shiftKey) {
      this.addControlPoint(evt)
    } else if (evt.ctrlKey) {
      this.removeControlPoint(evt)     
    }
    
    this.vertices = SVG.getPathVertices(this.path)
    var cp = this.vertices[this.index]
    if (!cp) return
    
    this.original = this.getCurvePoint(cp, this.curveIndex)
    // lively.notify("original " + this.original)
    
    this.eventOffset = events.globalPosition(evt)
    // lively.notify("eventOffset " + this.eventOffset)

    if (this.halo) {
      this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
        ea.style.visibility = "hidden"
        // if (ea !== this) ea.style.visibility = "hidden"
      })      
    }
    
    // this.halo.shadowRoot.querySelectorAll("lively-halo-control-point-item").forEach(ea => {
    //  ea.style.visibility = "hidden"
    //   // if (ea !== this) ea.style.visibility = "hidden"
    // })

    this.style.pointerEvents = "none"

    this.targetPointerEvents = this.target.style.pointerEvents
    this.target.style.pointerEvents = "none"; // disable mouse events while dragging...
    
    if (this.isConnector) {
      // lively.notify("find target")
      this.findTargetAt(evt)
    }
  }
  
  addCurvePoint() {
    this.vertices = SVG.getPathVertices(this.path)
    var cp = this.vertices[this.index]
    var curvePoint = Object.assign({}, cp)
    curvePoint.c = "Q"
    curvePoint.x2 = cp.x1
    curvePoint.x2 = cp.x2
    this.curveIndex = 2
    this.vertices.splice(this.index, 0, curvePoint) 
    SVG.setPathVertices(this.path, this.vertices)
  }
  
  
  addControlPoint() {
    this.vertices = SVG.getPathVertices(this.path)
    var cp = this.vertices[this.index]
    var cp2 = Object.assign({}, cp)
    cp2.c = "L"
    this.vertices.splice(this.index + 1, 0, cp2) 
    SVG.setPathVertices(this.path, this.vertices)
    this.index++
  }

  removeControlPoint() {
    this.vertices = SVG.getPathVertices(this.path)
    if (this.index == 0) {
      this.vertices[1].c = "M" // the first one has to be M
    }
    
    if (this.curveIndex > 1) {
      var cp = this.vertices[this.index]
      cp.c = "L"
      delete cp.x2
      delete cp.y2
      delete cp.x3
      delete cp.y2
    } else {
      this.vertices.splice(this.index, 1)     
    }
    SVG.setPathVertices(this.path, this.vertices)
    this.remove()
  }

  
  showHighlight(element) {
    this.highlight = lively.showElement(element,100000)
    this.highlight.innerHTML = "" + element.id
    lively.moveBy(this.highlight, pt(-2,-2))
    this.highlight.style.border = "1px dashed rgba(0,0,100,0.5)"
    lively.setExtent(this.highlight, lively.getExtent(this.highlight).addPt(pt(2,2)))
    return this.highlight
  }

  hideHighlight() {
    if (this.highlight) this.highlight.remove();
  }

  findTargetAt(evt, world=document.body) {
    this.hideHighlight()
    
    // does only work with "mousemove" but not with "pointermove"
    // var element = evt.composedPath().find(ea => {
    //   lively.showElement(ea)
    //   return ea.classList && ea.classList.contains("lively-content") && ea !== this 
    // }) 
    var p = pt(evt.clientX, evt.clientY)
    var element
    world.querySelectorAll(".lively-content, lively-table").forEach(ea => {
      if (ea.tagName !== "LIVELY-CONNECTOR" && 
          lively.getGlobalBounds(ea).containsPoint(p)) element = ea;
    })
    
    if (element) {
      this.showHighlight(element)
      this.targetElement = element
    } else {
      if (this.targetElement) this.targetElement = null
    }
    return element
  }

  findControlPoints(evt, world=document.body) {
    var controlPoints = []
    
    world.querySelectorAll(":not(marker) > path").forEach(eaPath => {
      var offset = lively.getGlobalPosition(eaPath.parentElement)
      SVG.getPathVertices(eaPath).forEach((ea, index) => {
        if (this.path == eaPath && index == this.index) {
           // ignore me
        } else {
          controlPoints.push(offset.addPt(pt(ea.x1, ea.y1)))
        }
        
      })
    })
    return controlPoints
  }

  move(evt) {
    // lively.notify("svg " + lively.getPosition(this.target))

    const snapRange = 20; // #TODO make preference
    
    var world = lively.findWorldContext(this.target)
    if (!this.original) return
    
    lively.setGlobalPosition(lively.hand, pt(evt.clientX, evt.clientY))
    
    // non-connector path
    var delta = events.globalPosition(evt).subPt(this.eventOffset)

    var newPos = pt(this.original.x + delta.x, this.original.y + delta.y)
    if (!evt.ctrlKey) { // #TODO alt does not work with pointer events
      newPos = Grid.snapPt(newPos, 10, 5) 
    }
    
   //  lively.notify("newPos " + newPos)
    this.setVerticePosition(newPos)
    
    if (this.isConnector) {
      this.findTargetAt(evt, world)
      // lively.showPoint(pt(evt.clientX, evt.clientY))

      var connectMethod = this.index == 0 ? "connectFrom" : "connectTo";
      if (this.targetElement) {
        this.target[connectMethod](this.targetElement); 
        this.style.visibility = "hidden"
      } else {
        this.style.visibility = "visible"
        this.target[connectMethod](lively.hand); 
      } 
    } else {
      var points = this.findControlPoints(world)
      var myPos = lively.getGlobalPosition(this)
      var pointsDist = points.map(ea => {return {point: ea, dist: ea.dist(myPos)}})
      
      
      if (!evt.ctrlKey) {
        var nearPoints = _.sortBy(pointsDist.filter(ea => ea.dist < snapRange), ea => ea.dist).map(ea => ea.point)

        // nearPoints.forEach(ea => lively.showPoint(ea))
        if (nearPoints[0]) {
          // lively.showPoint(nearPoints[0])
          var p = nearPoints[0].subPt(lively.getGlobalPosition(this.path.parentElement))
          this.setVerticePosition(p)

        }        
      }
      
    }
  }

  setVerticePosition(pos) {
    if (!this.vertices)
      this.vertices = SVG.getPathVertices(this.path);
    var cp = this.vertices[this.index]
    if (!cp) return;
    this.setCurvePoint(cp, this.curveIndex, pos)
    SVG.setPathVertices(this.path, this.vertices)
    this.updatePosition()
  }

  stop(evt) {
    this.hideHighlight()
    this.style.pointerEvents = null
    this.target.style.pointerEvents = this.targetPointerEvents; // receive mouse events again
    
    if (this.targetElement) {
        var connectMethod = this.index == 0 ? "connectFrom" : "connectTo";
        if (this.target[connectMethod]) {
          this.target[connectMethod](this.targetElement) 
        }
    } else {
        var disconnectMethod = this.index == 0 ? 
            "disconnectFromElement" : "disconnectToElement";
        if (this.target[disconnectMethod]) {
          this.target[disconnectMethod](this.targetElement) 
        }
    }
    if (this.isConnector) {
      this.target.resetBounds()
    } else {
      this.resetBounds(this.path)
    }
    if (this.halo) {
      this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
        if (ea !== this) ea.style.visibility = null
      })      
    }

    HaloService.showHalos(window.that);

    // this.halo.info.stop()
    evt.preventDefault();
    evt.stopPropagation()
  }

  resetBounds(path) {
    // assuming `svg.style.overflow == "visible"` during move
    var svg = path.parentElement
    // lively.showElement(svg)

    SVG.resetBounds(svg, path)
    lively.setExtent(this, lively.getExtent(svg))
    var pos = lively.getPosition(svg)
    lively.moveBy(this, pos)
    // lively.setPosition(svg, pt(0,0))
  }
  
    
}