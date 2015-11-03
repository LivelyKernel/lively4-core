export function initMorphicTools() {
	initDragBehaviour();
	initMagnifier();
}

function initMagnifier() {
	$("body").on("click", (e) => {
		if (e.ctrlKey) {
			let target = getTargetElementFromEvent(e);
			console.log("Current element:", target, "with id:", $(target).attr("id"));
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
	var shadow;
	// if there is a shadow root already,
	// we clean it up, since we cannot create a new one
	if (partRoot.shadowRoot) {
		shadow = partRoot.shadowRoot;
		$(shadow.children).each(function(idx) {
			shadow.removeChild(this);
		});
	} else {
		shadow = partRoot.createShadowRoot();
	}

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

export function unpackPart(partRoot) {
	var shadow = partRoot.shadowRoot;
	if (!shadow) {
		return;
	}

	// move all elements but style out of the shadow dom
	$(shadow.children).filter(":not(style)").each(function(idx) {
		partRoot.appendChild(this);
	});

	// remove all remaining child nodes
	$(shadow.children).each(function(idx) {
		shadow.removeChild(this);
	});

	// We cannot remove the shadow root, so to make the content visible,
	// add a content node to the shadow dom. This should be equivalent to having 
	// no shadow dom at all.
	shadow.appendChild(document.createElement("content"));
}
