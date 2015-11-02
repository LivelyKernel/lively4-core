export function initMorphicTools() {
	initDragBehaviour();
	initMagnifier();
}

function initMagnifier() {
	$("body").on("click", (e) => {
		if (e.ctrlKey) {
			let target = getTargetElementFromEvent(e);
			console.log("Current element:" ,target);
		}
	});
}

function getTargetElementFromEvent(e) {
	return e.target;
}

function initDragBehaviour() {
	$("body").on("click", function(evt) {
		
	});
}

export function makePart(partRoot) {
	var shadow = partRoot.createShadowRoot();

	// We need to bring the styles into the shadow root,
	// because otherwise they will not be applied to the 
	// shadow dom elements.
	
	// collect styles
	var combinedStyle = "";
	var styles = document.styleSheets;
	for (var i = 0; i < styles.length; i++) {
		var styleSheet = styles[i];
		for (var j = 0; j < styleSheet.cssRules.length; j++) {
			var rule = styleSheet.cssRules[j];
			combinedStyle += rule.cssText + "\n";
		}
	}

	// apply style
	var styleElement = document.createElement("style");
	styleElement.innerHTML = combinedStyle;
	shadow.appendChild(styleElement);

	// make a shallow copy of the children object, 
	// since partRoot.children changes in the following loop
	var children = $.extend({}, partRoot.children);
	// append all children to the shadow dom
	for (var i = 0; i < children.length; i++) {
		shadow.appendChild(children[i]);
	}
}
