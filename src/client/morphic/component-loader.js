import scriptManager from  "../script-manager.js";
import * as persistence from  "../persistence.js";
import Morph from "../../../templates/classes/Morph.js";

import * as kernel from 'kernel';

// store promises of loaded and currently loading templates
export var loadingPromises = {};

export var templates = {}
export var prototypes = {}
export var proxies = {}

// for compatibility
export function register(componentName, template, prototype) {
    return ComponentLoader.register(componentName, template, prototype)
}

export default class ComponentLoader {

  static get templates() {
    return templates
  }

  static get prototypes() {
    return prototypes
  }

  static get proxies() {
    return proxies
  }

  static protypeToComponentName(prototype) {
    if (!prototype || !prototype.constructor) return
    var prototypeName =  prototype.constructor.name
    return _.detect(_.keys(this.prototypes),
      name => {
        var otherProto = this.prototypes[name]
        var constructor = otherProto && otherProto.constructor;
        return constructor && (constructor.name ===  prototypeName)})
  }

  static updatePrototype(prototype) {
    var componentName = this.protypeToComponentName(prototype)
    if (componentName) {
      this.prototypes[componentName] = prototype
      this.proxies[componentName].__proto__ = prototype
    }
  }

  // this function registers a custom element,
  // it is called from the bootstap code in the component templates
  static register(componentName, template, prototype) {
    console.log("register " + componentName)
    var proto = prototype || Object.create(Morph.prototype);

    // For reflection and debugging
    templates[componentName] = template;
    prototypes[componentName] = proto;
    proxies[componentName] = Object.create(proto) // not changeable


    // #TODO: we should check here, if the prototype already has a createdCallback,
    // if that's the case, we should wrap it and call it in our createdCallback
    var previousCreatedCallback = proto.createdCallback;

    // #TODO: should we dispatch event 'created' also in attached callback???
    // And what about initizalize call? Actually I think yes. - Felix
    proxies[componentName].createdCallback = function() {
      if (persistence.isCurrentlyCloning()) {
        return;
      }

      var shadow = this.createShadowRoot();

      // clone the template again, so when more elements are created,
      // they get their own copy of elements
      var clone = document.importNode(templates[componentName], true);
      // #TODO replace the "template" reference with an indirection that can be changed from the outside,
      // e.g. var clone = document.importNode(templates[componentName], true);
      // but beeing able to modify it, because we have a reference should suffice at the moment...

      shadow.appendChild(clone);

      // attach lively4scripts from the shadow root to this
      scriptManager.attachScriptsFromShadowDOM(this);

      if (prototypes[componentName].createdCallback) {
        prototypes[componentName].createdCallback.call(this);
      }


      // load any unknown elements, which this component might introduce
      ComponentLoader.loadUnresolved(this, true).then((args) => {

        lively.fillTemplateStyles(this.shadowRoot).then(() => {
          // call the initialize script, if it exists
          if (typeof this.initialize === "function") {
            this.initialize();
          }
          console.log("dispatch created " +componentName )
          console.log("Identitity: " + (window.LastRegistered === this))
          
          
          this.dispatchEvent(new Event("created"));
        })


      }).catch( e => {
        console.error(e); 
        return e
      });
    }
    proxies[componentName].attachedCallback = function() {
      if (this.attachedCallback && proxies[componentName].attachedCallback != this.attachedCallback) {
        this.attachedCallback.call(this);
      }
      if (prototypes[componentName].attachedCallback) {
        prototypes[componentName].attachedCallback.call(this);
      }
    };
    proxies[componentName].detachedCallback = function() {
      if (this.detachedCallback && proxies[componentName].detachedCallback != this.detachedCallback) {
        this.detachedCallback.call(this);
      } else if (prototypes[componentName].detachedCallback) {
        prototypes[componentName].detachedCallback.call(this);
      }
    };

    // don't store it just in a lexical scope, but make it available for runtime development

    document.registerElement(componentName, {
      prototype: proxies[componentName]
    });
  }

  // this function creates the bootstrap script for the component templates
  static createRegistrationScript(componentId) {
    var script = document.createElement("script");
    script.className = "registrationScript";
    script.innerHTML = "lively.registerTemplate()";
    return script;
  }

  // this function loads all unregistered elements, starts looking in lookupRoot,
  // if lookupRoot is not set, it looks in the whole document.body,
  // if deep is set, it also looks into shadow roots
  static loadUnresolved(lookupRoot, deep) {
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
      this.loadByName(name);

      return createdPromise;
    });

    // return a promise that resolves once all unresolved elements from the unresolved-array
    // are completely created
    return Promise.all(promises);
  }

  // this function loads a component by adding a link tag to the head
  static loadByName(name) {
      var link = document.createElement("link");
      link.rel = "import";
      link.href = kernel.resolve('/templates/' + name + '.html')
      link.dataset.lively4Donotpersist = "all";

      document.head.appendChild(link);
  }

  static createComponent(tagString) {
    var comp = document.createElement(tagString);
    return comp;
  }

  static openIn(parent, component, beginning) {
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
    this.loadUnresolved(document.body, true);

    return compPromise;
  }

  static openInBody(component) {
    return this.openIn(document.body, component, true);
  }

  static openInWindow(component) {
    // this will call the window's createdCallback before
    // we append the child, if the window template is already
    // loaded
    var w = this.createComponent("lively-window");
    w.appendChild(component);

    // therefore, we need to call loadUnresolved again after
    // adding the child, so that it finds it and resolves it,
    // if it is currently unresolved
    var windowPromise = new Promise((resolve, reject) => {
      this.loadUnresolved(w, true).then(() => {
        resolve(w);
      });
    });

    this.openInBody(w);

    return windowPromise;
  }

  static openComponentBin() {
    var bin = createComponent("lively-component-bin");
    openInWindow(bin);
  }

  static reloadComponent(source) {
    var template =  $($.parseHTML(source)).filter("template")[0];
    if (!template) return;
    var name = template.id;
    if (!name) return;
    var templateClone = document.importNode(template.content, true);
    lively.components.templates[name] = templateClone;
    return name;
  }
}
