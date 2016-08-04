
import HaloItem from './HaloItem.js';

import * as nodes from 'src/client/morphic/node-helpers.js'
import * as events from 'src/client/morphic/event-helpers.js'


export default class HaloResizeItem extends HaloItem {
  initialize() {
    lively.addEventListener("Morphic", this, 'mousedown',  e => this.onMouseDown(e));
  }

  onMouseDown(evt) {
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.addEventListener("HaloResize", document, 'mousemove', (evt) => {
      this.move(evt);
    });
    // and capture the following mouse up anywere 
    lively.addEventListener("HaloResize", document.body, 'mouseup',  e => this.onMouseUp(e));
  }

  onMouseUp(evt) {
    lively.removeEventListener("HaloResize", document.body, 'mouseup');
    lively.removeEventListener("HaloResize", document, 'mousemove');
    this.stop(evt);
  }

  start(evt) {
    evt.preventDefault();

    this.target = window.that
    this.initialExtent  = nodes.getExtent(this.target)
    this.eventOffset  = events.globalPosition(evt)
  
    this.removeRestrictions(this.target)
  }

  stop(e) {
    e.preventDefault();
    this.resizing = false;
  }

  move(evt) {
    evt.preventDefault();
    var delta = events.globalPosition(evt).subPt(this.eventOffset)
    console.log("this.initialExtent " + this.initialExtent)
    nodes.setExtent(this.target, this.initialExtent.addPt(delta)) 
    HaloService.showHalos(window.that);
  }

  removeRestrictions(node) {
    node.style.minWidth = null;
    node.style.minHeight = null;
    node.style.maxWidth = null;
    node.style.maxHeight = null;
  }
    
    
}