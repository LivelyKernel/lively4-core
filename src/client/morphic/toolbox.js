import * as dragging from './dragging.js';
import * as grabbing from './grabbing.js';
import * as inspecting from './inspecting.js';
import * as deleting from './deleting.js';
import * as copying from './copying.js';

var tools = [{
	name: "none",
	default: true
}, {
	name: "Inspector",
	onActivate: inspecting.activate,
	onDeactivate: inspecting.deactivate
}, {
	name: "Grabbing",
	onActivate: grabbing.activate,
	onDeactivate: grabbing.deactivate
}, {
	name: "Dragging",
	onActivate: dragging.activate,
	onDeactivate: dragging.deactivate
}, {
  name: "Deleting",
  onActivate: deleting.activate,
  onDeactivate: deleting.deactivate
}, {
  name: "Copying",
  onActivate: copying.activate,
  onDeactivate: copying.deactivate
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
