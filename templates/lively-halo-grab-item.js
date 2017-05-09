/*
 * # LivelyHaloGrabItem
 * The GrabHaloItem removes the selected node from its parent element
 * drags it to a new position and places it relative or aboslute 
 * (distance or holding shift pressed) into another node. 
 */
 
import HaloItem from './HaloItem.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import {Grid} from 'src/client/morphic/snapping.js';


export default class HaloGrabItem extends HaloItem {
 
  initialize() {
    this.registerMouseEvents()
    this.startCustomDragging();
    
    this.droppingBlacklist = {
      "*": ["button", "input", "lively-halo", "html",  "lively-selection"]
    };
  }

  // DRAG API

  start(evt) {
    if (this.isDragging) {
      console.log("isDragging " + this.isDragging)
      return;
    }
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
        if (this.grabTarget.haloGrabStart) {
          this.grabTarget.haloGrabStart(evt, this)
        } else {
          this.initGrabShadow();
          this.prepareGrabTarget();
        }
        this.isDragging = true;
    }
    if (this.isDragging && this.grabTarget) {
      if (this.grabTarget.haloGrabMove) {
        this.grabTarget.haloGrabMove(evt, this)
      } else {
        this.moveGrabbedNodeToEvent(evt);
      }
    }
  }
  
  stop(evt) {
    try {
    if (this.isDragging && this.grabTarget) {
      if (this.grabTarget.haloGrabStop) {
        this.grabTarget.haloGrabStop(evt, this)
      } else {
        this.stopGrabbingAtEvent(evt);
      }
    }
    } finally {
      this.isDragging = false;
      this.grabTarget = null;
      this.grabStartEventPosition = null;
      this.grabShadow = null;
    }
  }
  
  // HELPERS
  
  prepareGrabTarget() {
    document.body.appendChild(this.grabTarget);
    this.grabTarget.classList.add("lively4-grabbed")
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
    var pos = eventPosition.subPt(this.grabOffset)
    nodes.setPosition(this.grabTarget, Grid.optSnapPosition(pos, evt))
    evt.preventDefault();
  }
  
  stopGrabbingAtEvent(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()
    if (this.dropTargetIndicator) this.dropTargetIndicator.remove()
      
    this.grabTarget.classList.remove("lively4-grabbed")
    if (this.grabShadow.style.position == 'absolute') {
        lively.notify("absolute...")
        this.insertGrabTargetBeforeShadow();
        this.removeGrabShadow();
        lively.setPosition(this.grabTarget, lively.getPosition(this.grabShadow))
    } else {    
      this.insertGrabTargetBeforeShadow();
      this.removeGrabShadow();
    
      this.grabTarget.style.position = 'relative';
      this.grabTarget.style.removeProperty('top');
      this.grabTarget.style.removeProperty('left');
    }
    evt.preventDefault();
    this.isDragging = false;
  }
  
  removeGrabShadow() {
    this.grabShadow.parentNode.removeChild(this.grabShadow);
  }
  
  dropAtEvent(node, evt) {
    var droptarget = this.droptargetAtEvent(node, evt);
    if (droptarget) {
      this.moveGrabShadowToTargetAtEvent(droptarget, evt);
      if (this.dropIndicator) this.dropIndicator.remove()
      this.dropIndicator = lively.showElement(droptarget)
      this.dropIndicator.style.border = "3px solid green"
      this.dropIndicator.querySelector("pre").style.color = "green"
      
      if (this.dropTargetIndicator) this.dropTargetIndicator.remove()
      this.dropTargetIndicator = lively.showElement(node)
      this.dropTargetIndicator.style.border = "1px solid blue"
      this.dropTargetIndicator.querySelector("pre").style.color = "blue"
      this.dropTargetIndicator.querySelector("pre").textContent = "drop"
      
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
  
  moveGrabShadowToTargetAtEvent(targetNode, evt) {
    var pos = pt(evt.pageX, evt.pageY)

    var children = targetNode.childNodes;
    var nextChild = Array.from(children).find(child => {
      return child !== this.grabShadow && child !== this.grabTarget &&
        child.nodeType === 1 && this.nodeComesBehind(child, pos);
    });
    
    targetNode.insertBefore(this.grabShadow, nextChild);
    this.grabShadow.style.position = 'relative';
    
    this.grabShadow.style.position = 'relative';
    this.grabShadow.style.removeProperty('top');
    this.grabShadow.style.removeProperty('left'); 

    if (evt.shiftKey || 
      nodes.globalPosition(this.grabShadow).dist(nodes.globalPosition(this.grabTarget)) > 100) {
      this.grabShadow.parentElement.appendChild(this.grabShadow)
        
      this.grabShadow.style.opacity = 0;
      this.grabShadow.style.position = 'absolute';
      var pos = nodes.globalPosition(this.grabTarget);
      if (targetNode.localizePosition) {
        pos = targetNode.localizePosition(pos);
      } else {
        pos = pos.subPt(nodes.globalPosition(targetNode));
      }
      nodes.setPosition(this.grabShadow, pos); // localize
    } else {
      // drag position is near enough to relative position, so SNAP  
      this.grabShadow.style.opacity = 0.5;
    }
  }
  
  canDropInto(node, targetNode) {
    var targetTag = targetNode.tagName.toLowerCase();
    return node !== targetNode &&
      !Array.from(node.getElementsByTagName('*')).includes(targetNode) &&
      !(this.droppingBlacklist[node.tagName.toLowerCase()] || []).includes(targetTag) &&
      !(this.droppingBlacklist['*'] || []).includes(targetTag) && 
      (!targetNode.livelyAcceptsDrop || targetNode.livelyAcceptsDrop(node))
  }
  
  nodeComesBehind(node, pos) {
    var bounds = node.getBoundingClientRect()
    var toTheRight = 
      (bounds.top <= pos.y <= bounds.bottom) && (bounds.left > pos.x);
    var below = bounds.top > pos.y;
    return toTheRight || below;
  }
}