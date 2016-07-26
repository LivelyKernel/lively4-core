import lively from 'src/client/lively.js'
import Morph from './Morph.js'

/*
 * HaloItem are buttons layouted in from o halo around the object 
 */

export default class HaloItem extends Morph {
  initialize() {
    // super.initialize()
    this.registerMouseEvents()
  }

  registerMouseEvents() {
    this.registerEvent('click', 'onClick')
    this.registerEvent('mousedown', 'onMouseDown')
    this.registerEvent('mouseUp', 'onMouseUp')
  }
  
  registerEvent(eventName, methodName) {
    if (this[methodName]) {
      lively.removeEventListener('Morphic', this, eventName)
      lively.addEventListener('Morphic', this, eventName, 
        e => this[methodName](e))
    }  
  }

  
}
