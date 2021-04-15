export default class Tree {
  
  constructor(angle, x, y, stemWidth, stemHeight, blossomColors, branchColor) {
    this.initialAngle = angle;
    this.initialX = x;
    this.initialY = y;
    this.stemWidth = stemWidth;
    this.stemHeight = stemHeight;
    this.blossomColors = blossomColors;
    this.branchColor = branchColor;
    this.resetBlossomPoints();
  }
  
  draw(ctx, random) {
    this.drawBranches(ctx, random, 0, this.initialAngle, this.initialX, this.initialY, this.stemWidth);
    this.drawBlossoms(ctx, random);
    this.resetBlossomPoints();
  }
  
  // Branches
  /*slider:*/drawBranches/*{}*/ (ctx, /*probe:*/random/*{}*/, /*probe:*/i/*{}*/, /*probe:*/angle/*{}*/, x, y, width) {
    ctx.save();

    var /*probe:*/length/*{}*/ = random(this.stemHeight/3, this.stemHeight/2) * (1 - i/20);
    if (i == 0) { length = this.stemHeight; }

    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = this.branchColor;
    ctx.fillRect(0, -width/2, length, width);

    /*probe:*/ctx/*{}*/.restore();

    var tipX = x + (length - width/2) * Math.cos(angle);
    var tipY = y + (length - width/2) * Math.sin(angle);

    if (i > 4) {
      this.blossomPoints.push([x, y, tipX, tipY]);
    }

    if (i < 6) {
      this.drawBranches(ctx, random, i + 1, angle + random(-0.55, -0.35), tipX-width/8, tipY, width/2);
      this.drawBranches(ctx, random, i + 1, angle + random( 0.55, 0.35),  tipX+width/8, tipY, width/2);
    } else if (i < 8) {
      this.drawBranches(ctx, random, i + 1, angle + random( 0.25, -0.05), tipX+width/8, tipY, width/2);
    }
  }
  
  drawBlossoms(ctx, random) {
    ctx.globalAlpha = 0.60;

    for (var i = 0; i < this.blossomPoints.length; i++) {
      var p = this.blossomPoints[i];
      for (var j = 0; j < 16; j++) {
        var x = lerp(p[0], p[2], random(0, 1)) + random(-10, 10);
        var y = lerp(p[1], p[3], random(0, 1)) + random(-10, 10);

        ctx.beginPath();
        ctx.fillStyle = this.blossomColors[Math.floor(random(0, this.blossomColors.length))];
        ctx.arc(x, y, random(this.stemWidth/10, this.stemWidth/5), 0, Math.PI*2, true);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }
  
  resetBlossomPoints() {
    this.blossomPoints = [];
  }
  
}

function lerp(a, b, distance) {
  return a + (b - a) * distance;
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */