import Morph from 'src/components/widgets/lively-morph.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt, rect} from 'src/client/graphics.js';

// import Clipboard from 'src/client/clipboard.js'; // #TODO Problems with cyclic dependencies...

let HaloService  = window.HaloService

// document.querySelectorAll("lively-selection").forEach(ea => ea.remove())
/*MD 

# Lively Selection 

- allows to drag a rectangle around elements and interact with them as a group
- registers itself in load()

MD*/


export default class Selection extends Morph {
  
  get isMetaNode() { return true}
  get isSelection() { return true}
 
  static async load() {
    if (!window.lively) {
      return setTimeout(() => {Selection.load()}, 100) // defere
    }
    
    if (!this.current){
      this.current = document.createElement("lively-selection")
      await lively.components.openInBody(this.current)
      this.current.remove()
    } 
    this.current.registerOn(document.documentElement)
  }
  
  registerOn(target) {
    lively.removeEventListener("Selection", target)
    lively.addEventListener("Selection", target, "pointerdown", 
      e => Selection.current.onPointerDown(e))  // select in bubling phase ...
    lively.addEventListener("Selection", target, "pointerdown", 
      e => Selection.current.onPointerDownPre(e), true)  // pre select in capturing phase ...
  }
 
  initialize() {
    // super.initialize()
    this.nodes = [];
    this.startPositions = new Map();
    this.originalExtents = new Map();
    this.originalOffset = new Map();
  }

  allowsSelection(element, evt) {
    // the "evt" is important, because an element might be picky about it...
     return (element.classList && element.classList.contains("lively-group"))
       || (element.livelyAllowsSelection && element.livelyAllowsSelection(evt))
       // ||(element.tagName == "LIVELY-CONTAINER")
  }
  
  onPointerDownPre(evt) {
    // lively.showEvent(evt)

    if (evt.ctrlKey || evt.altKey) return;
    var target = evt.composedPath().find(ea => this.allowsSelection(ea, evt)); // start with the innermost
    // console.log('evt path:' + evt.composedPath().map(ea => ea.classList).join("|")+ ": " + target)
    
    if (evt.composedPath()[0] !== document.body && evt.composedPath()[0] !==  document.documentElement && !target) return 
    if (evt.pointerType == "touch") return; // no selection via touch
    
    lively.showEvent(evt).style.display = "none"; // #HACK, weired event shit.. without it the world scrolls #TODO
    document.documentElement.style.touchAction = "none"

    if (target) {
      // we won't be called in the bubbling, so we do it now
      this.startSelection(target, evt)
    }
    
  }
  
  onPointerDown(evt) {
    var target;
    if (evt.ctrlKey || evt.altKey) return;
    if (evt.button === 1 || evt.button === 2) { // middle mouse or riught mouse button
      return
    }
    
    if (evt.composedPath()[0] === document.body || evt.composedPath()[0] ===  document.documentElement) {
      target = document.body
    } 
    if (evt.pointerType == "touch") return; // no selection via touch
    
    if (!target)
      target = evt.composedPath().find(ea => ea.classList && ea.classList.contains("lively-group"))
    // if (target) lively.showElement(target)
    if (!target) return;
    
    document.documentElement.style.touchAction = "none"
    // document.documentElement.setPointerCapture(evt.pointerId)
    
    if (lively.hand && lively.hand.childNodes.length > 0) return; // in drag
    if (this.disabled) return
    
    // don't select with touch 
    if (evt.sourceCapabilities && evt.sourceCapabilities.firesTouchEvents) {
      lively.showPoint(pt(evt.clientX, evt.clientY))     
      return
    }
    this.startSelection(target, evt)
  }

  startSelection(target, evt) {
    lively.addEventListener("Selection", document.documentElement, "pointermove", 
      e => this.onPointerMove(e))
    lively.addEventListener("Selection", document.documentElement, "pointerup", 
      e => this.onPointerUp(e))

    this.selectionOffset = pt(evt.clientX, evt.clientY)
    this.context = target;
    this.nodes = [];
  }
  
  
  onPointerMove(evt) {
    var evtPos =  pt(evt.clientX, evt.clientY);

    if (!this.parentElement) {  
      document.body.appendChild(this)
      lively.setGlobalPosition(this, this.selectionOffset);
    }
    
    var topLeft = this.selectionOffset.minPt(evtPos);
    var bottomRight = this.selectionOffset.maxPt(evtPos);
  
    this.selectionBounds = rect(topLeft, bottomRight);
    lively.setGlobalPosition(this,  topLeft);
    lively.setExtent(this, bottomRight.subPt(topLeft));
  
    this.nodes = Array.from(this.context.childNodes)
      .filter( ea =>  !ea.isMetaNode)
      .filter( ea => {
        if (!ea.getBoundingClientRect || ea.isMetaNode) return false;
        var r = ea.getBoundingClientRect();
        var eaRect = rect(r.left, r.top,  r.width, r.height);
        return this.selectionBounds.containsRect(eaRect);
      });
  }

