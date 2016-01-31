import * as componentLoader from "./component-loader.js";

var htmlBeautify;
System.import("../src/external/beautify-html.js").then(function(obj){
    htmlBeautify = obj.html_beautify;
});

export function handle(el) {
  // collect information about the component
  var info = {};
  info["name"] = window.prompt("unique name (may contain spaces):");
  if (!info["name"]) {
    return;
  }

  // create html-tag by replacing spaces with '-' and lowercasing
  info["html-tag"] = "lively-" + info["name"].replace(/\s/g, "-").toLowerCase();
  info["description"] = window.prompt("Description:") || "";
  info["author"] = window.prompt("Author:") || "";
  var now = new Date();
  // note that getMonth() returns value [0..11]
  info["date-changed"] = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();

  var categories = window.prompt("Categories (comma separated):") || "";
  // split by ',' and remove leading and trailing white-spaces
  info["categories"] = categories.split(",").map((cat) => { return cat.trim().toLowerCase(); });

  var tags = window.prompt("Tags (comma separated):") || "";
  // split by ',' and remove leading and trailing white-spaces
  info["tags"] = tags.split(",").map((tag) => { return tag.trim().toLowerCase(); });

  info["template"] = info["html-tag"] + ".html";

  createTemplate(el, info);
}

export  function createTemplate(rootElement, info) {
  var template = document.createElement("template");
  template.id = info["html-tag"];

  var fragment = template.content;

  // collect styles
  // Maybe we should not filter rules due to dynamically
  // assigned classes?
  var combinedStyle = collectAppliedCssRules(rootElement);

  // the host should be displayed as inline-block to have the correct width and height
  combinedStyle += "\n:host {display: inline-block;}"

  // apply style
  var styleElement = document.createElement("style");
  styleElement.innerHTML = combinedStyle;
  fragment.appendChild(styleElement);

  // clone root
  var clone = rootElement.cloneNode(true);
  fragment.appendChild(clone);

  return saveTemplate(template, info);
}

function saveTemplate(template, info) {
  var serializer = new XMLSerializer();
  var registrationScript = componentLoader.createRegistrationScript(template.id);

  var templateString = serializer.serializeToString(template);
  var regScriptString = serializer.serializeToString(registrationScript);
  // fix some bad escaping
  var completeHTML = (templateString + regScriptString).replace(new RegExp("&lt;", "g"),"<").replace(new RegExp("&gt;", "g") ,">");

  // beautify
  if (typeof htmlBeautify === "function") {
    // completeHTML = htmlBeautify(completeHTML);
  }

  // var compBin = document.querySelector("lively-component-bin");
  // if (!compBin) {
  //   // right now, we expect a component bin in the page
  //   throw new Error("no component bin found in page");
  // }

  var templateEditor = componentLoader.createComponent("lively-editor");
  componentLoader.openInWindow(templateEditor).then(() => {
    templateEditor.setURL(window.location.origin + "/lively4-core/templates/" + template.id + ".html");
    templateEditor.setText(completeHTML);
  });

  var jsonEditor = componentLoader.createComponent("lively-editor");
  componentLoader.openInWindow(jsonEditor).then(() => {
    jsonEditor.setURL(window.location.origin + "/lively4-core/templates/" + template.id + ".json");
    jsonEditor.setText(JSON.stringify(info));
  });

  // ace.edit("editor").setValue(completeHTML);

  return completeHTML;
}

export function packShadowDOM(subtreeRoot) {
  var shadow;
  // if there is a shadow root already,
  // we clean it up, since we cannot create a new one
  if (subtreeRoot.shadowRoot) {
    shadow = subtreeRoot.shadowRoot;
    $(shadow.children).each(function(idx) {
      shadow.removeChild(this);
    });
  } else {
    shadow = subtreeRoot.createShadowRoot();
  }

  // We need to bring the styles into the shadow root,
  // because otherwise they will not be applied to the
  // shadow dom elements.

  // collect styles
  // Maybe we should not filter rules due to dynamically
  // assigned classes?
  var combinedStyle = collectAppliedCssRules(subtreeRoot);

  // apply style
  var styleElement = document.createElement("style");
  styleElement.innerHTML = combinedStyle;
  shadow.appendChild(styleElement);

  // make a shallow copy of the children object,
  // since subtreeRoot.children changes in the following loop
  var children = $.extend({}, subtreeRoot.children);
  // append all children to the shadow dom
  for (var i = 0; i < children.length; i++) {
    shadow.appendChild(children[i]);
  }
}

export function unpackShadowDOM(subtreeRoot) {
  var shadow = subtreeRoot.shadowRoot;
  if (!shadow) {
    return;
  }

  // move all elements but style out of the shadow dom
  $(shadow.children).filter(":not(style)").each(function(idx) {
    subtreeRoot.appendChild(this);
  });

  // We cannot remove the shadow root, so to make the content visible,
  // add a content node to the shadow dom. This should be equivalent to having
  // no shadow dom at all.
  shadow.appendChild(document.createElement("content"));
}

function collectAppliedCssRules(rootElement) {
  var combinedStyle = [];
  var styles = document.styleSheets;
  for (var i = 0; i < styles.length; i++) {
    var styleSheet = styles[i];
    if (!styleSheet.cssRules) {
      continue;
    }
    for (var j = 0; j < styleSheet.cssRules.length; j++) {
      var rule = styleSheet.cssRules[j];
      var selector = rule.selectorText;
      // just add those rule that match an element in the subtree
      if (selectorMatchesTree(selector, rootElement)) {
        if (combinedStyle.indexOf(rule.cssText) == -1) {
          combinedStyle.push(rule.cssText);
        }
      }
    }
  }

  return combinedStyle.join("\n");
}

function selectorMatchesTree(selector, rootElement) {
  // conservative css rule collection for now

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

