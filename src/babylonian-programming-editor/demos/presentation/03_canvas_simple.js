var ctx, canvasWidth, canvasHeight;

// Scene
function drawScene(canvas) {
	ctx = canvas.getContext('2d');
	// extendCanvasContext(ctx);
	
	canvasWidth = parseInt(canvas.getAttribute("width"));
	canvasHeight = parseInt(canvas.getAttribute("height"));
	
	drawSky();
	drawMountains();
	drawTree();
}

// Sky
function drawSky() {
	ctx.save();

	var gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
	gradient.addColorStop(0, "#b4e0fe");
	gradient.addColorStop(1, "#d3f8ff");
	
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	
	ctx.restore();
}

// Mountains
function drawMountains() {
	//resetRandom();
	drawMountain(130, "#8bb2bb");
	drawMountain(50, "#618087");
}

function drawMountain (offset, fillStyle) {
	var x = 0;
	var y = canvasHeight - offset;

	ctx.beginPath();
	ctx.moveTo(x, y);

	while (x >= 0 && x < canvasWidth) {
		x += random(2, 10);
		y += random(-4, 3);
		ctx.lineTo(x, y);
	}

	ctx.lineTo(canvasWidth, canvasHeight);
	ctx.lineTo(0, canvasHeight);
	ctx.closePath();

	ctx.fillStyle = fillStyle;
	ctx.fill();
}

// Tree
function drawTree() {
	var blossomPoints = [];

	//resetRandom();
	drawBranches(0, -Math.PI/2, canvasWidth/2, canvasHeight, 30, blossomPoints);
	
	//resetRandom();
	drawBlossoms(blossomPoints)
}

// Branches
function /*slider:*/drawBranches/*{}*/ (i, angle, /*probe:*/x/*{}*/, /*probe:*/y/*{}*/, width, blossomPoints) {
	ctx.save();

	var length = random(30, 50) * (1 - i/20);
	if (i == 0) { length = 100; }

	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.fillStyle = "#000";
	ctx.fillRect(0, -width/2, length, width);

	ctx.restore();

	var tipX = x + (length - width/2) * Math.cos(angle);
	var tipY = y + (length - width/2) * Math.sin(angle);

	if (i > 4) {
		blossomPoints.push([x, y, tipX, tipY]);
	}

	if (i < 6) {
		drawBranches(i + 1, angle + random(-0.55, -0.35), tipX-width/4, tipY, width/2, blossomPoints);
		drawBranches(i + 1, angle + random( 0.55, 0.35), tipX+width/4, tipY, width/2, blossomPoints);
	} else if (i < 8) {
		drawBranches(i + 1, angle + random( 0.25, -0.05), tipX+width/4, tipY, width/2, blossomPoints);
	}
}

// Blossoms
function drawBlossoms(blossomPoints) {
	var colors = ["#f5ceea", "te8d9e4", "#f7c9f3", "tebbdcc"];
	ctx.globalAlpha = 0.60;

	for (var i = 0; i < blossomPoints.length; i++) {
		var p = blossomPoints[i];
		for (var j = 0; j < 16; j++) {
			var x = lerp(p[0], p[2], random(0, 1)) + random(-10, 10);
			var y = lerp(p[1], p[3], random(0, 1)) + random(-10, 10);
			
      ctx.beginPath();
			ctx.fillStyle = colors[Math.floor(random(0, colors.length))];
			ctx.arc(x, y, random(2, 5), 0, Math.PI*2, true);
      ctx.fill();
		}
	}

	ctx.globalAlpha = 1.0;
}

// Tools
function random(low, high) {
	return Math.random() * (high - low) + low;
}

function lerp(a, b, distance) {
  return a + (b - a) * distance;
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */