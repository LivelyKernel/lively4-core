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
    // var pos = lively.getGlobalPosition(path)
    this.offset = pt(30,30) // #TODO compute offset
    
    this.updatePositon()
  }
  
  updatePositon() {
    var v = svg.getPathVertices(this.path)
    var cp = v[this.index]
    lively.setPosition(this, this.offset.addPt(pt(cp.x1, cp.y1)))
  }

  onMouseDown(evt) {
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.addEventListener("HaloControlPoint", document.body.parentElement, 'mousemove', (evt) => {
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

  start(evt) {
    evt.preventDefault();
    this.target = window.that
    // this.snapping = new Snapping(this.target) 
    
    this.vertices = svg.getPathVertices(this.path)
    var cp = this.vertices[this.index]
    this.original = pt(cp.x1, cp.y1)
    this.eventOffset = events.globalPosition(evt)

    this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
      if (ea !== this) ea.style.visibility = "hidden"
    })
  }

  move(evt) {
    
    evt.preventDefault();
    var delta = events.globalPosition(evt).subPt(this.eventOffset)

    var cp = this.vertices[this.index]
    cp.x1 = this.original.x + delta.x
    cp.y1 = this.original.y + delta.y
    
    svg.setPathVertices(this.path, this.vertices)

    this.updatePositon()
    
    // this.halo.info.innerHTML = `${newPos.x}, ${newPos.y}`
    // HaloService.showHalos(window.that);
  }

  stop(evt) {
    svg.resetBounds(window.that, this.path)
    this.halo.shadowRoot.querySelectorAll(".halo").forEach(ea => {
      if (ea !== this) ea.style.visibility = null
    })

    HaloService.showHalos(window.that);

    // this.halo.info.stop()
    evt.preventDefault();
    evt.stopPropagation()
  }

    
}