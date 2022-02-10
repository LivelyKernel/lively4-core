import HaloItem from 'src/components/halo/lively-halo-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'
import {pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import {default as HaloService} from "src/components/halo/lively-halo.js"

/*globals that */

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
    
    if (!this.halo) {
      console.error("this.halo dont defined....")
      return
    }
    
    
    if(this.halo.info)
      this.halo.info.stop();
    this.halo.info = lively.showInfoBox(this.target)
    this.halo.info.update()

    if (this.target.haloResizeStart) {
      this.target.haloResizeStart(evt, this)
    } else {
      this.initialExtent  = lively.getExtent(this.target)
      this.eventOffset  = events.globalPosition(evt)
      this.removeRestrictions(this.target)
    }
  }

  move(evt) {
    
    evt.preventDefault();
    if (this.target.haloResizeMove) {
      this.target.haloResizeMove(evt, this)
    } else {
      var delta = pt(evt.clientX, evt.clientY).subPt(this.eventOffset)
      // console.log("this.initialExtent " + this.initialExtent)

      var newextent =  this.initialExtent.addPt(delta);
      newextent = newextent.rounded()

      lively.setExtent(this.target, Grid.optSnapPosition(newextent, evt)) 
      if(!evt.altKey && that.style.position == "absolute") {
        this.snapping.snapBounds("bottomRight")
      }
      newextent = lively.getExtent(this.target)
      this.halo.info.innerHTML = "resize w=" + newextent.x + " h=" + newextent.y 

      HaloService.showHalos(window.that);
    }
  }

  stop(evt) {
    this.halo.info.stop()
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