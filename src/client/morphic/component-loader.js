import * as scriptManager from  "../script-manager.js";
import * as persistence from  "../persistence.js";
import Morph from "../../../templates/classes/Morph.js";

// store promises of loaded and currently loading templates
export var loadingPromises = {};

export var templates = {}
export var prototypes = {}

// this function registers a custom element,
// it is called from the bootstap code in the component templates
export function register(componentName, template, prototype) {
  console.log("register " + componentName)
  var proto = prototype || Object.create(Morph.prototype);

  // For reflection and debugging
  templates[componentName] = template;
  prototypes[componentName] = prototype;

  // #TODO: we should check here, if the prototype already has a createdCallback,
  // if that's the case, we should wrap it and call it in our createdCallback
  var previousCreatedCallback = proto.createdCallback;

  // #TODO: should we dispatch event 'created' also in attached callback???
  // And what about initizalize call? Actually I think yes. - Felix
  proto.createdCallback = function() {
    if (persistence.isCurrentlyCloning()) {
      return;
    }

    var shadow = this.createShadowRoot();

    // clone the template again, so when more elements are created,
    // they get their own copy of elements
    var clone = document.importNode(template, true);
    // #TODO replace the "template" reference with an indirection that can be changed from the outside,
    // e.g. var clone = document.importNode(templates[componentName], true);
    // but beeing able to modify it, because we have a reference should suffice at the moment...

    shadow.appendChild(clone);

    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(this);

    if (this.createdCallback.previousCreatedCallback) {
      this.createdCallback.previousCreatedCallback.call(this)
    }

    // load any unknown elements, which this component might introduce
    loadUnresolved(this, true).then((args) => {
      // call the initialize script, if it exists
      if (typeof this.initialize === "function") {
        this.initialize();
      }



      this.dispatchEvent(new Event("created"));
    });
  }
  // don't store it just in a lexical scope, but make it available for runtime development
  proto.createdCallback.previousCreatedCallback = previousCreatedCallback;

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

  // find all unresolved elements looking downwards from lookupRoot
  var unresolved = Array.from(lookupRoot.querySelectorAll(selector));

  if (deep) {
    var deepUnresolved = findUnresolvedDeep(lookupRoot);
    unresolved = unresolved.concat(deepUnresolved);
  }

  function findUnresolvedDeep(root) {
    var shadow = root.shadowRoot;
    if (!shadow) {
      return [];
    }

    var result = Array.from(shadow.querySelectorAll(selector));

    Array.from(shadow.children).forEach((child) => {
      result = result.concat(findUnresolvedDeep(child));
    });

    return result;
  }

  // helper set to filter for unique tags
  var unique = new Set();

  var promises = unresolved.filter((el) => {
    // filter for unique tag names
    var name = el.nodeName.toLowerCase();
    return !unique.has(name) && unique.add(name);
  }).map((el) => {
    var name = el.nodeName.toLowerCase();
    if (loadingPromises[name]) {
      // the loading was already triggered
      return loadingPromises[name];
    }

    // create a promise that resolves once el is completely created
    var createdPromise = new Promise((resolve, reject) => {
      el.addEventListener("created", (evt) => {
        evt.stopPropagation();
        resolve(evt);
      });
    });

    // trigger loading the template of the unresolved element
    loadingPromises[name] = createdPromise;
    loadByName(name);

    return createdPromise;
  });

  // return a promise that resolves once all unresolved elements from the unresolved-array
  // are completely created
  return Promise.all(promises);
}

// this function loads a component by adding a link tag to the head
export function loadByName(name) {
    var link = document.createElement("link");
    link.rel = "import";
    link.href = (window.lively4Url || "../") + "templates/" + name + ".html";
    link.dataset.lively4Donotpersist = "all";

    document.head.appendChild(link);
}

export function createComponent(tagString) {
  var comp = document.createElement(tagString);

  return comp;
}

export function openIn(parent, component, beginning) {
  var compPromise = new Promise((resolve, reject) => {
    component.addEventListener("created", (e) => {
      e.stopPropagation();
      resolve(e.target);
    });
  });

  if (beginning) {
    parent.insertBefore(component, parent.firstChild);
  } else {
    parent.appendChild(component);
  }
  loadUnresolved(document.body, true);

  return compPromise;
}

export function openInBody(component) {
  return openIn(document.body, component, true);
}

export function openInWindow(component) {
  // this will call the window's createdCallback before
  // we append the child, if the window template is already
  // loaded
  var w = createComponent("lively-window");
  w.appendChild(component);

  // therefore, we need to call loadUnresolved again after
  // adding the child, so that it finds it and resolves it,
  // if it is currently unresolved
  var windowPromise = new Promise((resolve, reject) => {
    loadUnresolved(w, true).then(() => {
      resolve(w);
    });
  });

  openInBody(w);

  return windowPromise;
}

export function openComponentBin() {
  var bin = createComponent("lively-component-bin");
  openInWindow(bin);
}
