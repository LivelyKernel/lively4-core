
import HaloGrabItem from './HaloGrabItem.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'lively.graphics';

var copyBlacklist = ["body", "html"];

export default class HaloCopyItem extends HaloGrabItem {
 
  onClick() {
    if (!this.copiedObject) {
      this.copyObject(window.that)
      this.copiedObject.style.position = 'absolute'
      nodes.setPosition(this.copiedObject, nodes.getPosition(this.copyTarget).addPt(pt(10,10)))
      window.that = this.copiedObject
      window.HaloService.showHalos(that)
    } 
    this.copiedObject = null
  }
  
  copyObject(el) {
    this.copyTarget = el;
    if (el.haloCopyObject) {
        this.copiedObject = el.haloCopyObject(); // copy selection etc...
    } else {
      if (this.isAllowedToBeCopied(this.copyTarget)) {
        this.copiedObject = this.copyTarget.cloneNode();
        this.copyTarget.parentNode.appendChild(this.copiedObject);    
      } else {
        lively.notify("Could not copy " + sourceObj)
      }
    }
    return this.copiedObject
      
  }

  isAllowedToBeCopied(element) {
    return copyBlacklist.indexOf(element.tagName.toLowerCase()) < 0;
  }

  // DRAG API
  
  prepareGrabTarget() {
    this.grabTarget = this.copyObject(this.grabTarget)
    window.that = this.grabTarget
    HaloService.showHalos(this.grabTarget)
    
    super.prepareGrabTarget()
  }
}