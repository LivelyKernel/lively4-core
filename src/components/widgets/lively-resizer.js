'use strict';

import Morph from 'src/components/widgets/lively-morph.js';
import {pt}  from 'src/client/graphics.js';
import {Grid} from 'src/client/morphic/snapping.js';


export default class Resizer extends Morph {
  initialize() {
    // console.log("intialize separator " )
    this.draggable = true;
    // #TODO #Refactor, because we use drag and drop semantically now, use PointerEvents here...
    lively.addEventListener('lively', this,'dragstart', evt => this.onDragStart(evt));
    lively.addEventListener('lively', this,'drag', evt => this.onDrag(evt));
    lively.addEventListener('lively', this,'dragend', evt => this.onDragEnd(evt));
    
    this.originalLengths = new Map()
    this.originalFlexs = new Map()
  }
  

  getElement() {
    if (this.target) {
      return this.target
    } else if (this.parentElement) {
      return this.parentElement 
    } else if (this.parentNode && this.parentNode.host) {
      return this.parentNode.host

    }
    return null
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
    element.dispatchEvent(new CustomEvent("extent-changed"))
  }


  getEventLength(evt) {
    return pt(evt.clientX, evt.clientY).subPt(lively.getGlobalPosition(document.body))
  }
  
  onDragStart(evt) {
    this.count = 0
    var element = this.getElement()
    if (!element) return; // do nothging... should this happen?
    
    this.setOriginalLength(element, this.getLength(element))
    // this.setOriginalFlex(element, this.getFlex(element))  
      
    this.dragOffset = this.getEventLength(evt);

    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0);
    evt.dataTransfer.setData("ui/interaction", '');
    evt.stopPropagation();
  }
  

  
  onDrag(evt) {
    if (!evt.clientX) return

    var element = this.getElement()
    if (!element) return; // do nothging... should this happen?

    this.count++ 
    if (this.count == 1) return; // ignore the first event because it seems to be off
    
    // DEBUG with: 
    // lively.showPoint(pt(evt.clientX, evt.clientY)).innerHTML = "" + this.count

    // 1. calculate values
    var pos = this.getEventLength(evt)
    // lively.showPoint(pos.addPt(lively.getGlobalPosition(document.body)))
    
    var delta = pos.subPt(this.dragOffset)

    var newExtent = this.getOriginalLength(element).addPt(delta)    

    newExtent = Grid.snapPt(newExtent,100,10)


    // lively.notify("pos " + pos + " newExtent " + newExtent)
    
    
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
    evt.preventDefault();
  }
  
  onDragEnd(evt) {
    // Do nothing...
	  evt.stopPropagation();
    evt.preventDefault();
  }

}
