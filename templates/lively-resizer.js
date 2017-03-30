'use strict';

import Morph from './Morph.js';

import {pt}  from 'src/client/graphics.js';

export default class Resizer extends Morph {
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

  getElement() {
    return this.target || this.parentElement
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
    if (f  == 0) {
      f = 0.1; // we cannot distinguish between flex and not flex otherwise...
    }
    if (!element) return
    element.style.flex = f
  }

  getLength(element) {
    return pt(this.getWidth(element), this.getHeight(element))
  }

  setLength(element, value) {
    this.setWidth(element, value.x)
    this.setHeight(element, value.y)
    
  }


  getEventLength(evt) {
    return pt(evt.clientX, evt.clientY)
  }
  
  onDragStart(evt) {
    this.count = 0
    var element = this.getElement()
    
    
        
    this.setOriginalLength(element, this.getLength(element))
    // this.setOriginalFlex(element, this.getFlex(element))  
      
    this.dragOffset = this.getEventLength(evt);

    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
    evt.stopPropagation();
  }
  
  /*
   * (un-)collabses prev element on click
   */
  onClick() {
    var prev = this.getPreviousElement()
    var next = this.getNextElement()
    if (this.lastPrevLength) {
      this.setLength(prev, this.lastPrevLength);
      this.setLength(next, this.lastNextLength);
      delete this.lastPrevLength
      delete this.lastNextLength;
    } else {
      this.lastPrevLength = this.getLength(prev);
      this.lastNextLength = this.getLength(next);
      this.setLength(prev, 0)
      this.setLength(next, this.lastPrevLength + this.lastNextLength)
    }
  }
  
  
  
  onDrag(evt) {
    if (!evt.clientX) return
    this.count++ 
    if (this.count == 1) return; // ignore the first event because it seems to be off
    
    // DEBUG with: 
    // lively.showPoint(pt(evt.clientX, evt.clientY)).innerHTML = "" + this.count

    var element = this.getElement()
    
    // 1. calculate values
    var delta = this.getEventLength(evt).subPt(this.dragOffset)
      
    var newExtent = this.getOriginalLength(element).addPt(delta)    
    
    // 2. constrain new values
    if (newExtent.x < 0) {
      newExtent.x = 0
    }
    if (newExtent.y < 0) {
      newExtent.y = 0
    }

    
    // 3. update new values
    this.setLength(element, newExtent)
      
    evt.stopPropagation();
  }
  
  onDragEnd(evt) {
    // Do nothing...
	  evt.stopPropagation();
  }

}
