
import Morph from './Morph.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'lively.graphics';

import Halo from './Halo.js'

export default class Selection extends Morph {
 
  initialize() {
    // super.initialize()
    this.nodes = []
    this.startPositions = new Map()
  }
  
  haloRemove() {
    this.nodes.forEach(ea => {
      console.log("selection.remove " + ea)
      ea.remove()
    })
    this.remove()
  }
 
  haloCopyObject(el) {
    this.nodes = this.nodes.map(ea => {
      var copy = ea.cloneNode()
      ea.parentNode.appendChild(copy); 
    })
    return this
  }
 
  haloDragTo(toPos, fromPos) {
    var delta = toPos.subPt(fromPos)
    this.nodes.concat([this]).forEach(ea => {
      var startPos = this.startPositions.get(ea)
      if (!startPos) {
        ea.style.position = "absolute"
        startPos = nodes.getPosition(ea)
        this.startPositions.set(ea, startPos)
      }
      nodes.setPosition(ea, startPos.addPt(delta))
    })
    Halo.showHalos(this)
  }
 
  haloGrabStart(evt, grabHaloItem) {
    this.startPositions.set(this, nodes.globalPosition(this))
    this.nodes.forEach( ea => {
     var pos = nodes.globalPosition(ea);
     this.startPositions.set(ea, pos)
     document.body.appendChild(ea)
     ea.style.position = 'absolute'
     nodes.setPosition(ea, pos)
    })
  }
  
  haloGrabMove(evt, grabHaloItem) {
    this.haloDragTo(events.globalPosition(evt), this.startPositions.get(this))
   
  }
  
  haloGrabStop(evt, grabHaloItem) {
   var positions = new Map()
    // first add temorarily to selection ... so that we do not drop into each other
   this.nodes.forEach( ea => {
      
      positions.set(ea, nodes.globalPosition(ea))
      this.appendChild(ea)
    })

    var dropTarget = grabHaloItem.droptargetAtEvent(this, evt);

    // then drop into the real target

    dropTarget = dropTarget || document.body; // we have to drop somewhere
    var i=0;
    var offset = nodes.globalPosition(dropTarget)
    this.nodes.forEach( ea => {
      dropTarget.appendChild(ea)
      ea.style.position = "absolute"
      nodes.setPosition(ea, positions.get(ea).subPt(offset))
      // nodes.setPosition(ea, pt(10*++i,10*i))
    })
    // this.nodes = []
    // this.remove()
    Halo.showHalos(this)
    
  }
  
}  
  
  