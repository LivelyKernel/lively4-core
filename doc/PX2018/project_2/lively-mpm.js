"enable aexpr";

import Morph from'src/components/widgets/lively-morph.js';
import VibratingPoint from 'doc/PX2018/project_2/vibratingpoint.js';
import ElasticBodies from 'doc/PX2018/project_2/elasticbodies.js';
import Matrix from 'doc/PX2018/project_2/matrix.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.algorithms = { "Elastic Bodies": ElasticBodies };
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons();
    this.time = 1;

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    // lively.addEventListener("template", this, "dblclick", 
    //   evt => this.onDblClick(evt));
    
    this.variables = {};
    this.particleSize = 6;
    this.oneDisk = false;
    
    this.canvas = this.get("#mpm");
    
    this.context = this.canvas.getContext("2d");
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + 1 + ")";
    
    this.opacityInput = this.get("#opacity");
    this.speedInput = this.get("#speed");
    let opacityUpdate = function() {      
      let numbers = this.get("#numbers");
      numbers.style.opacity = this.opacityInput.value;
    }
    let speedUpdate = function() {
      this.speed = this.speedInput.value;
    }
    $(this.opacityInput).on("input change", opacityUpdate.bind(this));
    $(this.speedInput).on("input change", speedUpdate.bind(this));
    
    if (!this.animation)  {
      this.animation = new ElasticBodies();
      await this.animation.init();
      this.updateGrid();
    }
    
    
    
    this.draw(this.animation.particles);
  }
  
  async draw(particles) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let log = this.get("#log");
    let table = null;
    if (!log.classList.contains('hidden')) {
      this.animation.showVariables = true;
      table = this.get("lively-table")
    } else {
      this.animation.showVariables = false;
    }
    for (let i = 0; i < particles.length; ++i) {
      let posX = particles[i].get(0);
      let posY = particles[i].get(1);
      
      if (i == 0) {
        this.context.fillStyle = "rgba(" + 0 + "," + 0 + "," + 255 + "," + 1 + ")";
      } else {
        this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + 1 + ")";
      }
      
      this.context.fillRect(posX, posY, this.particleSize, this.particleSize);
      
    }
    if (table && this.animation.displayVariables) {
      
      table.setFromJSO(this.animation.displayVariables)
    }
  }
  
  set explanation(value) {
    if (!Array.isArray(value)) {
      console.log('Given object is not of type Array');
      return;
    }
    
    let explanation = this.get('#explanation');
    for (let item of value) {
      let element = <li></li>;
      element.innerHTML = item;
      explanation.appendChild(element);
    }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    
  }
  
  onToggleAnimation() {
    if (!this.animation) return;
    
    if (this.animation.running) {
      this.animation.stopAnimating();
      this.get("#toggleAnimation").innerHTML = "Start Animation";
    } else {
      // Start animating
      this.animation.startAnimating(this);
      this.get("#toggleAnimation").innerHTML = "Stop Animation";
    }
  }
  
  onStep() {
    if (!this.animation) return;
    if (this.speed) {
      this.animation.speed = this.speed;
    }
    
    this.animation.step(this);
  }
  
  updateGrid() {
    let numbers = this.get("#numbers");
    numbers.innerHTML = ""        
    for (let i = 0; i < this.animation.numElements; ++i) {
      let number = <div class="number"><span>{i}</span></div>;
      number.style.width = this.animation.elementSize[0] + "px";
      number.style.height = this.animation.elementSize[1] + "px";
      numbers.appendChild(number);
    }
    if (this.canvas) {
      // #FIXME
      let canvasRect = this.canvas.getBoundingClientRect();
      numbers.style.top = (this.canvas.offsetTop + 1) + "px";
      numbers.style.left = (this.canvas.offsetLeft + 1) + "px";
    }
  }
  
  enableGrid() {
    let numbers = this.get("#numbers");
    numbers.innerHTML = ""        
    for (let i = 0; i < this.animation.numElements; ++i) {
      let number = <div class="number"><span>{i}</span></div>;
      number.style.width = this.animation.elementSize[0] + "px";
      number.style.height = this.animation.elementSize[1] + "px";
      numbers.appendChild(number);
    }

    let canvasRect = this.canvas.getBoundingClientRect();
    numbers.style.top = (this.canvas.offsetTop + 1) + "px";
    numbers.style.left = (this.canvas.offsetLeft + 1) + "px";
    numbers.classList.remove("hidden");
  }
  
  
  disableGrid() {
    let numbers = this.get("#numbers");
    numbers.classList.add("hidden");
  }
  
  onToggleGrid() {
    
    
    if (!this.animation.showElements) return;
    
    let numbers = this.get("#numbers");
    if (numbers.classList.contains("hidden")) {
      this.enableGrid()
    } else {
      this.disableGrid()
    }
    // lazy initialize grid
    

   
    
  }
  
  reset(oneDisk = false) {
    this.oneDisk = oneDisk;
    this.onReset();
  }
  
  onReset() {
    if (this.animation.running) return;
    
    this.animation = new ElasticBodies(this.oneDisk);
    
    if (this.speed != undefined) {
      this.animation.speed = this.speed;
    }
    
    this.animation.init().then(() => this.draw(this.animation.particles));
  }
  
  onToggleLog() {
    let log = this.get("#log");
    log.classList.toggle("hidden");
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    
  }
  
  livelyMigrate(other) {
    this.animation = other.animation
    // if (!other.get("#numbers").classList.contains("hidden")) {
    if (other.get("#numbers").classList.contains("hidden")) {
      this.get("#numbers").classList.add("hidden")
    } else {
      this.get("#numbers").classList.remove("hidden")
    }
    this.updateGrid()
    //}
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