var morphProto = Object.create(HTMLElement.prototype);

// morphic interface goes here...
// These are dummy methods!
morphProto.setExtent = function(x, y) {
	console.log("set extent");
}
morphProto.setName = function(name) {
	console.log("set name");
	this.name = name;
}
morphProto.getName = function() {
	console.log("get name");
	return this.name;
}
// ...


export function initMorphicTools() {
	initStylesheet();
}

function initStylesheet() {
	$("<link/>", {
	   rel: "stylesheet",
	   type: "text/css",
	   href: "../src/client/css/morphic.css"
	}).appendTo("head");
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
	// Maybe we should not filter rules due to dynamically
	// assigned classes?
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
	template.id = "lively-" + name;

	var fragment = template.content;

	// collect styles
	// Maybe we should not filter rules due to dynamically
	// assigned classes?
	var combinedStyle = collectAppliedCssRules(rootElement);

	// apply style
	var styleElement = document.createElement("style");
	styleElement.innerHTML = combinedStyle;
	fragment.appendChild(styleElement);

	// clone subtree from root
	var clone = rootElement.cloneNode(true);
	fragment.appendChild(clone);

	saveTemplate(template);

	return template;
}

export function saveTemplate(template) {
	var registrationScript = document.createElement("script");
	// MAKE SURE TO USE THE UP TO DATE VERSION WHEN FINALLY IMPLEMENTING THIS!!
	registrationScript.innerHTML = 	"(function() { \
		var template = document.currentScript.ownerDocument.querySelector('#" + template.id + "'); \
		var clone = document.importNode(template.content, true); \
		System.import('/lively4-core/src/client/morphic/component-loader.js') \
			.then(loader => { \
				loader.register('" + template.id + "', clone); \
			}); \
	})();";



	var url = location.protocol + "//" + location.host + "/lively4-core/templates/" + template.id + ".html";
	console.log("export " + template.id + " to " + url);
	// $('<div>').append($(template.outerHTML).clone()).html(); 
	var completeHTML = $('<div>').append($(template.outerHTML).clone()).html() + $('<div>').append($(registrationScript.outerHTML).clone()).html();

	// make it easy to copy the source to clipboard
  window.prompt("Copy source to clipboard: Ctrl+C, Enter", completeHTML);

	// $.ajax({
	//     url: url,
	//     type: 'PUT',
	//     data: template.outerHtml,
	//     success: function() {
 //        console.log("file " + url + " written.");
	// 	},
	// 	error: function(xhr, status, error) {
	// 		console.log("could not write " + url + ": " + error);
	// 	}
	// });
}

export function createElementFromTemplate(template, name) {
	var proto = Object.create(morphProto);

	// called when a new element is constructed
	proto.createdCallback = function() {
		var clone = document.importNode(template.content, true);
		// var shadow = this.createShadowRoot();
		var parent = this;
		$(clone.children).each(function(idx) {
			parent.appendChild(this);
		});
		
		// call the initialize script
		$(template.content).children("script[type=lively4script][name=initialize]").each(function(idx) {
			var fun = new Function(this.innerHTML);
			// run script in context of newly created element
			fun.call(parent);
		});

		// scripts and attributes could be added here to 'this', 
		// maybe by querying the template for lively4scripts?
	}

	var element = document.registerElement(name, {
		prototype: proto
	});

	return element;
}

export function loadPart(partId, onSuccess, onError) {
	loadExternalTemplate(partId + "-template", function(status, template) {
		if (status !== "success") {
			if (typeof onError === "function") { 
				onError(status);
			}
		} else {
			var part = createElementFromTemplate(template, partId);
			if (typeof onSuccess === "function") {
				onSuccess(part);
			}
		}
	});
}

function loadExternalTemplate(templateId, onComplete) {
	if (typeof onComplete !== "function") {
		return;
	}

	var $tempLoader = $(document.createElement("div"));
	$tempLoader.load("../../templates/morphic-templates.html #" + templateId, function(responseText, status) {
		var templates = $tempLoader.children("template");
		if (templates.length === 0) {
			onComplete("template not found");
		} else {
			onComplete(status, templates[0]);
		}
	});
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
