"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyFigure extends Morph {
  async initialize() {
   
    lively.removeEventListener("Figure", this)
    lively.addEventListener("Figure", this, "click", evt => this.onClick(evt))
    
  }

  onClick(evt) {
    if (evt.altKey) return;
    
    
    var element = evt.composedPath().find(ea => ea.classList && ea.classList.contains("lively-content"))
    if (element) {
      window.that = element
      lively.haloService.showHalos(element)
      
    }
  }
  
  async livelyExample() {

  }
  
  livelyMigrate() {
    
  }
  
  livelyAllowsSelection(evt) {
    return true 
  }
  
}