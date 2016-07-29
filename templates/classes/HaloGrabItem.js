"use strict";
import HaloItem from './HaloItem.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import * as config from 'src/client/morphic/config.js';

import {pt} from 'lively.graphics';

export default class HaloGrabItem extends HaloItem {
 
  initialize() {
    this.startCustomDragging();
  }

  // DRAG API

  start(evt) {
    if (this.isDragging) return;
    this.grabTarget = window.that;
    if (this.grabTarget) {
      this.grabStartEventPosition = events.globalPosition(evt);
      this.grabOffset =  events.globalPosition(evt).subPt(nodes.globalPosition(this.grabTarget));
      evt.preventDefault();
    }
  }

  move(evt) {
    if (this.grabTarget && !this.isDragging && 
      events.noticableDistanceTo(evt, this.grabStartEventPosition)) {
      // drag detected
      this.initGrabShadow();
      this.prepareGrabTarget();
      this.isDragging = true;
    }
    if (this.isDragging) {
      this.moveGrabbedNodeToEvent(evt);
    }
  }
  
  stop(evt) {
    if (this.isDragging) {
      this.stopGrabbingAtEvent(evt);
    }
    this.grabTarget = null;
    this.grabStartEventPosition = null;
    this.grabShadow = null;
  }
  
  // HELPERS
  
  prepareGrabTarget() {
    document.body.appendChild(this.grabTarget);
    this.grabTarget.style.position = 'absolute';
    this.grabTarget.style.removeProperty('top');
    this.grabTarget.style.removeProperty('left');
  }
  
  initGrabShadow() {
    this.grabShadow = this.grabTarget.cloneNode(true);
    this.grabShadow.style.opacity = '0.5';
    this.grabShadow.style.position = 'relative';
    this.grabShadow.style.removeProperty('top');
    this.grabShadow.style.removeProperty('left');
  }
  
  moveGrabbedNodeToEvent(evt) {
    var eventPosition = events.globalPosition(evt);
    this.dropAtEvent(this.grabShadow, evt);
    nodes.setPosition(this.grabTarget, eventPosition.subPt(this.grabOffset))
    evt.preventDefault();
  }
  
  stopGrabbingAtEvent(evt) {
    this.insertGrabTargetBeforeShadow();
    this.removeGrabShadow();
    this.grabTarget.style.position = 'relative';
    this.grabTarget.style.removeProperty('top');
    this.grabTarget.style.removeProperty('left');
    evt.preventDefault();
    this.isDragging = false;
  }
  
  removeGrabShadow() {
    this.grabShadow.parentNode.removeChild(this.grabShadow);
  }
  
  dropAtEvent(node, evt) {
    var droptarget = this.droptargetAtEvent(node, evt);
    if (droptarget) {
      var pos = pt(evt.pageX, evt.pageY)
      this.moveGrabShadowToTargetAtPosition(droptarget, pos);
    }
  }
  
  insertGrabTargetBeforeShadow() {
    if (this.grabShadow && this.grabTarget) {
      this.grabShadow.parentNode.insertBefore(this.grabTarget, this.grabShadow);
    }
  }
  
  droptargetAtEvent(node, evt) {
    var elementsUnderCursor = Array.from(events.elementsUnder(evt)).filter( (elementUnder) => {
      return elementUnder !== this.grabTarget && elementUnder !== this.grabShadow;
    });
    for (var i = 0; i < elementsUnderCursor.length; i++) {
      var targetNode = elementsUnderCursor[i];
      if (this.canDropInto(node, targetNode) ) {
        return targetNode;
      }
    }
    return document.body;
  }
  
  moveGrabShadowToTargetAtPosition(targetNode, pos) {
    var children = targetNode.childNodes;
    var nextChild = Array.from(children).find(child => {
      return child !== this.grabShadow && child !== this.grabTarget &&
        child.nodeType === 1 && this.nodeComesBehind(child, pos);
    });
    // ALT position... directly
    
    // var nodes.getPosition(this.dragTarget)

    targetNode.insertBefore(this.grabShadow, nextChild);
  }
  
  canDropInto(node, targetNode) {
    return node !== targetNode &&
      // !Array.from(targetNode.getElementsByTagName('*')).includes(node) &&
      !Array.from(node.getElementsByTagName('*')).includes(targetNode) &&
      $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist[node.tagName.toLowerCase()] || []) < 0 &&
      $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist['*'] || []) < 0
  }
  
  nodeComesBehind(node, pos) {
       var childTop = $(node).offset().top;
    var childLeft = $(node).offset().left;
    var childBottom = childTop + $(node).height();
    var childRight = childLeft + $(node).width();
    var toTheRight = childTop <= pos.y <= childBottom
        && childLeft > pos.x;
    var below = childTop > pos.y;
    return toTheRight || below;
    
  
    // node = that
    // var bounds = node.getBoundingClientRect()
    // var toTheRight = 
    //   (bounds.top <= pos.y <= bounds.bottom) && (bounds.left > pos.x);
    // var below = bounds.top > pos.y;
    // return toTheRight || below;
  }
}