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
    
    this.originalLengths = new Map()
    this.originalFlexs = new Map()
  }

  getLeftTarget() {
    var selector = this.getAttribute("leftselector");
    if (selector) return this.parentElement.querySelector(selector);
    return this.previousElementSibling
  }

  getRightTarget() {
    var selector = this.getAttribute("rightselector");
    if (selector) return this.parentElement.querySelector(selector);
    return this.nextElementSibling

  }

  getTopTarget() {
    var selector = this.getAttribute("topselector");
    if (selector) return this.parentElement.querySelector(selector);
    return this.previousElementSibling
  }
  
  getBottomTarget() {
    var selector = this.getAttribute("bottomselector");
    if (selector) return this.parentElement.querySelector(selector);
    return this.nextElementSibling
  }

  getWidth(element) {
    if (!element) return 0
    return element.getBoundingClientRect().width
  }

  getHeight(element) {
    if (!element) return 0
    return element.getBoundingClientRect().height
  }

  getOriginalLength(element) {
    if (!element) return 0
    return this.originalLengths.get(element)
  }

  setOriginalLength(element, l) {
    if (!element) return
    return this.originalLengths.set(element, l)
  }

  getOriginalFlex(element) {
    if (!element) return 0
    return this.originalFlexs.get(element)
  }

  setOriginalFlex(element, l) {
    if (!element) return
    return this.originalFlexs.set(element, l)
  }

  setHeight(element, h) {
    if (!element) return
    var flex = this.getOriginalFlex(element)
    if (flex > 0 ) {
      var newFlex = h / this.getOriginalLength(element) * flex
      // console.log("new flex " + newFlex)
      this.setFlex(element, newFlex)
    } else {
      element.style.height = h + "px";
    }
  }

  setWidth(element, w) {
    if (!element) return
    var flex = this.getOriginalFlex(element)
    if (flex > 0 ) {
      var newFlex = w / this.getOriginalLength(element) * flex
      // console.log("new flex " + newFlex)
      this.setFlex(element, newFlex)
    } else {
      element.style.width = w + "px";
    }
  }

  getFlex(element) {
    if (!element) return 0
    return parseFloat(getComputedStyle(element).flexGrow)
  }

  setFlex(element, f) {
    if (!element) return
    element.style.flex = f
  }

  onDragStart(evt) {
    this.count = 0
    if (this.isHorizontal()) {
      var bottom = this.getBottomTarget();
      var top = this.getTopTarget();

      this.setOriginalLength(bottom, this.getHeight(bottom))
      this.setOriginalLength(top, this.getHeight(top))

      this.setOriginalFlex(bottom, this.getFlex(bottom))
      this.setOriginalFlex(top, this.getFlex(top))
      
      this.dragOffsetY = evt.clientY;
    } else {
      var left = this.getLeftTarget()
      var right = this.getRightTarget()
      
      this.setOriginalLength(left, this.getWidth(left))
      this.setOriginalLength(right, this.getWidth(right))

      this.setOriginalFlex(left, this.getFlex(left))
      this.setOriginalFlex(right, this.getFlex(right))
      
      this.dragOffsetX = evt.clientX;
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
      var left = this.getLeftTarget()
      var right = this.getRightTarget()
      
      if (this.targetLastLeftWidth) {
        this.setWidth(left, this.targetLastLeftWidth);
        this.setWidth(right, this.targetLastRightWidth);

        delete this.targetLastLeftWidth;
        delete this.targetLastRightWidth;
      } else {
        this.targetLastLeftWidth = this.getWidth(left);
        this.targetLastRightWidth = this.getWidth(right);

        this.setWidth(left, 0)
        this.setWidth(right, this.targetLastLeftWidth + this.targetLastRightWidth)

      }
    }
  }
  
  isHorizontal() {
    // return this.classList.contains("horizontal")
    return this.getWidth(this) > this.getHeight(this)
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
      
      var newTop = this.getOriginalLength(top) + deltaY
      var newBottom = this.getOriginalLength(bottom) - deltaY
      
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
      // 1. calculate values
      var deltaX = evt.clientX - this.dragOffsetX
      var left = this.getLeftTarget();
      var right = this.getRightTarget()

      var newLeft = this.getOriginalLength(left) + deltaX
      var newRight = this.getOriginalLength(right) - deltaX
      
      // 2. constrain new values
      if (newLeft < 0) {
        if (right) newRight += newLeft 
        newLeft = 0;
      }
      if (newRight < 0) {
        if (top) newLeft += newRight; // jump to the max
        newRight = 0;
      }
      // 3. update new values
      this.setWidth(left, newLeft)
      this.setWidth(right, newRight)
    }
	  evt.stopPropagation();
  }
  
  onDragEnd(evt) {
    // Do nothing...
	  evt.stopPropagation();
  }

}
