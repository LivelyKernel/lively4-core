
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
}