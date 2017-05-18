import lively from 'src/client/lively.js'
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from './HaloItem.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';

export default class HaloDragItem extends HaloItem {

  initialize() {
    this.startCustomDragging()
  }

  // Drag API
  start(evt) {
    this.dragTarget = window.that;
    if (this.dragTarget) {
      this.dragStartNodePosition = lively.getPosition(this.dragTarget);
      this.dragStartEventPosition = events.globalPosition(evt);
      evt.preventDefault();
    
     this.snapping = new Snapping(this.dragTarget) 
     this.halo.info =  lively.showInfoBox(this.dragTarget)
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
    this.halo.info.stop()
    //  STOP DRAGGING
    if (this.isDragging) {    
      this.isDragging = false;
      evt.preventDefault();
    }
    this.dragTarget = null;
    this.dragStartEventPosition = null;
    this.dragStartNodePosition = null;
    this.snapping.clearHelpers()
    this.snapping = null
  }

  dragTo(evt) {
    if (this.dragTarget.haloDragTo) {
      this.dragTarget.haloDragTo(events.globalPosition(evt), this.dragStartEventPosition)
    } else {
      var eventPos = events.globalPosition(evt);
      var newPosition = eventPos.subPt(this.dragStartEventPosition).
        addPt(this.dragStartNodePosition)
        
      newPosition = newPosition.rounded()
      lively.setPosition(this.dragTarget, Grid.optSnapPosition(newPosition, evt));
      if(!evt.altKey) {
        this.snapping.snap()
      }
      this.halo.info.innerHTML = "drag " + lively.getPosition(this.dragTarget)
    }
    evt.preventDefault();
  }
}