"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
    
    this.canvas = this.get("#mpm");
    this.context = this.canvas.getContext("2d");
    
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + (255/255) + ")";
    this.context.fillRect(150, 150, 2, 2);
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    
  }
  
  livelyMigrate(other) {
    
  }
  
  livelyInspect(contentNode, inspector) {
    
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
    // Add mpm data here later
  }
  
  
}