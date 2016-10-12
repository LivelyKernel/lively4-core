'use strict';

import Morph from './Morph.js';

export default class Separator extends Morph {
  initialize() {
    // console.log("intialize separator " )
    this.draggable = true;
    lively.addEventListener('lively', this,'dragstart', evt => this.onDragStart(evt));
    lively.addEventListener('lively', this,'drag', evt => this.onDrag(evt));
    lively.addEventListener('lively', this,'dragend', evt => this.onDragEnd(evt));
  }

  getLeftTarget() {
    return this.parentElement.querySelector(this.getAttribute("leftselector"))
  }

  onDragStart(evt) {
    // console.log("[separator] dragStart")
    this.originalWidth =  this.getLeftTarget().getBoundingClientRect().width
    this.dragOffset = evt.clientX
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    
    evt.stopPropagation();
  }
  
  onDrag(evt) {
    // console.log("[separator] drag")
    if (!evt.clientX) return
    var delta = evt.clientX - this.dragOffset
    this.getLeftTarget().style.width = Math.max(this.originalWidth + delta, 0);

	  evt.stopPropagation();
  }
  
  onDragEnd(evt) {
    // console.log("[separator] drag end")
    // Do nothing... 
	  evt.stopPropagation();
  }

}
