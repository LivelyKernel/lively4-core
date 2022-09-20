class /*instance:*//*instance:*/TreeScene/*{"id":"093a_a0fc_333a","name":{"mode":"input","value":"Cherry at day"},"values":{"stemHeight":{"mode":"input","value":"100"},"stemWidth":{"mode":"input","value":"30"},"treeKind":{"mode":"input","value":"TreeScene.CHERRY"},"time":{"mode":"input","value":"TreeScene.DAY"}}}*//*{"id":"4e7a_5f39_3409","name":{"mode":"input","value":"Birch at night"},"values":{"stemHeight":{"mode":"input","value":"70"},"stemWidth":{"mode":"input","value":"20"},"treeKind":{"mode":"input","value":"TreeScene.BIRCH"},"time":{"mode":"input","value":"TreeScene.NIGHT"}}}*/ {
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
  /*example:*//*example:*/drawTo/*{"id":"b399_785f_5374","name":{"mode":"input","value":"Cherry at day"},"color":"hsl(30, 30%, 70%)","values":{"canvas":{"mode":"connect","value":"b399_785f_5374_canvas"}},"instanceId":{"mode":"select","value":"093a_a0fc_333a"},"prescript":"","postscript":""}*//*{"id":"60bc_a4a6_7b11","name":{"mode":"input","value":"Birch at night"},"color":"hsl(150, 30%, 70%)","values":{"canvas":{"mode":"connect","value":"60bc_a4a6_7b11_canvas"}},"instanceId":{"mode":"select","value":"4e7a_5f39_3409"},"prescript":"","postscript":""}*/(canvas) {
    this.ctx = canvas.getContext('2d');

    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;

    this.drawSky();
    this.drawMountains();
    this.drawTree();
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
    /*probe:*//*{}*/);
    /*probe:*/this.ctx/*{}*/.fill();
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

    /*probe:*/this.ctx/*{}*/.fillStyle = fillStyle;
    this.ctx.fill();
  }

  // Tree
  drawTree() {
    var blossomPoints = [];

    //resetRandom();
    this.drawBranches(0, -Math.PI/2, this.canvasWidth/2, this.canvasHeight, this.stemWidth, blossomPoints);

    //resetRandom();
    this.drawBlossoms(blossomPoints)
  }

  // Branches
  drawBranches (i, angle, x, y, width, blossomPoints) {
    this.ctx.save();

    var length = random(this.stemHeight/3, this.stemHeight/2) * (1 - i/20);
    if (i == 0) { length = this.stemHeight; }

    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = this.treeProps.color;
    this.ctx.fillRect(0, -width/2, length, width);

    this.ctx.restore();

    var tipX = x + (length - width/2) * Math.cos(angle);
    var tipY = y + (length - width/2) * Math.sin(angle);

    if (i > 4) {
      blossomPoints.push([x, y, tipX, tipY]);
    }

    if (i < 6) {
      this.drawBranches(i + 1, angle + random(-0.55, -0.35), tipX-width/8, tipY, width/2, blossomPoints);
      this.drawBranches(i + 1, angle + random( 0.55, 0.35), tipX+width/8, tipY, width/2, blossomPoints);
    } else if (i < 8) {
      this.drawBranches(i + 1, angle + random( 0.25, -0.05), tipX+width/8, tipY, width/2, blossomPoints);
    }
  }

  // Blossoms
  drawBlossoms(blossomPoints) {
    this.ctx.globalAlpha = 0.60;

    for (var i = 0; i < blossomPoints.length; i++) {
      var p = blossomPoints[i];
      for (var j = 0; j < 16; j++) {
        var x = lerp(p[0], p[2], random(0, 1)) + random(-10, 10);
        var y = lerp(p[1], p[3], random(0, 1)) + random(-10, 10);

        this.ctx.beginPath();
        this.ctx.fillStyle = this.treeProps.blossomColors[Math.floor(random(0, this.treeProps.blossomColors.length))];
        this.ctx.arc(x, y, random(this.stemWidth/10, this.stemWidth/5), 0, Math.PI*2, true);
        this.ctx.fill();
      }
    }

    this.ctx.globalAlpha = 1.0;
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
}

function lerp(a, b, distance) {
  return a + (b - a) * distance;
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} *//* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */