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
	   href: "/src/client/css/morphic.css"
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
	console.log("- not implemented -");
}

function deactivateDragging() {
	console.log("deactivate Dragging");
}

var target;
var isGrabbing = false;

function handleInspect(e) {
	if (e.ctrlKey || e.metaKey) {
		onMagnify(e);
	} else {
		if (window.that) {
			$(window.that).removeClass("red-border");
		}
	}
}

function grab(e) {
	var elementsUnterCursor = document.elementsFromPoint(e.pageX, e.pageY);
	target = elementsUnterCursor[0];
	e.preventDefault();
}

function moveGrabbed(e) {
	if (target) {
		isGrabbing = true;
	}
	if (isGrabbing) {
		var elementsUnterCursor = document.elementsFromPoint(e.pageX, e.pageY);
		var droptarget = elementsUnterCursor[0] == target ?
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
		droptarget.insertBefore(target, nextChildren[0]);
		e.preventDefault();
	}
}

function drop(e) {
	if (isGrabbing) {
		e.preventDefault();
		isGrabbing = false;
		target = null;			
	}
}

function onMagnify(e) {
	var target = e.target;
	var that = window.that;
	var $that = $(that);
	if (that && (target === that || $.contains(that, target))) {
		parent = $that.parent();
		if (!parent.is("html")) {
			target = parent.get(0);
		}
	}
	if (target !== that) {
		$that.removeClass("red-border")
		$(target).addClass("red-border");
	}
	window.that = target;
	console.log("Current element:", target, "with id:", $(target).attr("id"));
}