  onPointerUp(evt) {
    lively.removeEventListener("Selection", document.documentElement, "pointermove")
    lively.removeEventListener("Selection", document.documentElement, "pointerup")

    document.documentElement.style.touchAction = ""    
    document.documentElement.releasePointerCapture(evt.pointerId)
    
    if (this.nodes.length > 0) {
      var minP=this.selectionBounds.bottomRight(); 
      var maxP=this.selectionBounds.topLeft();
        
      this.nodes.forEach( ea => {
        var r = ea.getBoundingClientRect();
        var eaRect = rect(r.left, r.top,  r.width, r.height);
        minP = eaRect.topLeft().minPt(minP);
        maxP = eaRect.bottomRight().maxPt(maxP);
      });
      lively.setGlobalPosition(this, minP);
      lively.setExtent(this, maxP.subPt(minP));
    
      window.that=this;
      setTimeout(()=> {
        HaloService.showHalos(this);
      },0 )
    } else {
      this.remove();
    }
    // console.log("drag end")

  }


  haloRemove() {
    this.nodes.forEach(ea => {
      console.log("selection.remove " + ea);
      ea.remove();
    });
    this.remove();
  }

  haloCopyObject(haloItem) {
    
    // this.nodes = this.nodes.map(ea => {
    //   var copy = haloItem.cloneObject(ea);
    //   ea.parentNode.appendChild(copy); 
    //   return copy;
    // }).filter( ea => ea);
    
    var html = lively.clipboard.nodesToHTML(this.nodes)
    lively.clipboard.lastClickPos = lively.getGlobalPosition(this) // used in pasted as offset
    var result = lively.clipboard.pasteHTMLDataInto(html, this.parentElement, true)
    
    this.nodes = result
    return this;
  }
 
 
  haloDragStart(fromPos) {
    this.startPositions = new Map();
    this.nodes.concat([this]).forEach(ea => {
      this.startPositions.set(ea, lively.getPosition(ea));
    })
 }
 
  haloDragTo(toPos, fromPos) {
    var delta = toPos.subPt(fromPos);
    this.nodes.concat([this]).forEach(ea => {
      nodes.setPosition(ea, this.startPositions.get(ea).addPt(delta));
    });
    window.that = this
    HaloService.showHalos(this);
  }
 
  // cleanup:
  haloGrabStart(evt, haloItem, startPos) {
    if (haloItem.isCopyItem) {
      console.log("copy items...");
      this.haloCopyObject(haloItem);
    }
    this.startEventPos = startPos;

    this.startPositions.set(this, lively.getPosition(this)); // #BUG this is to late, because drag is detacted later...
    this.nodes.forEach( ea => {
      ea.classList.add("lively4-grabbed")
      var pos = lively.getPosition(ea);
      this.startPositions.set(ea, pos);
    });
  }
  
  haloGrabMove(evt, grabHaloItem) {
    
    this.haloDragTo(events.globalPosition(evt), this.startEventPos);
  }
  
  haloGrabStop(evt, grabHaloItem) {
   var positions = new Map();
    // first add temorarily to selection ... so that we do not drop into each other
    this.nodes.forEach( ea => {
      ea.classList.remove("lively4-grabbed")
      positions.set(ea, nodes.globalPosition(ea));
      this.appendChild(ea);
    });

    var dropTarget = grabHaloItem.droptargetAtEvent(this, evt);

    // then drop into the real target
    dropTarget = dropTarget || document.body; // we have to drop somewhere
    var i=0;
    var offset = nodes.globalPosition(dropTarget);
    this.nodes.forEach( ea => {
      dropTarget.appendChild(ea);
      ea.style.position = "absolute";
      
      var pos = positions.get(ea);
      if (dropTarget.localizePosition) {s
        pos = dropTarget.localizePosition(pos);
      } else {
        pos = pos.subPt(offset);
      }
      nodes.setPosition(ea, pos);
    });
    HaloService.showHalos(this);
  }
  
  haloResizeStart(evt, haloItem) {
    this.eventOffset = events.globalPosition(evt);
    this.nodes.concat([this]).forEach( ea => {
       this.startPositions.set(ea, nodes.globalPosition(ea));
       this.originalExtents.set(ea, nodes.getExtent(ea));
       this.originalOffset.set(ea, nodes.globalPosition(this).subPt(
        nodes.globalPosition(ea.parentNode)));
    });
  }
  
  haloResizeMove(evt, haloItem) {
    var delta = events.globalPosition(evt).subPt(this.eventOffset)
    var newExtent = this.originalExtents.get(this).addPt(delta)
  
    var oldExtent = this.originalExtents.get(this)
    var scale = newExtent.scaleBy(1/ oldExtent.x, 1/oldExtent.y)
    
    //nodes.setExtent(ea, this.originalExtents.get(ea).scaleByPt(scale))
    nodes.setExtent(this, newExtent)
    
    this.nodes.forEach( ea => {
      var oldRelativePos = this.startPositions.get(ea).subPt(this.startPositions.get(this)) 
      
      lively.showPoint(this.originalOffset.get(ea))  
      
      nodes.setPosition(ea, this.originalOffset.get(ea).addPt(oldRelativePos.scaleByPt(scale)))
      nodes.setExtent(ea, this.originalExtents.get(ea).scaleByPt(scale))               
    });
  }
  
  haloResizeStop(evt, haloItem) {
    
  }
  
  livelyInspect(contentNode, inspector) {
    var selection = <div class="element"><i>selection</i></div>
    contentNode.appendChild(selection)
    this.nodes.forEach(ea => {
      selection.appendChild(inspector.display(ea, false, null, this));
    })
  }
  
  
}  

Selection.load()

