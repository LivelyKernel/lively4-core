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

  getPreviousElement() {
    var selector = this.getAttribute("prev")
    if (selector) return this.parentElement.querySelector(selector);
    return this.previousElementSibling
  }
  
  getNextElement() {
    var selector = this.getAttribute("next") 
    if (selector) return this.parentElement.querySelector(selector);
    return this.nextElementSibling
  }
  
  isHorizontal() {
    return this.getWidth(this) > this.getHeight(this)
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
    if (this.isHorizontal()) {
      return this.getHeight(element)
    } else {
      return this.getWidth(element)
    }
  }

  setLength(element, value) {
    if (this.isHorizontal()) {
      this.setHeight(element, value)
    } else {
      this.setWidth(element, value)
    }
  }


  getEventLength(evt) {
    if (this.isHorizontal()) {
      return evt.clientY;
    } else {
      return evt.clientX;
    }
  }
  
  onDragStart(evt) {
    this.count = 0
    var prev = this.getPreviousElement()
    var next = this.getNextElement()
    
    this.setOriginalLength(prev, this.getLength(prev))
    this.setOriginalLength(next, this.getLength(next))

    this.setOriginalFlex(prev, this.getFlex(prev))
    this.setOriginalFlex(next, this.getFlex(next))
      
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

    var prev = this.getPreviousElement()
    var next = this.getNextElement()
    
    // 1. calculate values
    var delta = this.getEventLength(evt) - this.dragOffset
      
    var newNext = this.getOriginalLength(next) - delta
    var newPrev = this.getOriginalLength(prev) + delta
    
    // 2. constrain new values
    if (newPrev < 0) {
      if (next) newNext += newPrev 
      newPrev = 0;
    }
    if (newNext < 0) {
      if (prev) newPrev += newNext; // jump to the max
      newNext = 0;
    }
    // 3. update new values
    this.setLength(prev, newPrev)
    this.setLength(next, newNext)
      
    evt.stopPropagation();
  }
  
  
  onDragEnd(evt) {
    // Do nothing...
	  evt.stopPropagation();
  }


  // replace yourself with an example showing yourself working in context
  livelyExample() {
    var a = document.createElement("div")
    a.style.backgroundColor = "red"
    a.textContent = "a"
    a.style.flex = 0.2
    var b = document.createElement("div")
    b.style.backgroundColor = "blue"
    b.textContent = "b"
    b.style.flex = 0.8
    var c = document.createElement("div")
    this.parentElement.appendChild(c)
    c.style.display = "flex"
    c.style.flexDirection = "row";
    c.appendChild(a)
    c.appendChild(this)
    c.appendChild(b)
  }
  


}
