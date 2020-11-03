import Tree from './tree-base.js';

class /*instance:*//*instance:*/TreeScene/*{"id":"041d_a6df_bfab","name":{"mode":"input","value":"Cherry at day"},"values":{"stemHeight":{"mode":"input","value":"100"},"stemWidth":{"mode":"input","value":"30"},"treeKind":{"mode":"input","value":"TreeScene.CHERRY"},"time":{"mode":"input","value":"TreeScene.DAY"}}}*//*{"id":"8f4d_e4fa_d9c8","name":{"mode":"input","value":"Birch at night"},"values":{"stemHeight":{"mode":"input","value":"70"},"stemWidth":{"mode":"input","value":"20"},"treeKind":{"mode":"input","value":"TreeScene.BIRCH"},"time":{"mode":"input","value":"TreeScene.NIGHT"}}}*/ {
  constructor(stemHeight, stemWidth, treeKind, time) {
    if(!(treeKind in TreeScene.treeProps)) {
      throw new Error(`Unknown tree kind: ${treeKind}`)
    }
    if(!(time in TreeScene.timeProps)) {
      throw new Error(`Unknown tree kind: ${time}`)
    }
    this.stemHeight = stemHeight;
    this.stemWidth = stemWidth;
    this.treeProps = TreeScene.treeProps[treeKind];
    this.timeProps = TreeScene.timeProps[time];
  }
  
  // Scene
  /*example:*//*example:*/drawTo/*{"id":"c6e1_19d7_d93f","name":{"mode":"input","value":"Day scene"},"color":"hsl(120, 30%, 70%)","values":{"canvas":{"mode":"select","value":"90ad_13f3_ab24"}},"instanceId":{"mode":"select","value":"041d_a6df_bfab"},"prescript":"","postscript":""}*//*{"id":"adae_12ea_92df","name":{"mode":"input","value":"Night scene"},"color":"hsl(100, 30%, 70%)","values":{"canvas":{"mode":"select","value":"90ad_13f3_ab24"}},"instanceId":{"mode":"select","value":"8f4d_e4fa_d9c8"},"prescript":"","postscript":""}*/(canvas) {
    this.ctx = canvas.getContext('2d');

    this.canvasWidth = /*probe:*/canvas.width/*{}*/;
    this.canvasHeight = canvas.height;

    this.drawSky(this.ctx);
    this.drawMountains(this.ctx);
    this.drawTree(/*probe:*/this.ctx/*{}*/);
  }

  // Sky
  drawSky() {
    this.ctx.save();

    var gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, this.timeProps.skyColors[0]);
    gradient.addColorStop(1, this.timeProps.skyColors[1]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.restore();
    
    this.ctx.beginPath();
    this.ctx.fillStyle = this.timeProps.sunColor;
    this.ctx.arc(
      this.canvasWidth / this.timeProps.sunXRatio,
      this.canvasHeight / this.timeProps.sunYRatio,
      this.timeProps.sunSize,
      0,
      Math.PI*2
    );
    this.ctx.fill();
  }

  // Mountains
  drawMountains() {
    this.drawMountain(130, this.timeProps.mountainColors[0]);
    this.drawMountain(50, this.timeProps.mountainColors[1]);
  }

  drawMountain (offset, fillStyle) {
    var x = 0;
    var y = this.canvasHeight - offset;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    while (x >= 0 && x < this.canvasWidth) {
      x += random(2, 10);
      y += random(-4, 3);
      this.ctx.lineTo(x, y);
    }

    this.ctx.lineTo(this.canvasWidth, this.canvasHeight);
    this.ctx.lineTo(0, this.canvasHeight);
    this.ctx.closePath();

    this.ctx.fillStyle = fillStyle;
    this.ctx.fill();
  }

  // Tree
  drawTree() {
    var aTree = new Tree(-Math.PI/2, 
                         this.canvasWidth/2, 
                         this.canvasHeight, 
                         this.stemWidth, 
                         this.stemHeight, 
                         this.treeProps.blossomColors, 
                         this.treeProps.color,
                         this.ctx);
    aTree.draw(this.ctx, random);
  }
  
}

const addStaticProp = (key) => {
  TreeScene[key.toUpperCase()] = key;
};

TreeScene.treeProps = {
  cherry: {
    color: "#000",
    blossomColors: ["#f5ceea", "te8d9e4", "#f7c9f3", "tebbdcc"]
  },
  birch: {
    color: "#ddd",
    blossomColors: ["#F0CE4E", "CF872E", "#A6AD3C", "F6E03F"]
  }
}
Object.keys(TreeScene.treeProps).forEach(addStaticProp);

TreeScene.timeProps = {
  day: {
    sunColor: "#FFE545",
    sunXRatio: 3,
    sunYRatio: 5,
    sunSize: 60,
    skyColors: ["#b4e0fe", "#d3f8ff"],
    mountainColors: ["#8bb2bb", "#618087"]
  },
  night: {
    sunColor: "#F9F6EC",
    sunXRatio: 5,
    sunYRatio: 2.5,
    sunSize: 50,
    skyColors: ["#000", "#ccc"],
    mountainColors: ["#444", "#222"]
  }
}
Object.keys(TreeScene.timeProps).forEach(addStaticProp);

// Tools
function random(low, high) {
	return Math.random() * (high - low) + low;
} /* Context: {"context":{"prescript":"// BEFORE\nMath.seed = 2;\nMath._random = Math.random;\nvar newRandom = function() {\n  var x = Math.sin(Math.seed++) * 1000;\n  return x - Math.floor(x);\n};\n//Math.random = newRandom;","postscript":"// AFTER\nMath.random = Math._random"},"customInstances":[{"id":"90ad_13f3_ab24","name":"A 2D Canvas","code":"const canvas = document.createElement('canvas');\ncanvas.style.height = '700px';\ncanvas.style.width = '700px';\nreturn canvas;"},{"id":"b525_a1b7_4b80","name":"foo","code":"return {hello: 7};"}]} */