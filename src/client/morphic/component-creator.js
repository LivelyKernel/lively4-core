import { createRegistrationScript } from "./component-loader.js";

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
  $(rootElement.children).each(function(idx) {
    var clone = this.cloneNode(true);
    fragment.appendChild(clone);
  });

  return saveTemplate(template);
}

export function saveTemplate(template) {
  var serializer = new XMLSerializer();
  var registrationScript = createRegistrationScript(template.id);

  var templateString = serializer.serializeToString(template);
  var regScriptString = serializer.serializeToString(registrationScript);
  // fix some bad escaping
  var completeHTML = (templateString + regScriptString).replace(new RegExp("&lt;", "g"),"<").replace(new RegExp("&gt;", "g") ,">");

  ace.edit("editor").setValue(completeHTML);

  return completeHTML;
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
  // collect everything for now
  return true;
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
