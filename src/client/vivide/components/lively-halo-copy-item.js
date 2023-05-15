import HaloGrabItem from './lively-halo-grab-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js';
import scriptManager from  "src/client/script-manager.js";
import persistence from  "src/client/persistence.js";
import {default as HaloService} from "src/components/halo/lively-halo.js"

var copyBlacklist = ["body", "html"];

/*globals that */

export default class HaloCopyItem extends HaloGrabItem {
 
  get isCopyItem() {
    return true;
  }
  
  
  onClick() {
    if (!this.copiedObject) {
      this.copyObject(window.that);
      this.copiedObject.style.position = 'absolute';
      nodes.setPosition(this.copiedObject, nodes.getPosition(this.copyTarget).addPt(pt(10,10)));
      window.that = this.copiedObject;
      HaloService.showHalos(that);
    } 
    this.copiedObject = null;
  }
  
  cloneObject(obj) {
    var html = lively.clipboard.nodesToHTML([obj])
    lively.clipboard.lastClickPos = lively.getClientPosition(obj) // used in pasted as offset
    var result = lively.clipboard.pasteHTMLDataInto(html, obj.parentElement, true)
    return result[0];
  }
  
  copyObject(el) {
    this.copyTarget = el;
    if (el.haloCopyObject) {
        this.copiedObject = el.haloCopyObject(this); // copy selection etc...
    } else {
      if (this.isAllowedToBeCopied(this.copyTarget)) {
        this.copiedObject = this.cloneObject(this.copyTarget);
        this.copyTarget.parentNode.appendChild(this.copiedObject);    
      } else {
        lively.notify("Could not copy " + el);
      }
    }
    return this.copiedObject;
  }

  isAllowedToBeCopied(element) {
    return copyBlacklist.indexOf(element.tagName.toLowerCase()) < 0;
  }

  // DRAG API
  prepareGrabTarget() {
    this.grabTarget = this.copyObject(this.grabTarget);
    window.that = this.grabTarget;
    HaloService.showHalos(this.grabTarget);
    
    super.prepareGrabTarget();
  }
}