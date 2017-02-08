'use strict';

import Morph from './Morph.js';

import {pt}  from 'src/client/graphics.js';

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
    var flex = this.getAttribute("leftflex")
    if (flex !== undefined) {
      flex = parseFloat(flex) 
      var newFlex = w / this.originalWidth * flex
      target.style.flex = newFlex
    } else {
      target.style.width = w + "px";
    }
  }

  getRightTarget() {
    return this.parentElement.querySelector(this.getAttribute("rightselector"));
  }

  getRightWidth() {
    return this.getRightTarget().getBoundingClientRect().width
  }
  
  setRightWidth(w) {
    this.getRightTarget().style.width = w + "px";
  }


  getTopTarget() {
    return this.parentElement.querySelector(this.getAttribute("topselector"));
  }


  setTopHeight(h) {
    this.getTopTarget().style.height = h + "px";
  }
  
  getBottomTarget() {
    return this.parentElement.querySelector(this.getAttribute("bottomselector"));
  }

  getHeight(element) {
    if (!element) return 0
    return element.getBoundingClientRect().height
  }

  setHeight(element, h) {
    if (!element) return
    element.style.height = h + "px";
  }

  onDragStart(evt) {
    this.count = 0
    if (this.isHorizontal()) {
      var bottom = this.getBottomTarget();
      var top = this.getTopTarget();
      if (top) this.originalTopHeight = this.getHeight(top);
      if (bottom) this.originalBottomHeight = this.getHeight(bottom);
      this.dragOffsetY = evt.clientY;
    } else {
      this.originalWidth =  this.getLeftWidth();
      // this.originalFlexLeft = this.getAttribute("leftflex")
      this.dragOffset = evt.clientX;
    }
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    evt.stopPropagation();
  }
  /*
   * (un-)collabses left target on click
   */
  onClick() {
    if (this.isHorizontal()) {
      var top = this.getTopTarget()
      var bottom = this.getBottomTarget()
      if (top) {
        if (this.targetLastTopHeight) {
          this.setHeight(top, this.targetLastTopHeight);
          this.setHeight(bottom, this.targetLastBottomHeight);

          delete this.targetLastTopHeight;
        } else {
          this.targetLastTopHeight = this.getHeight(top);
          this.targetLastBottomHeight = this.getHeight(bottom);
          this.setHeight(top, 0)
          this.setHeight(bottom, this.targetLastTopHeight + this.targetLastBottomHeight)
        }
      }
    } else {
      if (this.targetLastWidth) {
        this.setLeftWidth(this.targetLastWidth);
        delete this.targetLastWidth;
      } else {
        this.targetLastWidth = this.getLeftWidth();
        this.getLeftTarget().style.width = "0px";
      }
    }
  }
  
  isHorizontal() {
    return this.classList.contains("horizontal")
  }
  
  onDrag(evt) {
    if (!evt.clientX) return

    this.count++ 
    if (this.count == 1) return; // ignore the first event because it seems to be off
    
    // DEBUG with: 
    // lively.showPoint(pt(evt.clientX, evt.clientY)).innerHTML = "" + this.count

    if (this.isHorizontal()) {
      
      
      // this is a bit complicated because of optional arugments
      // 4 cases: nothgin | top | bottom | top and bottom
      // but we can do it in three steps...

      // 1. calculate values
      var deltaY = evt.clientY - this.dragOffsetY
      var top = this.getTopTarget();
      var bottom = this.getBottomTarget()
      
      var newTop = this.originalTopHeight + deltaY
      var newBottom = this.originalBottomHeight - deltaY
      
      // 2. constrain new values
      if (newTop < 0) {
        if (bottom) newBottom += newTop 
        newTop = 0;
      }
      if (newBottom < 0) {
        if (top) newTop += newBottom; // jump to the max
        newBottom = 0;
      }
      // 3. update new values
      this.setHeight(top, newTop)
      this.setHeight(bottom, newBottom)
      
    } else {
      var delta = evt.clientX - this.dragOffset
      this.setLeftWidth(Math.max(this.originalWidth + delta, 0))
    }
	  evt.stopPropagation();
  }
  
  onDragEnd(evt) {
    // console.log("[separator] drag end")
    // Do nothing...
    if (this.getAttribute("leftflex"))
      this.setAttribute("leftflex", this.getLeftTarget().style.flex) 
	  if (this.getAttribute("rightflex"))
      this.setAttribute("rightflex", this.getRightTarget().style.flex) 
	  
	  if (this.getAttribute("topflex"))
      this.setAttribute("topflex", this.getBottomTarget().style.flex) 
	  if (this.getAttribute("bottomflex"))
      this.setAttribute("bottomflex", this.getBottomTarget().style.flex) 
	  
	  evt.stopPropagation();
  }

}
