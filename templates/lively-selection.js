
import Morph from './Morph.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt, rect} from 'lively.graphics';

import Halo from './lively-halo.js'; // #TODO cyclic dependencies still does not seem to work

export default class Selection extends Morph {
  
  get isMetaNode() { return true}
 
  initialize() {
    // super.initialize()
    this.nodes = [];
    this.startPositions = new Map();
    this.originalExtents = new Map();
    this.originalOffset = new Map();
  }

  onSelectionDragStart(evt, windowContext) {
    this.selectionOffset = events.globalPosition(evt);
    nodes.setPosition(this,  this.selectionOffset);

    this.context = windowContext || document.body;
    if (window.that && that !== this 
        && HaloService.areHalosActive()
        && !that.isMeta) {
      this.context = that;
    }
    lively.showElement(this.context)
    this.nodes = [];
    console.log("selection drag start");
  }
  
  onSelectionDrag(evt) {
    var evtPos =  events.globalPosition(evt);
    if (evtPos.eqPt(pt(0,0))) {
      return; // last drag... is wiered. Is it a bug?
    } 
    
    var topLeft = this.selectionOffset.minPt(evtPos);
    var bottomRight = this.selectionOffset.maxPt(evtPos);
    this.selectionBounds = rect(topLeft, bottomRight);

    nodes.setPosition(this,  topLeft);
    nodes.setExtent(this, bottomRight.subPt(topLeft));
  
    this.nodes = Array.from(this.context.childNodes).filter( ea => {
      if (!ea.getBoundingClientRect || ea.isMetaNode) return false;
      var r = ea.getBoundingClientRect();
      var eaRect = rect(r.left, r.top,  r.width, r.height);
      // if (this.selectionBounds.containsRect(eaRect))
      //   console.log("ea: " + this.selectionBounds + " "  + eaRect)
      return this.selectionBounds.containsRect(eaRect);
    });

    // console.log("drag " + this.context +" "+ this.nodes.length);
    
  }
  
  onSelectionDragEnd(evt) {
    if (this.nodes.length > 0) {
      
      var minP=this.selectionBounds.bottomRight(); 
      var maxP=this.selectionBounds.topLeft();
        
      this.nodes.forEach( ea => {
        var r = ea.getBoundingClientRect();
        var eaRect = rect(r.left, r.top,  r.width, r.height);
        minP = eaRect.topLeft().minPt(minP);
        maxP = eaRect.bottomRight().maxPt(maxP);
      });
      nodes.setPosition(this, minP);
      nodes.setExtent(this, maxP.subPt(minP));
    
      window.that=this;
      Halo.showHalos(this);
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
    console.log("copy object");
    this.nodes = this.nodes.map(ea => {
      var copy = ea.cloneNode();
      ea.parentNode.appendChild(copy); 
      return copy;
    }).filter( ea => ea);
    return this;
  }
 
  haloDragTo(toPos, fromPos) {
    var delta = toPos.subPt(fromPos);
    this.nodes.concat([this]).forEach(ea => {
      var startPos = this.startPositions.get(ea);
      if (!startPos) {
        ea.style.position = "absolute";
        startPos = nodes.getPosition(ea);
        this.startPositions.set(ea, startPos);
      }
      nodes.setPosition(ea, startPos.addPt(delta));
    });
    HaloService.showHalos(this);
  }
 
  haloGrabStart(evt, haloItem) {
    if (haloItem.isCopyItem) {
      console.log("copy items...");
      this.haloCopyObject(haloItem);
    }
    
    this.startPositions.set(this, nodes.globalPosition(this));
    this.nodes.forEach( ea => {
     var pos = nodes.globalPosition(ea);
     this.startPositions.set(ea, pos);
     document.body.appendChild(ea);
     ea.style.position = 'absolute';
     nodes.setPosition(ea, pos);
    });
  }
  
  haloGrabMove(evt, grabHaloItem) {
    this.haloDragTo(events.globalPosition(evt), this.startPositions.get(this));
  }
  
  haloGrabStop(evt, grabHaloItem) {
   var positions = new Map();
    // first add temorarily to selection ... so that we do not drop into each other
   this.nodes.forEach( ea => {
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
      nodes.setPosition(ea, positions.get(ea).subPt(offset));
      // nodes.setPosition(ea, pt(10*++i,10*i))
    });
    HaloService.showHalos(this);
  }
  
  haloResizeStart(evt, haloItem) {
    this.eventOffset = events.globalPosition(evt)
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
  
  
}  
  
  