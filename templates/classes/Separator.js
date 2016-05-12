'use strict';

import Morph from './Morph.js';

export default class Separator extends Morph {
  initialize() {
    this.addEventListener('dragstart', evt => this.onDragStart(evt))
    this.addEventListener('drag', evt => this.onDrag(evt))
    this.addEventListener('dragend', evt => this.onDragEnd(evt))
    this.draggable = true;
  }

  getLeftTarget() {
    return this.parentElement.querySelector(this.getAttribute("leftselector"))
  }

  onDragStart(evt) {
    this.originalWidth =  this.getLeftTarget().getBoundingClientRect().width
    this.dragOffset = evt.clientX
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
  }
  
  onDrag(evt) {
    if (!evt.clientX) return
    var delta = evt.clientX - this.dragOffset
    this.getLeftTarget().style.width = Math.max(this.originalWidth + delta, 0);
  }
  
  onDragEnd(evt) {
    // Do nothing... 
  }

}
