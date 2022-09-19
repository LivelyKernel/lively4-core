import HaloItem from 'src/components/halo/lively-halo-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'
import {pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import Strings from 'src/client/strings.js';

import {default as HaloService} from "src/components/halo/lively-halo.js"

export default class HaloHandleItem extends HaloItem {
  
  get isMetaNode() {
    return true
  }
  
  initialize() {
    lively.addEventListener("Morphic", this, 'mousedown',  e => this.onMouseDown(e));
  }

  onMouseDown(evt) {
    HaloService.isDragging  =true
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
    
    if(this.halo.info)
      this.halo.info.stop();
    this.halo.info = lively.showInfoBox(this.target)
    this.halo.info.update()

    if (this.target.haloResizeStart) {
      this.target.haloResizeStart(evt, this)
    } else {
      this.initialBounds = lively.getBounds(this.target)
      this.eventOffset = events.globalPosition(evt)
      this.removeRestrictions(this.target)
    }
  }

  move(evt) {
    
    evt.preventDefault();
    
    var delta = events.globalPosition(evt).subPt(this.eventOffset)

    var cornerOrSide = this.id
    var newPos = this.initialBounds[cornerOrSide]().addPt(delta).rounded()
    
    newPos = Grid.optSnapPosition(newPos, evt) 

    var newBounds = this.initialBounds[Strings.prefixSelector("with", cornerOrSide)](newPos)

    if ( this.target.style.position == "absolute") {
      lively.setBounds(this.target, newBounds)
    } else {
      
      // this.target.style.left  =  + "px"
      // this.target.style.top  = ( newBounds.y - this.initialBounds.y) + "px"
      lively.setPosition(this.target, 
        newBounds.topLeft().subPt(this.initialBounds.topLeft()), "relative")
      
      lively.setExtent(this.target, pt(newBounds.width, newBounds.height))
    }
    
    if(!evt.altKey && this.target.style.position == "absolute") {
       this.snapping.snapBounds(cornerOrSide)
    }
    
    this.halo.info.innerHTML = `${newPos.x}, ${newPos.y}`
    HaloService.showHalos(window.that);
  
  }

  stop(evt) {
    HaloService.isDragging = false
    this.halo.info.stop()
    evt.preventDefault();
  }

  removeRestrictions(node) {
    node.style.minWidth = null;
    node.style.minHeight = null;
    node.style.maxWidth = null;
    node.style.maxHeight = null;
  }
    
}