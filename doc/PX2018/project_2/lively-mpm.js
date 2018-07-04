"enable aexpr";

// TODO: Animation start/stop button

import Morph from'src/components/widgets/lively-morph.js';
import VibratingPoint from 'doc/PX2018/project_2/vibratingpoint.js';
import VibratingContinuumBar from 'doc/PX2018/project_2/vibratingcontinuumbar.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.algorithms = { "Vibrating Poin": VibratingPoint, "Vibrating Continuum Bar": VibratingContinuumBar };
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons()
    this.time = 1;

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
     
    this.canvas = this.get("#mpm");
    this.youngInput = this.get("#young-modulus");
    
    this.context = this.canvas.getContext("2d");
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + 1 + ")";
    
    
  }
  
  draw(particles) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < particles.length; ++i) {
    let posX = particles[i] + (this.canvas.width / 2) - (this.animation.L / 2);
      let posY = (this.canvas.height / (particles.length + 1)) * (i + 1);
      this.context.fillRect(posX, posY, this.particleSize, this.particleSize);
    }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    
  }
  
  onToggleAnimation() {
    if (this.animation.running) {
      this.animation.stopAnimating();
      this.get("#toggleAnimation").innerHTML = "start";
    } else {
      // Start animating
      this.animation.startAnimating(this);
      this.get("#toggleAnimation").innerHTML = "stop";
    }
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

lively.components.addTemplatePath(lively4url + "/doc/PX2018/project_2/")
lively.components.resetTemplatePathCache()