import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from 'src/components/halo/lively-halo-item.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import { getTempKeyFor, asDragImageFor } from 'utils';

import {default as HaloService} from "src/components/halo/lively-halo.js"

export default class HaloVivideAddOutportItem extends HaloItem {

  initialize() {
    this.style['user-select'] = 'none';
    this.setAttribute('draggable', "true");
    this.style['user-drag'] = 'element';
    this.addEventListener('dragstart', evt => this.startMyDrag(evt));
    this.addEventListener('drag', evt => {
      lively.warn('drag');
    });
    this.addEventListener('dragend', evt => {
      HaloService.hideHalos();
    });
  }
  
  startMyDrag(evt) {
    if(!this._view) {
      lively.warn('No view given to add a connection.')
      return;
    }
    evt.stopPropagation();
    // preventDefault is harmful here: it prevents drag data and images
    
    this._view.addDragInfoTo(evt);
    const { x, y } = pt(evt.clientX, evt.clientY).subPt(lively.getClientPosition(this));
    this::asDragImageFor(evt, x, y);
  }

//   // Drag API
//   start(evt) {
//     return lively.warn('start')
//     this.dragTarget = window.that;
//     if (this.dragTarget) {
//       this.dragStartNodePosition = lively.getPosition(this.dragTarget);
//       this.dragStartEventPosition = events.globalPosition(evt);
//       evt.preventDefault();
    
//       this.snapping = new Snapping(this.dragTarget) 
//       this.halo.info =  lively.showInfoBox(this.dragTarget)
     
//       if (this.dragTarget.haloDragStart) {
//         this.dragTarget.haloDragStart(this.dragStartEventPosition)
//       }
//     }
//   }
  
//   move(evt) {
//     return lively.warn('move')
//     if (this.dragTarget && !this.isDragging && 
//       events.noticableDistanceTo(evt, this.dragStartEventPosition)) {
//       // this.dragTarget.style.position = 'absolute';
//       this.isDragging = true;
//     }
//     if (this.isDragging) {
//       this.dragTo(evt);
//     }
//   }
   
//   stop(evt) {
//     return lively.warn('stop')
//     this.halo.info.stop()
//     //  STOP DRAGGING
//     if (this.isDragging) {    
//       this.isDragging = false;
//       evt.preventDefault();
//     }
//     this.dragTarget = null;
//     this.dragStartEventPosition = null;
//     this.dragStartNodePosition = null;
//     this.snapping.clearHelpers()
//     this.snapping = null
//   }

//   dragTo(evt) {
//     return lively.warn('dragTo')
//     if (this.dragTarget.haloDragTo) {
//       this.dragTarget.haloDragTo(events.globalPosition(evt), this.dragStartEventPosition)
//     } else {
//       var eventPos = events.globalPosition(evt);
//       var newPosition = eventPos.subPt(this.dragStartEventPosition).
//         addPt(this.dragStartNodePosition)
        
//       newPosition = newPosition.rounded()
//       if (this.dragTarget.style.position == "absolute") {
//         lively.setPosition(this.dragTarget, Grid.optSnapPosition(newPosition, evt));
//         if(!evt.altKey) {
//           this.snapping.snap()
//         }
//       } else {
//          lively.setPosition(this.dragTarget, newPosition, "relative");
//       }
//       this.halo.info.innerHTML = "drag " + lively.getPosition(this.dragTarget)
//     }
//     evt.preventDefault();
//   }
  
  updateTarget(view) {
    this._view = view;
  }
}