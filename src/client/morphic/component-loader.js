import * as scriptManager from  "../script-manager.js";
import * as persistence from  "../persistence.js";
import Morph from "../../../templates/classes/Morph.js";

// this function registers a custom element,
// it is called from the bootstap code in the component templates
export function register(componentName, template, prototype) {
  var proto = prototype || Object.create(Morph.prototype);

  proto.createdCallback = function() {
    var root = this.createShadowRoot();
    // clone the template again, so when more elements are created,
    // they get their own elements from the template
    var clone = document.importNode(template, true);
    root.appendChild(clone);

    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(this);
    // call the initialize script, if it exists
    if (typeof this.initialize === "function") {
      if (!persistence.isCurrentlyCloning()) {
        this.initialize();
      }
    }

    // load any unknown elements this component might introduce
    loadUnresolved(this, true);
  }

  document.registerElement(componentName, {
    prototype: proto
  });
}

// this function creates the bootstrap script for the component templates
export function createRegistrationScript(componentId) {
  var script = document.createElement("script");
  script.className = "registrationScript";

  script.innerHTML = "(function() { \n \
    var template = document.currentScript.ownerDocument.querySelector('#" + componentId + "'); \n \
    var clone = document.importNode(template.content, true); \n \
    \n \
    Promise.all([ \n \
      System.import('../src/client/morphic/component-loader.js') \n \
    ]).then(modules => { \n \
      var Loader = modules[0]; \n \
      Loader.register('" + componentId + "', clone); \n \
    }); \n \
  })();";

  return script;
}

// this function loads all unregistered elements, starts looking in lookupRoot,
// if lookupRoot is not set, it looks in the whole document.body,
// if deep is set, it also looks into shadow roots
export function loadUnresolved(lookupRoot, deep) {
  lookupRoot = lookupRoot || document.body;

  var selector = deep ? "html /deep/ :unresolved" : ":unresolved";
  // helper set to filter for unique tags
  var unique = new Set();
  
  $(lookupRoot.querySelectorAll(selector)).map(function() {
    return this.nodeName.toLowerCase();
  }).filter(function() {
    // filter for unique tags
    return !unique.has(this) && unique.add(this);
  }).each(function() {
    loadByName(this);
  });
}

// this function loads a component by adding a link tag to the head
export function loadByName(name) {
  console.log("loading Component " + name);
  var link = document.createElement("link");
  link.rel = "import";
  link.href = "../templates/" + name + ".html";

  document.head.appendChild(link);
}