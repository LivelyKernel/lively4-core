import lively from 'src/client/lively.js'

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';

import {pt} from 'src/client/graphics.js'

import HaloItem from './HaloItem.js';

export default class HaloDragItem extends HaloItem {

  initialize() {
    this.startCustomDragging()
  }

  // Drag API
  start(evt) {
    this.dragTarget = window.that;
    if (this.dragTarget) {
      this.dragStartNodePosition = nodes.getPosition(this.dragTarget);
      this.dragStartEventPosition = events.globalPosition(evt);
      evt.preventDefault();
    }
  }
  
  move(evt) {
    if (this.dragTarget && !this.isDragging && 
      events.noticableDistanceTo(evt, this.dragStartEventPosition)) {
      this.dragTarget.style.position = 'absolute';
      this.isDragging = true;
    }
    if (this.isDragging) {
      this.dragTo(evt);
    }
  }
   
  stop(evt) {
    //  STOP DRAGGING
    if (this.isDragging) {    
      this.isDragging = false;
      evt.preventDefault();
    }
    this.dragTarget = null;
    this.dragStartEventPosition = null;
    this.dragStartNodePosition = null;
  }

  dragTo(evt) {
    if (this.dragTarget.haloDragTo) {
      this.dragTarget.haloDragTo(events.globalPosition(evt), this.dragStartEventPosition)
    } else {
      var eventPos = events.globalPosition(evt);
      var newPosition = eventPos.subPt(this.dragStartEventPosition).addPt(this.dragStartNodePosition)
      // {
      //   x: eventPosition.x - this.dragStartEventPosition.x + this.dragStartNodePosition.x,
      //   y: eventPosition.y - this.dragStartEventPosition.y + this.dragStartNodePosition.y
      // }
      nodes.setPosition(this.dragTarget, newPosition);
    }
    evt.preventDefault();
  }
  


}
