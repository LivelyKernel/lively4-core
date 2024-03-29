/*
 * # LivelyHaloGrabItem
 * The GrabHaloItem removes the selected node from its parent element
 * drags it to a new position and places it relative or aboslute 
 * (distance or holding shift pressed) into another node. 
 */
 
import HaloItem from 'src/components/halo/lively-halo-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js';
import Preferences from 'src/client/preferences.js';
import {Grid} from 'src/client/morphic/snapping.js';

/*PW  <div class="lively-content" data-lively-id="258c4d72-a9b4-4bdf-ba3a-c810055f0f16" style="width: 200px; height: 100px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5);"></div> PW*/
export default class HaloGrabItem extends HaloItem {
 
 static get droppingBlacklist() {
      return {"*": 
        ["h1","h2","h3","h4","h5", "lively-window", "button", "input", "lively-halo", "html",  "lively-selection", "lively-connector", "lively-code-mirror",  "lively-presentation"] // "lively-markdown",
      }
  }
 
  initialize() {
    this.registerMouseEvents()
    this.startCustomDragging();
  }

  // DRAG API

  start(evt) {
    if (this.isDragging) {
      console.log("isDragging " + this.isDragging)
      return;
    }
    this.grabTarget = window.that;
    if (this.grabTarget) {
      lively.notify("GRAB " + lively.ensureID(this.grabTarget))
      this.grabStartEventPosition = events.globalPosition(evt);
      this.grabOffset =  events.globalPosition(evt).subPt(lively.getClientPosition(this.grabTarget));

      evt.preventDefault();
    }
  }

  
  move(evt) {
    if (this.grabTarget && !this.isDragging && 
      events.noticableDistanceTo(evt, this.grabStartEventPosition)) {
      // drag detected
        if (this.grabTarget.haloGrabStart) {
          this.grabTarget.haloGrabStart(evt, this, this.grabStartEventPosition)
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
    this.grabShadow.isMetaNode = true
    this.grabShadow.classList.add("grabshadow")
    this.grabShadow.style.opacity = '0.5';
    this.grabShadow.style.position = 'relative';
    this.grabShadow.style.removeProperty('top');
    this.grabShadow.style.removeProperty('left');
  }
  
  moveGrabbedNodeToEvent(evt) {
    var eventPosition = pt(evt.clientX, evt.clientY);
    var pos = eventPosition.subPt(this.grabOffset)
    
    this.dropAtEvent(this.grabShadow, evt);
    lively.setClientPosition(this.grabTarget, Grid.optSnapPosition(pos, evt))
    evt.preventDefault();
  }
  
  stopGrabbingAtEvent(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()
    if (this.dropTargetIndicator) this.dropTargetIndicator.remove()
      
    this.grabTarget.classList.remove("lively4-grabbed")
    if (this.grabShadow.style.position == 'absolute') {

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
    
    if (this.grabTarget.parentElement == document.body) {
      this.grabTarget.classList.add("lively-content"); // "desktop content will be preserved"
    }
    
  }
  
  removeGrabShadow() {
    this.grabShadow.parentNode.removeChild(this.grabShadow);
  }
  
  dropTargetDescription(droptarget) {
    if (droptarget.id === "container-root") {
      var host = lively.findWorldContextHost(droptarget)
      if (host) return host.localName
    }
    
    return lively.elementToCSSName(droptarget)
  }
  
  dropAtEvent(grabShadow, evt) {
    var droptarget = this.droptargetAtEvent(grabShadow, evt);
    if (droptarget) {      
      this.moveGrabShadowToTargetAtEvent(droptarget, evt);
      
      if (this.dropIndicator) this.dropIndicator.remove()
      this.dropIndicator = lively.showElement(droptarget)      
      this.dropIndicator.style.color = "gray"
      this.dropIndicator.textContent = this.dropTargetDescription(droptarget)
      this.dropIndicator.style.border = "1px dashed lightgray"
      this.dropIndicator.classList.add("no")
      
      if (this.dropTargetIndicator) this.dropTargetIndicator.remove()
      this.dropTargetIndicator = lively.showElement(grabShadow)
      this.dropTargetIndicator.textContent = ""

      this.dropTargetIndicator.style.border = "1px dashed gray"
      // lively.showPoint(lively.getClientPosition(grabShadow))
      lively.setClientPosition(this.dropTargetIndicator, 
        lively.getClientPosition(grabShadow))
    }
  }
  
  insertGrabTargetBeforeShadow() {
    if (this.grabShadow && this.grabTarget) {
      
      if (this.grabShadow.parentNode instanceof SVGElement) {
        var element = this.grabTarget
        var foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")
        foreignObject.appendChild(element)
        lively.setPosition(foreignObject, pt(0,0))
        this.grabShadow.parentNode.insertBefore(foreignObject, this.grabShadow);        
      } else {
        this.grabShadow.parentNode.insertBefore(this.grabTarget, this.grabShadow);
      }
      
      
      
    }
  }
  
  // #important
  droptargetAtEvent(node, evt) {   
    // var elementsUnderCursor = Array.from(events.elementsUnder(evt)).filter( (elementUnder) => {
    var elementsUnderCursor = lively.allElementsFromPoint(lively.getPosition(evt)).filter( (elementUnder) => {
      return this.grabTarget !== elementUnder && 
        !lively.isInElement(elementUnder, this.grabTarget) && 
        this.grabShadow !== elementUnder && 
        !lively.isInElement(elementUnder, this.grabShadow) && 
        lively.halo !== elementUnder && 
        !lively.isInElement(elementUnder, lively.halo) 
    });
    
    // lively.removeHighlights()
    // elementsUnderCursor.forEach(ea => lively.showElement(ea))
    
    // return document.body // for debugging
    
    for (var i = 0; i < elementsUnderCursor.length; i++) {
      var targetNode = elementsUnderCursor[i];
      if (HaloGrabItem.canDropInto(node, targetNode) ) {
        
        // #TODO redirect drops into components... that want their drops go into the shadow
        
        if (targetNode.localName == "persistent-code-widget") {
          return targetNode.contentRoot
        } else  if (targetNode.localName == "lively-container") {
          var root = targetNode.getContentRoot() 
          // we could still be in markdown...
          var markdown = root.querySelector("lively-markdown")
          if (markdown) {
            return markdown.get("#content")   
          }
          return root
        } else if (targetNode.localName == "lively-markdown") {
          return targetNode.get("#content") 
        } else {
          return targetNode;
        }
      }
    }
    return document.body;
  }
  
  moveGrabShadowToTargetAtEvent(targetNode, evt) {
    var pos = pt(evt.clientX, evt.clientY)    
    var children = targetNode.childNodes;
    var nextChild = Array.from(children).find(child => {
      return child !== this.grabShadow && child !== this.grabTarget &&
        child.nodeType === 1 && this.nodeComesBehind(child, pos);
    });
    
    targetNode.insertBefore(this.grabShadow, nextChild);
    this.grabShadow.style.position = 'relative';
    this.grabShadow.style.removeProperty('top');
    this.grabShadow.style.removeProperty('left'); 

    if (evt.shiftKey || 
      lively.getClientPosition(this.grabShadow).dist(lively.getClientPosition(this.grabTarget)) > 100) {
      this.grabShadow.parentElement.appendChild(this.grabShadow)
      this.grabShadow.style.opacity = 0;
      lively.setPosition(this.grabShadow, pt(0,0))
      
      pos = lively.getClientPosition(this.grabTarget);
      // lively.showPoint(pos)
      // lively.showElement(this.grabTarget)


      // console.log("set global position: " + pos)
      lively.setClientPosition(this.grabShadow, pos); // localize
      // lively.setClientPosition(this.grabShadow, pos); // localize


      // var mysteriousOffset = pos.subPt(lively.getClientPosition(this.grabShadow))
      // lively.moveBy(this.grabShadow,mysteriousOffset )
      
      // lively.showPoint(lively.getClientPosition(this.grabShadow))
    } else {
      // drag position is near enough to relative position, so SNAP  
      this.grabShadow.style.opacity = 0.5;
    }
  }
  
  static canDropInto(node, targetNode) {
    if (!targetNode || !node) return false
    var targetTag = targetNode.tagName.toLowerCase();  
    
    if (lively.isInElement(targetNode, node)) return false; // prevent cycles...
  
    var worldContext = lively.findWorldContext(targetNode);    
    
    if (node === targetNode) return false
    var parents = lively.allParents(targetNode, [], true)
    if (parents.find(ea => ea.isHaloItem )) return false
    
    if (parents.find(ea => ea === node)) return false
    
    if (!worldContext) return
    if (worldContext == node) return
    
    // if (!(worldContext === document.body)) return false;
    
    var result = node !== targetNode &&
                  !targetNode.isMetaNode &&
                  !(this.droppingBlacklist[node.tagName.toLowerCase()] || []).includes(targetTag) &&
                  !(this.droppingBlacklist['*'] || []).includes(targetTag) && 
                  (!targetNode.livelyAcceptsDrop || targetNode.livelyAcceptsDrop(node))

    
    // a plain shadow root is always a bad sign... 
    // usually there is an explicit content-root or something...    
    if (worldContext instanceof ShadowRoot) {
      if (targetNode.localName == "persistent-code-widget") {
        return targetNode
      }  
      return 
    }
    // console.log("canDropInto " + lively.elementToCSSName(targetNode)  
    //               + " worldContext " + worldContext + " -> " + result)
    return result
  }
  
  nodeComesBehind(node, pos) {
    var bounds = node.getBoundingClientRect()
    var toTheRight = 
      (bounds.top <= pos.y <= bounds.bottom) && (bounds.left > pos.x);
    var below = bounds.top > pos.y;
    return toTheRight || below;
  }
  
  // called after code changes...
  livelyUpdate() {
    // this.style.backgroundColor = ""
  }
  
}


