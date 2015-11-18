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
	   href: "/lively4-core/src/client/css/morphic.css"
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
	$("body").on("mousedown", grab);
	$("body").on("mousemove", moveGrabbed);
	$("body").on("mouseup", drop);
}

function deactivateGrabbing() {
	console.log("deactivate Grabbing");
	$("body").off("mousedown", grab);
	$("body").off("mousemove", moveGrabbed);
	$("body").off("mouseup", drop);
}

function activateDragging() {
	console.log("using Dragging");
	$("body").on("mousedown", startDragging);
	$("body").on("mousemove", drag);
	$("body").on("mouseup", stopDragging);
}

function deactivateDragging() {
	console.log("deactivate Dragging");
	$("body").off("mousedown", startDragging);
	$("body").off("mousemove", drag);
	$("body").off("mouseup", stopDragging);
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

var dragTarget;
var dragOffset;
var isDragging = false;

function startDragging(e) {
	dragTarget = elementsUnderMouseEvent(e)[0];
	dragTarget = document.body === dragTarget ? null : dragTarget;
	if (dragTarget) {
		dragOffset = {
			x: e.offsetX,
			y: e.offsetY
		}		
	}
	e.preventDefault();
}

function setNodePosition(node, pos) {
	node.style.left = '' + pos.x + 'px';
	node.style.top = '' + pos.y + 'px';
}

function drag(e) {
	if (dragTarget) {
		dragTarget.style.position = 'absolute';
		isDragging = true;
	}

	if (isDragging) {
		var newPosition = {
			x: globalMousePosition(e).x - globalPositionOfNode(dragTarget.offsetParent).x - dragOffset.x,
			y: globalMousePosition(e).y - globalPositionOfNode(dragTarget.offsetParent).y - dragOffset.y
		}
		setNodePosition(dragTarget, newPosition);
		e.preventDefault();
	}
}

function stopDragging(e) {
	dragTarget = null;
	isDragging = false;
	e.preventDefault();
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

var grabTarget;
var isGrabbing = false;

function grab(e) {
	grabTarget = elementsUnderMouseEvent(e)[0];
	grabTarget = document.body === grabTarget ? null : grabTarget;
	e.preventDefault();
}

function moveGrabbed(e) {
	if (grabTarget) {
		grabTarget.style.removeProperty('position');
		grabTarget.style.removeProperty('top');
		grabTarget.style.removeProperty('left');
		isGrabbing = true;
	}
	if (isGrabbing) {
		var elementsUnterCursor = elementsUnderMouseEvent(e);
		var droptarget = elementsUnterCursor[0] == grabTarget ?
				elementsUnterCursor[1] :
				elementsUnterCursor[0] ;
		var children = droptarget.childNodes;
		var nextChildren = []; 
		$(children).each(function (idx, child) {
			if (child.nodeType === 1) {
				var childTop = $(child).offset().top;
				var childLeft = $(child).offset().left;
				var childBottom = childTop + $(child).height();
				var childRight = childLeft + $(child).width();
				var toTheRight = childTop <= e.pageY <= childBottom
						&& childLeft > e.pageX;
				var below = childTop > e.pageY
				if (toTheRight || below) {
					nextChildren.push(child);
				}					
			}
		})
		droptarget.insertBefore(grabTarget, nextChildren[0]);
		e.preventDefault();
	}
}

function drop(e) {
	if (isGrabbing) {
		e.preventDefault();
		isGrabbing = false;
		grabTarget = null;
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
