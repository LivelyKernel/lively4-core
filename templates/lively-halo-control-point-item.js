import HaloItem from './HaloItem.js';
import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'
import {pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import Strings from 'src/client/strings.js';
import svg from "src/client/svg.js"

export default class HaloControlPointItem extends HaloItem {
  
  get isMetaNode() {
    return true
  }
  
  initialize() {
    lively.addEventListener("Morphic", this, 'mousedown',  e => this.onMouseDown(e));
  }
  
  setup(halo, path, index) {
    this.halo = halo
    this.path = path
    this.index = index
    lively.setPosition(this, pt(0,0))
    this.offset = lively.getGlobalPosition(this.path).subPt(lively.getGlobalPosition(this))
    this.updatePositon()
  }
  
  updatePositon() {
    var v = svg.getPathVertices(this.path)
    var cp = v[this.index]
    lively.setPosition(this, this.offset.addPt(pt(cp.x1, cp.y1)))
    //lively.setGlobalPosition(this, pt(0,0))
    
    // lively.setPosition(this, pt(0,0))
    
    
  }

  onMouseDown(evt) {
    evt.preventDefault();
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.addEventListener("HaloControlPoint", document.body.parentElement, 'mousemove', (evt) => {
      evt.preventDefault();
      this.move(evt);
    });
    // and capture the following mouse up anywere 
    lively.addEventListener("HaloControlPoint", document.body.parentElement, 'mouseup',  e => this.onPointerUp(e));
  }

  onPointerUp(evt) {
    lively.removeEventListener("HaloControlPoint", document.body.parentElement);
    lively.removeEventListener("HaloControlPoint", document.body.parentElement);

    this.stop(evt);
  }

  start(evt, target) {
    this.target = target || window.that
    // this.snapping = new Snapping(this.target) 
    
    this.vertices = svg.getPathVertices(this.path)
    var cp = this.vertices[this.index]
    this.original = pt(cp.x1, cp.y1)
    this.eventOffset = events.globalPosition(evt)

    this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
      if (ea !== this) ea.style.visibility = "hidden"
    })
    this.style.pointerEvents = "none"

    this.targetPointerEvents = this.target.style.pointerEvents
    this.target.style.pointerEvents = "none"; // disable mouse events while dragging...
    
    
    this.findTargetAt(evt) 
  }

  showHighlight(element) {
    this.highlight = lively.showElement(that,100000)
    this.highlight.innerHTML = ""
    lively.moveBy(this.highlight, pt(-2,-2))
    this.highlight.style.border = "1px dashed rgba(0,0,100,0.5)"
    lively.setExtent(this.highlight, lively.getExtent(this.highlight).addPt(pt(2,2)))
    return this.highlight
  }

  hideHighlight() {
    if (this.highlight) this.highlight.remove();
  }

  findTargetAt(evt) {
    this.hideHighlight()
    var element = evt.path.find(ea => 
      ea.classList && ea.classList.contains("lively-content") && ea !== this)
    if (element) {
      this.showHighlight()
      this.targetElement = element
    } else {
      if (this.targetElement) this.targetElement = null
    }
  }

  move(evt) {
    var delta = events.globalPosition(evt).subPt(this.eventOffset)
    this.findTargetAt(evt) 
    this.setVerticePosition(pt(this.original.x + delta.x, this.original.y + delta.y))
  }

  setVerticePosition(pos) {
    if (!this.vertices)
      this.vertices = svg.getPathVertices(this.path);
    
    var cp = this.vertices[this.index]
    cp.x1 = pos.x 
    cp.y1 = pos.y
    svg.setPathVertices(this.path, this.vertices)
    this.updatePositon()
  }

  stop(evt) {
    this.hideHighlight()
    this.style.pointerEvents = null
    this.target.style.pointerEvents = this.targetPointerEvents; // receive mouse events again
    
    if (this.targetElement) {
      if (this.index == 0) {
        this.target.connectFrom(this.targetElement)
      } else {
        this.target.connectTo(this.targetElement)
      } 
    } else {
      if (this.index == 0) {
        this.target.disconnectFromElement()
      } else {
        this.target.disconnectToElement()
      } 
    }
    
    this.target.resetBounds()
    this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
      if (ea !== this) ea.style.visibility = null
    })

    HaloService.showHalos(window.that);

    // this.halo.info.stop()
    evt.preventDefault();
    evt.stopPropagation()
  }

    
}