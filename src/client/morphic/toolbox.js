import * as dragging from './dragging.js';
import * as grabbing from './grabbing.js';

var tools = [{
	name: "none",
	default: true
}, {
	name: "Inspector",
	onActivate: activateInspector,
	onDeactivate: deactivateInspector
}, {
	name: "Grabbing",
	onActivate: activateGrabbing,
	onDeactivate: deactivateGrabbing
}, {
	name: "Dragging",
	onActivate: activateDragging,
	onDeactivate: deactivateDragging
}]

export function createMorphicToolbox() {
	initStylesheet();

	var container = document.createElement("div");
	container.name = "toolbox";
	container.id = "morphic-toolbox"

	var form = document.createElement("form");
	container.appendChild(form);

	$(form).on("change", function(evt) {
		// deactivate the current tool, if it has a deactivation function
		var deactivate = container.currentTool.onDeactivate;
		if (typeof deactivate === "function") {
			deactivate();
		}
		// activate the new tool, if it has an activation function
		var activate = evt.target.tool.onActivate;
		if (typeof activate === "function") {
			activate();
		}

		container.currentTool = evt.target.tool;
	});
	
	// create a radio button for each tool
	tools.forEach(function(ea) {
		var radio = document.createElement("input");
		var id = "radio-button-" + ea.name;
		radio.type = "radio";
		radio.name = "tool-selection";
		radio.id = id;
		radio.value = ea.name;
		radio.tool = ea;
		
		if (ea.default) {
			radio.checked = true;
			container.currentTool = ea;
		}

		var label = document.createElement("label");
		label.for = id;
		label.innerHTML = ea.name;

		form.appendChild(radio);
		form.appendChild(label);
		form.appendChild(document.createElement("br"));
	});

	return container;
}


function initStylesheet() {
	$("<link/>", {
	   rel: "stylesheet",
	   type: "text/css",
	   href: "../src/client/css/morphic.css"
	}).appendTo("head");
}

function activateInspector() {
	console.log("using Inspector");
	$("body").on("click", handleInspect);
}

function deactivateInspector() {
	console.log("deactivate Inspector");
	$("body").off("click", handleInspect);
}

function activateGrabbing() {
	console.log("using Grabbing");
	$("body").on("mousedown", grabbing.start);
	$("body").on("mousemove", grabbing.move);
	$("body").on("mouseup", grabbing.stop);
}

function deactivateGrabbing() {
	console.log("deactivate Grabbing");
	$("body").off("mousedown", grabbing.start);
	$("body").off("mousemove", grabbing.move);
	$("body").off("mouseup", grabbing.stop);
}

function activateDragging() {
	console.log("using Dragging");
	$("body").on("mousedown", dragging.start);
	$("body").on("mousemove", dragging.move);
	$("body").on("mouseup", dragging.stop);
}

function deactivateDragging() {
	console.log("deactivate Dragging");
	$("body").off("mousedown", dragging.start);
	$("body").off("mousemove", dragging.move);
	$("body").off("mouseup", dragging.stop);
}

function globalMousePosition(e) {
	var targetPos = globalPositionOfNode(e.target);
	return {
		x: e.offsetX + targetPos.x,
		y: e.offsetY + targetPos.y
	}
}

function elementsUnderMouseEvent(e) {
	var pos = globalMousePosition(e);
	return document.elementsFromPoint(e.clientX, e.clientY);
}

function globalPositionOfNode(node) {
	var left = 0;
	var top = 0;
	while (node && node !== document.body) {
		left += node.offsetLeft;
		top += node.offsetTop;
		node = node.offsetParent;
	}
	return {
		x: left,
		y: top
	}
}

function handleInspect(e) {
	if (e.ctrlKey || e.metaKey) {
		onMagnify(e);
	} else {
		if (window.that) {
			$(window.that).removeClass("red-border");
		}
	}
}

function onMagnify(e) {
	var grabTarget = e.target;
	var that = window.that;
	var $that = $(that);
	if (that && (grabTarget === that || $.contains(that, grabTarget))) {
		parent = $that.parent();
		if (!parent.is("html")) {
			grabTarget = parent.get(0);
		}
	}
	if (grabTarget !== that) {
		$that.removeClass("red-border")
		$(grabTarget).addClass("red-border");
	}
	window.that = grabTarget;
	console.log("Current element:", grabTarget, "with id:", $(grabTarget).attr("id"));
}
