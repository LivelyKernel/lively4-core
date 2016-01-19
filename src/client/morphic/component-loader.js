import * as scriptManager from  "../script-manager.js";
import * as persistence from  "../persistence.js";
import Morph from "../../../templates/classes/Morph.js";

// contains template - Promise map indicating their loading status
// e.g. "lively-window": Promise {...: "resolved", ...}
export var loadedTemplates = {};

// this function registers a custom element,
// it is called from the bootstap code in the component templates
export function register(componentName, template, prototype) {
  var proto = prototype || Object.create(Morph.prototype);

  proto.createdCallback = function() {
    if (persistence.isCurrentlyCloning()) return;

    var root = this.createShadowRoot();
    // clone the template again, so when more elements are created,
    // they get their own elements from the template
    var clone = document.importNode(template, true);
    root.appendChild(clone);

    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(this);
    // call the initialize script, if it exists
    if (typeof this.initialize === "function") {
        this.initialize();
    }

    // load any unknown elements this component might introduce
    loadUnresolved(this, true).then((args) => {
      console.log(this.nodeName + " created event");
      this.dispatchEvent(new Event("created"));
    });

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

  var selector = ":unresolved";

  var unresolved = Array.from(lookupRoot.querySelectorAll(selector));
  if (deep && lookupRoot.shadowRoot) {
    unresolved = unresolved.concat(Array.from(lookupRoot.shadowRoot.querySelectorAll(selector)));
  }

  // helper set to filter for unique tags
  var unique = new Set();

  var promises = unresolved.filter(function(el) {
    // filter for unique tag names
    var name = el.nodeName.toLowerCase();
    return !loadedTemplates[name] && !unique.has(name) && unique.add(name);
  }).map(function(el) {
    var createdPromise = new Promise((resolve, reject) => {
      el.addEventListener("created", (e) => {
        e.stopPropagation();
        console.log("received created event from " + el.nodeName.toLowerCase());
        resolve(e);
      });
    });

    loadByName(el.nodeName.toLowerCase());

    return createdPromise;
  });


  return Promise.all(promises);
}

// this function loads a component by adding a link tag to the head
export function loadByName(name) {
  if (loadedTemplates[name]) {
    console.log(name + " already loaded or currently loading");
    return loadedTemplates[name];
  }

  loadedTemplates[name] = new Promise((resolve, reject) => {
    var link = document.createElement("link");
    link.rel = "import";
    link.href = (window.lively4Url || "../") + "templates/" + name + ".html";
    link.dataset.lively4Donotpersist = 'all';
    // link.href = "../templates/" + name + ".html";

    link.addEventListener("load", (e) => {
      resolve(e);
    });
    link.addEventListener("error", reject);

    document.head.appendChild(link);
  });

  return loadedTemplates[name];
}

export function createComponent(tagString) {
  var comp = document.createElement(tagString);

  return comp;
}

export function openInBody(component) {
  var compPromise = new Promise((resolve, reject) => {
    component.addEventListener("created", (e) => {
      console.log(component.nodeName + " created!");
      resolve(e.target);
    });
  });

  // adding it here might result in flickering, since it loads afterwards
  document.body.insertBefore(component, document.body.firstChild);
  var loadPromise = loadByName(component.nodeName.toLowerCase());

  // return Promise.all([compPromise, loadPromise]);
  return compPromise;
}

export function openInWindow(component) {
  var compPromise = new Promise((resolve, reject) => {
    component.addEventListener("created", (e) => {
      resolve(e.target);
    });
  });

  var w = createComponent("lively-window");
  w.appendChild(component);

  var helperPromise = new Promise((resolve, reject) => {
    loadUnresolved(w, true).then((args) => {
      resolve(component);
    });

  });

  var winPromise = openInBody(w);

  // Promise is resolved once the component and the window fire
  // their created event
  // return Promise.all([compPromise, winPromise, helperPromise]);
  return helperPromise;
}

export function openComponentBin() {
  var bin = createComponent("lively-component-bin");
  openInWindow(bin);
}
