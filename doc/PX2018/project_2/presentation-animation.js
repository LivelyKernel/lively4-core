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
    let overlay = this.get('#overlay');
    if (!overlay.classList.contains('hidden')) {
      overlay.innerHTML = '';
      overlay.classList.toggle('hidden');
    }
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw the animation step save in the object
    for (let key in jsonObject) {
      this.context.fillStyle = jsonObject[key].color != undefined ? jsonObject[key].color : '#000';
      if (jsonObject[key].type === "points") {
        for (let i = 0; i < jsonObject[key].value.length; ++i) {
          let posX = jsonObject[key].value[i][0];
          let posY = jsonObject[key].value[i][1];
          let size = jsonObject[key].size != undefined ? jsonObject[key].size : 4;
          this.context.fillRect(posX, posY, size, size);
        }
      }
      
      if (jsonObject[key].type === "overlay") {
        overlay.appendChild(jsonObject[key].value);
        overlay.classList.toggle('hidden');
      }
      
      if (jsonObject[key].type === "arrow") {
        this.drawArrow(jsonObject[key].x1, jsonObject[key].y1, jsonObject[key].x2, jsonObject[key].y2);
      }
      
      if (jsonObject[key].type === "circle") {
        this.context.beginPath();
        this.context.arc(jsonObject[key].x, jsonObject[key].y, jsonObject[key].radius, 0, 2 * Math.PI);
        this.context.closePath();
      }
      
      if (jsonObject[key].type == "dashed-line") {
        this.context.setLineDash([10, 10]);
        this.context.beginPath();
        this.context.moveTo(jsonObject[key].x1, jsonObject[key].y1);
        this.context.lineTo(jsonObject[key].x2, jsonObject[key].y2);
        this.context.stroke();
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
  
  drawArrow(fromx, fromy, tox, toy){
    //variables to be used when creating the arrow
    var headlen = 10;
    var angle = Math.atan2(toy-fromy,tox-fromx);

    //starting path of the arrow from the start square to the end square and drawing the stroke
    this.context.beginPath();
    this.context.moveTo(fromx, fromy);
    this.context.lineTo(tox, toy);
    this.context.strokeStyle = "#000";
    this.context.lineWidth = 2;
    this.context.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    this.context.beginPath();
    this.context.moveTo(tox, toy);
    this.context.lineTo(tox-headlen*Math.cos(angle-Math.PI/14),toy-headlen*Math.sin(angle-Math.PI/14));

    //path from the side point of the arrow, to the other side point
    this.context.lineTo(tox-headlen*Math.cos(angle+Math.PI/14),toy-headlen*Math.sin(angle+Math.PI/14));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    this.context.lineTo(tox, toy);
    this.context.lineTo(tox-headlen*Math.cos(angle-Math.PI/14),toy-headlen*Math.sin(angle-Math.PI/14));

    //draws the paths created above
    this.context.strokeStyle = "#000";
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.fillStyle = "#000";
    this.context.fill();
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