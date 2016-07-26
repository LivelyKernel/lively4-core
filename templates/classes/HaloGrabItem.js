// "use strict";
import HaloItem from './HaloItem.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import * as config from 'src/client/morphic/config.js';


// import Point from 'src/external/lively.graphics/index.js'


export default class HaloGrabItem extends HaloItem {
 
  
  initialize() {
    this.isDragging = false
    
         $(this).off("mousedown").on("mousedown", (e) => {
          this.start(e);

          // attach mousemove handler to body only after mousedown occured
          $("body").off("mousemove.grab").on("mousemove.grab", (e) => {
            this.move(e);

            // update position of halos on mousemove
            HaloService.showHalos(window.that);
          }); 
        });

        $("body").off("mouseup.grab").on("mouseup.grab", (e) => {
          // save this as grabbing.stop will overwrite the current value
          var wasGrabbing = this.isDragging;

          this.stop(e);
          // detach mousemove handler from body
          $("body").off("mousemove.grab");

          if (wasGrabbing) {
            HaloService.showHalos(window.that);
            e.stopPropagation();
          }
        });
    
  }

  start(e) {
    if (this.isDragging) return;
    this.grabTarget = window.that;
    if (this.grabTarget) {
      this.initGrabbingAtEvent(e);
    }
  }

  move(e) {
    if (this.grabTarget) {
      this.startOffsetGrabbing(e);
    }
    if (this.isDragging) {
      this.moveGrabbedNodeToEvent(e);
    }
  }
  
  stop(e) {
    if (this.isDragging) {
      this.stopGrabbingAtEvent(e);
    }
    this.grabTarget = null;
    this.grabStartEventPosition = null;
    this.grabShadow = null;
  }
  
  initGrabbingAtEvent(anEvent) {
    this.grabStartEventPosition = events.globalPosition(anEvent);
    this.grabOffset = {
      x: events.globalPosition(anEvent).x - nodes.globalPosition(this.grabTarget).x,
      y: events.globalPosition(anEvent).y - nodes.globalPosition(this.grabTarget).y
    }
    anEvent.preventDefault();
  }
  
  startOffsetGrabbing(anEvent) {
    if (!this.isDragging && events.noticableDistanceTo(anEvent, this.grabStartEventPosition)) {
      this.initGrabShadow();
      this.prepareGrabTarget();
      this.isDragging = true;
    }
  }
  
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
  
  moveGrabbedNodeToEvent(anEvent) {
    var eventPosition = events.globalPosition(anEvent);
    this.dropAtEvent(this.grabShadow, anEvent);
    nodes.setPosition(this.grabTarget, {
      x: eventPosition.x - this.grabOffset.x,
      y: eventPosition.y - this.grabOffset.y
    })
    anEvent.preventDefault();
  }
  
  stopGrabbingAtEvent(anEvent) {
    this.insertGrabTargetBeforeShadow();
    this.removeGrabShadow();
    this.grabTarget.style.position = 'relative';
    this.grabTarget.style.removeProperty('top');
    this.grabTarget.style.removeProperty('left');
    anEvent.preventDefault();
    this.isDragging = false;
  }
  
  removeGrabShadow() {
    this.grabShadow.parentNode.removeChild(this.grabShadow);
  }
  
  dropAtEvent(node, e) {
    var droptarget = this.droptargetAtEvent(node, e);
    if (droptarget) {
      var pos = {
        x: e.pageX,
        y: e.pageY
      };
      this.moveGrabShadowToTargetAtPosition(droptarget, pos);
    }
  }
  
  insertGrabTargetBeforeShadow() {
    debugger
    if (this.grabShadow && this.grabTarget) {
      this.grabShadow.parentNode.insertBefore(this.grabTarget, this.grabShadow);
    }
  }
  
  droptargetAtEvent(node, e) {
    var elementsUnderCursor = Array.from(events.elementsUnder(e)).filter( (elementUnder) => {
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
  }
}