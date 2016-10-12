import lively from 'src/client/lively.js'
import Morph from './Morph.js'

import Halo from './lively-halo.js';


/*
 * HaloItem are buttons layouted in from o halo around the object 
 */

export default class HaloItem extends Morph {
  
  get isMetaNode() { return true}
  
  initialize() {
    // super.initialize()
    this.registerMouseEvents()
  }

  hideHalo() {
    Halo.hideHalos()
  }

  registerMouseEvents() {
    this.registerEvent('click', 'onClick')
    this.registerEvent('mousedown', 'onMouseDown')
    this.registerEvent('mouseUp', 'onMouseUp')
  }
  
  registerEvent(eventName, methodName) {
    if (this[methodName]) {
      lively.removeEventListener('Morphic', this, eventName)
      lively.addEventListener('Morphic', this, eventName, 
        e => this[methodName](e))
    }  
  }
  
  startCustomDragging() {
    lively.removeEventListener("Drag", this, 'mousedown');
    lively.addEventListener("Drag", this, 'mousedown',  e => this.startCustomDrag(e));
  }
 
  startCustomDrag(evt) {
    lively.removeEventListener("Drag", document, 'mouseup');
    lively.addEventListener("Drag", document, 'mouseup', e => this.stopCustomDrag(e) );

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
      lively.removeEventListener("Drag", document, 'mouseup');
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

  
}
