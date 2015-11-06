export function createMorphicToolbox() {
	var container = document.createElement("div");
	container.name = "toolbox";
	container.id = "morphic-toolbox";
	container.style.width = "120px";
	container.style.borderRadius = "5px";
	container.style.background = "#eeeeee";
	container.style.padding = "5px";

	var form = document.createElement("form");
	container.appendChild(form);
	
	tools.forEach(function(ea) {
		var radio = document.createElement("input");
		var id = "radio-button-" + ea.name;
		radio.type = "radio";
		radio.name = "tool-selection";
		radio.id = id;
		radio.value = ea.name;
		$(radio).on("focus", ea.onActivate);
		$(radio).on("blur", ea.onDeactivate);
		if (ea.default) {
			radio.checked = true;
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

var tools = [{
	name: "none",
	onActivate: clearTools,
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

function clearTools() {
	console.log("clear tools");
}

function activateInspector() {
	console.log("using Inspector");
}

function deactivateInspector() {
	console.log("deactivate Inspector");
}

function activateGrabbing() {
	console.log("using Grabbing");
}

function deactivateGrabbing() {
	console.log("deactivate Grabbing");
}

function activateDragging() {
	console.log("using Dragging");
}

function deactivateDragging() {
	console.log("deactivate Dragging");
}