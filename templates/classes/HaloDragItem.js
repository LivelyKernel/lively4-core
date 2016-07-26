import lively from 'src/client/lively.js'

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';

import HaloItem from './HaloItem.js';

export default class HaloDragItem extends HaloItem {
  
  
  startCustomDragging() {
    lively.removeEventListener("Drag", this, 'mousedown');
    lively.removeEventListener("Drag", this, 'mouseup');
    lively.addEventListener("Drag", this, 'mousedown',  e => this.startCustomDrag(e));
    lively.addEventListener("Drag", this, 'mouseup', e => this.stopCustomDrag(e) );
  }
 
  startCustomDrag(evt) {
    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.removeEventListener("Drag", document.body, 'mousemove')
    lively.addEventListener("Drag", document.body, 'mousemove', (dragEvt) => {
      this.move(dragEvt);
      // update position of halos on mousemove
      HaloService.showHalos(window.that);
    });
  }
  
  stopCustomDrag(evt) {
     // save this as dragging.stop will overwrite the current value
      var wasDragging = this.isDragging;

      this.stop(evt);
      // detach mousemove handler from body
      lively.removeEventListener("Drag", document.body, 'mousemove')
    
      if (wasDragging) {
        HaloService.showHalos(window.that);
        evt.stopPropagation();
      }
  }
  
  
  initialize() {
    this.startCustomDragging()
  }

  tearDownDragging() {
    this.dragTarget = null;
    this.dragStartEventPosition = null;
    this.dragStartNodePosition = null;
  }
  
  initDraggingAtEvent(anEvent) {
    // window.anEvent = anEvent
    // dragTarget = that
    this.dragStartNodePosition = nodes.getPosition(this.dragTarget);
    this.dragStartEventPosition = events.globalPosition(anEvent);
    anEvent.preventDefault();
  }
  
  startOffsetDragging(anEvent) {
    if (!this.isDragging 
      && events.noticableDistanceTo(anEvent, this.dragStartEventPosition)) {
      this.dragTarget.style.position = 'absolute';
      this.isDragging = true;
    }
  }
  
  dragTo(anEvent) {
    var eventPosition = events.globalPosition(anEvent);
    var newPosition = {
      x: eventPosition.x - this.dragStartEventPosition.x + this.dragStartNodePosition.x,
      y: eventPosition.y - this.dragStartEventPosition.y + this.dragStartNodePosition.y
    }
    nodes.setPosition(this.dragTarget, newPosition);
    anEvent.preventDefault();
  }
  
  stopDraggingAtEvent(anEvent) {
    this.isDragging = false;
    anEvent.preventDefault();
  }

  start(e) {
    this.dragTarget = window.that;
    if (this.dragTarget) {
      this.initDraggingAtEvent(e);
    }
  }
  
  move(e) {
    if (this.dragTarget) {
      this.startOffsetDragging(e);
    }
    if (this.isDragging) {
      this.dragTo(e);
    }
  }
   
  stop(e) {
    if (this.isDragging) {
      this.stopDraggingAtEvent(e);
    }
    this.tearDownDragging();
  }

}
