'use strict';

import Morph from './Morph.js';

export default class Separator extends Morph {
  initialize() {
    // console.log("intialize separator " )
    this.draggable = true;
    lively.addEventListener('lively', this,'dragstart', evt => this.onDragStart(evt));
    lively.addEventListener('lively', this,'drag', evt => this.onDrag(evt));
    lively.addEventListener('lively', this,'dragend', evt => this.onDragEnd(evt));
    lively.addEventListener('lively', this,'click', evt => this.onClick(evt));
  }

  getLeftTarget() {
    return this.parentElement.querySelector(this.getAttribute("leftselector"));
  }

  getLeftWidth() {
    return this.getLeftTarget().getBoundingClientRect().width
  }
  
  setLeftWidth(w) {
    var target = this.getLeftTarget();
    target.style.width = w + "px";
  }

  getRightTarget() {
    return this.parentElement.querySelector(this.getAttribute("leftselector"));
  }

  getRightWidth() {
    return this.getRightTarget().getBoundingClientRect().width
  }
  
  setRightWidth(w) {
    this.getRightTarget().style.width = w + "px";
  }



  onDragStart(evt) {
    this.originalWidth =  this.getLeftWidth();
    this.dragOffset = evt.clientX;
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    evt.stopPropagation();
  }
  /*
   * (un-)collabses left target on click
   */
  onClick() {
    if (this.targetLastWidth) {
      this.setLeftWidth(this.targetLastWidth);
      delete this.targetLastWidth;
    } else {
      this.targetLastWidth = this.getLeftWidth();
      this.getLeftTarget().style.width = "0px";
    }
  }
  
  onDrag(evt) {
    if (!evt.clientX) return
    var delta = evt.clientX - this.dragOffset
    this.setLeftWidth(Math.max(this.originalWidth + delta, 0))
	  evt.stopPropagation();
  }
  
  onDragEnd(evt) {
    // console.log("[separator] drag end")
    // Do nothing... 
	  evt.stopPropagation();
  }

}
