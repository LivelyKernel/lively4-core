/*
 * Abstract HaloItem class, that is used for elements/buttons in Halo
 */
import lively from 'src/client/lively.js'
import Morph from 'src/components/widgets/lively-morph.js'

import Halo from 'src/components/halo/lively-halo.js';

import {default as HaloService} from "src/components/halo/lively-halo.js"

/*
 * HaloItem are buttons layouted in from o halo around the object 
 */

export default class HaloItem extends Morph {
  
  get isHaloItem() { return true}
  
  get isMetaNode() { return true}
  
  get halo() {
    return this.parentElement
  }
  
  set halo(v) {
    // nothing to set here any more
  }
  
  
  initialize() {
    // super.initialize()
    this.registerMouseEvents()
  }

  hideHalo() {
    Halo.hideHalos()
  }

  registerMouseEvents() {
    this.registerEvent('click', 'onClick')
    this.registerEvent('pointerdown', 'onMouseDown')
    this.registerEvent('pointerup', 'onMouseUp')
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
    HaloService.isDragging = true;
    lively.removeEventListener("Drag", document, 'mouseup');
    lively.addEventListener("Drag", document, 'mouseup', e => this.stopCustomDrag(e) );

    this.start(evt);

    // attach mousemove handler to body only after mousedown occured
    lively.removeEventListener("Drag", document.body.parentElement, 'mousemove')
    lively.addEventListener("Drag", document.body.parentElement, 'mousemove', (dragEvt) => {
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
    lively.removeEventListener("Drag", document.body.parentElement, 'mousemove')

    if (wasDragging) {
      HaloService.showHalos(window.that);
      evt.stopPropagation();
    }
    HaloService.isDragging  = false 
  }

  
}
