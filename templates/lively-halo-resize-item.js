import HaloItem from './HaloItem.js';
import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'
import {Grid, pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import Snapping from "src/client/morphic/snapping.js"


export default class HaloResizeItem extends HaloItem {
  initialize() {
    lively.addEventListener("Morphic", this, 'mousedown',  e => this.onMouseDown(e));
  }

  onMouseDown(evt) {
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.addEventListener("HaloResize", document.body.parentElement, 'pointermove', (evt) => {
      this.move(evt);
    });
    // and capture the following mouse up anywere 
    lively.addEventListener("HaloResize", document.body.parentElement, 'pointerup',  e => this.onPointerUp(e));
  }

  onPointerUp(evt) {
    lively.removeEventListener("HaloResize", document.body.parentElement, 'pointerup');
    lively.removeEventListener("HaloResize", document.body.parentElement, 'pointermove');

    this.stop(evt);
  }

  start(evt) {
    evt.preventDefault();
    this.target = window.that
    this.snapping = new Snapping(this.target) 
   
    this.info = lively.showInfoBox(this.target)

    if (this.target.haloResizeStart) {
      this.target.haloResizeStart(evt, this)
    } else {
      this.initialExtent  = nodes.getExtent(this.target)
      this.eventOffset  = events.globalPosition(evt)
      this.removeRestrictions(this.target)
    }
  }

  move(evt) {
    
    evt.preventDefault();
    if (this.target.haloResizeMove) {
      this.target.haloResizeMove(evt, this)
    } else {
      var delta = events.globalPosition(evt).subPt(this.eventOffset)
      console.log("this.initialExtent " + this.initialExtent)

      var newextent =  this.initialExtent.addPt(delta);
      newextent = newextent.rounded()
      nodes.setExtent(this.target, Grid.optSnapPosition(newextent, evt)) 
      this.snapping.snapBounds("bottmRight")
      
      this.info.innerHTML = "resize w=" + newextent.x + " w=" + newextent.y 

      HaloService.showHalos(window.that);
    }
  }

  stop(evt) {
    this.info.stop()
    evt.preventDefault();
    if (this.target.haloResizeStop) {
      this.target.haloResizeStop(evt, this)
    } else {
      // do nothing... anymore
    }
  }

  removeRestrictions(node) {
    node.style.minWidth = null;
    node.style.minHeight = null;
    node.style.maxWidth = null;
    node.style.maxHeight = null;
  }
    
}