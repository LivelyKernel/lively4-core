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
	console.log("- not implemented -");
}

function deactivateGrabbing() {
	console.log("deactivate Grabbing");
}

function activateDragging() {
	console.log("using Dragging");
	console.log("- not implemented -");
}

function deactivateDragging() {
	console.log("deactivate Dragging");
}

function handleInspect(e) {
	if (e.ctrlKey) {
		onMagnify(e);
	} else {
		if (window.that) {
			$(window.that).removeClass("red-border");
		}
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
