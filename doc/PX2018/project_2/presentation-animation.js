"enable aexpr";

import Morph from'src/components/widgets/lively-morph.js';

export default class PresentationAnimation extends Morph {
  async initialize() {
    this.windowTitle = "Animation";
    this.registerButtons();

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
    
    this.canvas = this.get("#animation");
    this.context = this.canvas.getContext("2d");
    this.startStep = 0;
  }
  
  set animationSteps(value) {
    this._animationSteps = value;
    this.draw(this._animationSteps[this.startStep]);
    this.curAnimationStep = this.startStep;
  }
  
  onNext() {
    if (this.curAnimationStep == this._animationSteps.length - 1) return;
    
    ++this.curAnimationStep;
    this.draw(this._animationSteps[this.curAnimationStep]);
  }
  
  onPrevious() {
    if (this.curAnimationStep == 0) return;
    
    --this.curAnimationStep;
    this.draw(this._animationSteps[this.curAnimationStep]);
  }
  
  draw(jsonObject) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw the animation step save in the object
    for (let key in jsonObject) {
      this.context.fillStyle = jsonObject[key].color != undefined ? jsonObject[key].color : '#000';
      if (jsonObject[key].type === "points") {
        for (let i = 0; i < jsonObject[key].value.length; ++i) {
          let posX = jsonObject[key].value[i][0];
          let posY = jsonObject[key].value[i][1];
          let size = jsonObject[key].size != undefined ? jsonObject[key].size : 4;
          this.context.fillRect(posX, posY, 4, 4);
        }
      }
      if (jsonObject[key].type === "circle") {
        this.context.beginPath();
        this.context.arc(jsonObject[key].x, jsonObject[key].y, jsonObject[key].radius, 0, 2 * Math.PI);
        this.context.closePath();
      }
      if (jsonObject[key].type === "rect") {
        this.context.beginPath();
        this.context.rect(jsonObject[key].x, jsonObject[key].y, jsonObject[key].width, jsonObject[key].height);
        this.context.closePath();
      }
      
      if (jsonObject[key].filled !== undefined && jsonObject[key].filled) {
        this.context.fill();
      } else if (jsonObject[key].filled !== undefined) {
        this.context.strokeStyle = jsonObject[key].color;
        this.context.stroke();
      }
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

lively.components.addTemplatePath(lively4url + "/doc/PX2018/project_2/");
lively.components.resetTemplatePathCache();