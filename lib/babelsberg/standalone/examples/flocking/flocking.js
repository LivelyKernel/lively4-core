var canvasId = "canvas";

// setup canvas
var canvas = document.getElementById(canvasId);
canvas.style.position = "absolute";
canvas.style.top = "0px";
canvas.style.left = "0px";
canvas.style["z-index"] = -1;

var renderer = new Renderer(canvas);

var input = new Input(canvasId);
input.initMouse();

var dots = [];
for(var i = 0; i < 7; i++) {
	dots.push(new Vector2(Math.random()*canvas.width, Math.random()*canvas.height));
}
bbb.defaultSolver = new Relax();

var ro = bbb.readOnly;

for(var i = 0; i < dots.length; i++) {
	/*
	always: {
		(dots[i].x - ro(input.mouse.x)) * (dots[i].x - ro(input.mouse.x)) + (dots[i].y - ro(input.mouse.y)) * (dots[i].y - ro(input.mouse.y)) == 0
	}
	*/
	if(i == 0) {
		always: {
			(dots[i].x - ro(input.mouse.x)) * (dots[i].x - ro(input.mouse.x)) < 100
		}
		always: {
			(dots[i].y - ro(input.mouse.y)) * (dots[i].y - ro(input.mouse.y)) < 100
		}
	} else {
		always: { (dots[i].x - dots[i-1].x) * (dots[i].x - dots[i-1].x) > 200 }
		always: { (dots[i].y - dots[i-1].y) * (dots[i].y - dots[i-1].y) > 200 }
		always: { (dots[i].x - dots[i-1].x) * (dots[i].x - dots[i-1].x) < 1000 }
		always: { (dots[i].y - dots[i-1].y) * (dots[i].y - dots[i-1].y) < 1000 }
	}
	
}

// frame update
var update = function(dt) {

	// drawing
	renderer.clear();
	renderer.drawDot(input.mouse, 5, "red", 1);
	
	var size = 7;
	for(var i = 0; i < dots.length; i++) {
		renderer.drawDot(dots[i], size *= 0.8, "green", 1);
	}

	input.clearPressed();
}

// main loop
var lastFrame = window.performance.now();
function animate() {
	// time since last call
	var time = window.performance.now();
	var dt = (time - lastFrame) / 1000;
	lastFrame = time;

	console.log(dt);
	update(dt);
	requestAnimationFrame(animate);
}

animate();
