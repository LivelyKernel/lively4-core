"enable aexpr";

import Morph from'src/components/widgets/lively-morph.js';
import VibratingPoint from 'doc/PX2018/project_2/vibratingpoint.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons()
    this.time = 1;

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
     
    this.canvas = this.get("#mpm");
    this.speedInput = this.get("#speed");
    this.youngInput = this.get("#young-modulus");
    this.extendInput = this.get("#extend");
    this.numParticlesInput = this.get("#num-particles");
    this.particleSizeInput = this.get("#particle-size");
    this.animation = new VibratingPoint();
    this.particleSize = 2;

    $(this.speedInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.speed = this.speedInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.youngInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.young = this.youngInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.extendInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.extend = this.extendInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.numParticlesInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.animation.numParticles = this.numParticlesInput.value;
    });
    
    $(this.particleSizeInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.particleSize = this.particleSizeInput.value;
    });
    
    this.context = this.canvas.getContext("2d");
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + 1 + ")";
    
    // Start animating
    new Promise(() => this.animation.execute(this));
  }
  
  draw(particles) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < particles.length; ++i) {
      //console.log("width: ", particles[i] + (this.canvas.width / 2) - 50);
      //console.log("height: ", (this.canvas.height / particles.length) * (i + 1));
      this.context.fillRect(particles[i] + (this.canvas.width / 2) - (this.animation.L / 2), (this.canvas.height / (particles.length + 1)) * (i + 1), this.particleSize, this.particleSize);
    }
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

lively.components.addTemplatePath(lively4url + "/doc/PX2018/project_2/")
lively.components.resetTemplatePathCache()