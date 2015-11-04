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
	var combinedStyle = collectAppliedCssRules(partRoot);

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

export function createMorphFromSubtree(rootElement, tagName) {
	if (tagName.indexOf("-") === -1) {
		console.log("tagName needs to contain a '-'!");
		return;
	}

	var template = createTemplate(rootElement, tagName);
	var construct = createElementFromTemplate(template, tagName);

	return {
		template: template,
		constructMethod: construct
	}
}

export  function createTemplate(rootElement, name) {
	var template = document.createElement("template");
	template.id = name;

	// collect styles
	var combinedStyle = collectAppliedCssRules(rootElement);

	// apply style
	var styleElement = document.createElement("style");
	styleElement.innerHTML = combinedStyle;
	template.appendChild(styleElement);

	// clone subtree from root
	// its might be duplicated, if we have ids in the node at some point
	var clone = rootElement.cloneNode(true);
	template.appendChild(clone);

	return template;
}

export function createElementFromTemplate(template, name) {
	var proto = Object.create(HTMLElement.prototype);

	// called when a new element is constructed
	proto.createdCallback = function() {
		var clone = document.importNode(template, true);
		var shadow = this.createShadowRoot();
		$(clone.children).each(function(idx) {
			shadow.appendChild(this);
		});

		// methods and attributes could be added here to 'this', 
		// maybe by querying the template for lively4scripts?
	}

	var element = document.registerElement(name, {
		prototype: proto
	});

	return element;
}

function collectAppliedCssRules(rootElement) {
	var combinedStyle = "";
	var styles = document.styleSheets;
	for (var i = 0; i < styles.length; i++) {
		var styleSheet = styles[i];
		for (var j = 0; j < styleSheet.cssRules.length; j++) {
			var rule = styleSheet.cssRules[j];
			var selector = rule.selectorText;
			// just add those rule that match an element in the subtree
			if (selectorMatchesTree(selector, rootElement)) {
				combinedStyle += rule.cssText + "\n";				
			}
		}
	}

	return combinedStyle;
}

function selectorMatchesTree(selector, rootElement) {
	// if root matches selector, we are done
	if (rootElement.matches(selector)) {
		return true;
	}

	// if not, check all children
	for (var i = 0; i < rootElement.children.length; i++) {
		if (selectorMatchesTree(selector, rootElement.children[i])) {
			return true;
		}
	}

	// if we reach this, none of the tree nodes matches the selector
	return false;
}