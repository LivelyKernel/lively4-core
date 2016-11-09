import lively from 'src/client/lively.js';
import Morph from './Morph.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';

import selecting from 'src/client/morphic/selecting.js';

import {pt, rect, Rectangle} from 'lively.graphics';


/*
 * Halo, the container for HaloItems
 */

export default class Halo extends Morph {
  
  get isMetaNode() { return true}

  initialize() {
    Halo.halo = $(this);
    Halo.halo.hide();
    window.HaloService = Halo;
    this.registerBodyDragAndDrop();
  }
  
  registerBodyDragAndDrop() {
    // document.body.draggable=true; 
    lively.removeEventListener("Halo", document.body)
    lively.addEventListener("Halo", document.body, "mousedown", 
      evt => this.onBodyMouseDown(evt, document.body));
    lively.addEventListener("Halo", document.body, "dragstart", 
      evt => this.onBodyDragStart(evt));
    lively.addEventListener("Halo", document.body, "drag", 
      evt => this.onBodyDrag(evt));
    lively.addEventListener("Halo", document.body, "dragend", 
      evt => this.onBodyDragEnd(evt));
  }
  
  onBodyMouseDown(evt, targetContext) {
    var whitelistNodes = lively.html.findAllNodes() // #TODO only find nodes of subelement
        .filter (ea => ea.tagName == 'INPUT' || 
          ea.tagName == "LI" || ea.tagName == "TD" ||
          ea.tagName == "P" ||  ea.tagName == "PRE")
        .filter (ea => {
          var b = ea.getBoundingClientRect();
          var bounds = new Rectangle(b.left, b.top, b.width, b.height) ;
          var pos = events.globalPosition(evt);
          // lively.showPoint(bounds.topLeft())
          // lively.showPoint(pos)
          return bounds.containsPoint(pos);
      });
    // inputFields.forEach( ea => lively.showElement(ea))
    if (whitelistNodes.length > 0) {
      // evt.preventDefault();
      // evt.stopPropagation();
      document.body.draggable=false; 
      return false;
    }
    document.body.draggable=true; 
  }
  
  onBodyDragStart(evt) {
    lively.notify("drag start")
    if (this.selection) this.selection.remove(); // #TODO reuse eventually?
    this.selection = lively.components.createComponent("lively-selection");
    lively.components.openIn(document.body, this.selection).then(comp => {
      comp.onSelectionDragStart(evt);
    });
    
    // give it something to drag
    var div = document.createElement("div");
    evt.dataTransfer.setDragImage(div, 0, 0);
  }
  
  onBodyDrag(evt, targetContext) {
    lively.notify("drag")
    
    //evt.preventDefault();
    // return false
    if (!this.selection) return;
    this.selection.onSelectionDrag && this.selection.onSelectionDrag(evt)
  } 
  
  onBodyDragEnd(evt, targetContext) {
    // evt.preventDefault();
    // return false
    if (!this.selection) return;
    this.selection.onSelectionDragEnd && this.selection.onSelectionDragEnd(evt)
  }
    
  
  showHalo(target, path) {
  
    document.body.appendChild(this);
    
    if (!target.getBoundingClientRect) {
      $(this).show();
      return;
    }
    var bounds = target.getBoundingClientRect();
    var offset = {
      top: bounds.top +  $(document).scrollTop(), 
      left: bounds.left +  $(document).scrollLeft()};
  
    // viewport coordinates
    var scrollTop = Math.abs($(document).scrollTop());
    var scrollLeft = Math.abs($(document).scrollLeft());

    // make sure halo respects left and top viewport boundary
    var offsetTop = Math.max(offset.top - 30, scrollTop);
    var offsetLeft = Math.max(offset.left - 30, scrollLeft);
    var offsetTopDiff = offsetTop - offset.top;
    var offsetLeftDiff = offsetLeft - offset.left;
    offset.top = offsetTop;
    offset.left = offsetLeft;

    // make sure halo respects right and bottom viewport boundary
    var width = $(target).outerWidth() - offsetLeftDiff + 30;
    var height = $(target).outerHeight() - offsetTopDiff + 30;
    var offsetBottom = Math.min(offset.top + height, scrollTop + $(window).height());
    var offsetRight = Math.min(offset.left + width, scrollLeft + $(window).width());
    width = offsetRight - offsetLeft;
    height = offsetBottom - offsetTop;

    // set position and dimensions of halo
    $(this).show();
    $(this).offset(offset);
    $(this).outerWidth(width);
    $(this).outerHeight(height);
  }
  
  static showHalos(target, path) {
    this.target = $(target);
    this.halo[0].showHalo(target, path);
  }
  
  
  static hideHalos() {
    if (this.areHalosActive())
      this.halosHidden = Date.now();
    this.halo.offset({left:0, top: 0});
    this.halo.hide();
  }

  static areHalosActive() {
    return this.halo && this.halo.is(":visible");
  }
}
