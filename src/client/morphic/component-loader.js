import scriptManager from  "src/client/script-manager.js";
import * as persistence from  "src/client/persistence.js";
import Morph from "templates/Morph.js";
import {pt} from '../graphics.js';

import * as kernel from 'kernel';

// store promises of loaded and currently loading templates
export var loadingPromises = {};

var _templates;
var _prototypes;
var _proxies;

// for compatibility
export function register(componentName, template, prototype) {
  return ComponentLoader.register(componentName, template, prototype);
}

export default class ComponentLoader {

  static get templates() {
    if (!_templates) _templates = {};
    return _templates;
  }

  static get prototypes() {
    if (!_prototypes) _prototypes = {};
    return _prototypes;
  }

  static get proxies() {
     if (!_proxies) _proxies = {};
    return _proxies;
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

  static onCreatedCallback(object, componentName) {
    if (persistence.isCurrentlyCloning()) {
      return;
    }

    var shadow = object.createShadowRoot();

    // clone the template again, so when more elements are created,
    // they get their own copy of elements
    var clone = document.importNode(ComponentLoader.templates[componentName], true);
    // #TODO replace the "template" reference with an indirection that can be changed from the outside,
    // e.g. var clone = document.importNode(this.templates[componentName], true);
    // but beeing able to modify it, because we have a reference should suffice at the moment...

    shadow.appendChild(clone);

    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(object);
    
    // attach lively4script from the instance
    scriptManager.findLively4Script(object, false);

    if (ComponentLoader.prototypes[componentName].createdCallback) {
      ComponentLoader.prototypes[componentName].createdCallback.call(object);
    }

    // load any unknown elements, which this component might introduce
    ComponentLoader.loadUnresolved(object, true, "onCreated " + componentName).then((args) => {
      // lively.fillTemplateStyles(object.shadowRoot, "source: " + componentName).then(() => {
        // call the initialize script, if it exists
      
        if (typeof object.initialize === "function") {
          object.initialize();
        }
        // console.log("dispatch created " +componentName )
        // console.log("Identitity: " + (window.LastRegistered === object))
        
        object.dispatchEvent(new Event("created"));
      // })
    }).catch( e => {
      console.error(e); 
      return e
    });
  }
  
  static onAttachedCallback(object, componentName) {
    if (object.attachedCallback && 
      ComponentLoader.proxies[componentName].attachedCallback != object.attachedCallback) {
        object.attachedCallback.call(object);
    }
    if (ComponentLoader.prototypes[componentName].attachedCallback) {
      ComponentLoader.prototypes[componentName].attachedCallback.call(object);
    }
  }
  
  static onDetachedCallback(object, componentName) {
    if (object.detachedCallback && ComponentLoader.proxies[componentName].detachedCallback != object.detachedCallback) {
      object.detachedCallback.call(object);
    } else if (ComponentLoader.prototypes[componentName].detachedCallback) {
      ComponentLoader.prototypes[componentName].detachedCallback.call(object);
    }
  }
  
  // this function registers a custom element,
  // it is called from the bootstap code in the component templates
  static register(componentName, template, prototype) {
    var proto = prototype || Object.create(Morph.prototype);

    // For reflection and debugging
    this.templates[componentName] = template;
    this.prototypes[componentName] = proto;
    this.proxies[componentName] = Object.create(proto) // not changeable
  
    lively.fillTemplateStyles(template, "source: " + componentName).then( () => {

  
      // FOR DEBUGGING
      // if (!window.createdCompontents)
      //   window.createdCompontents = {}
      // window.createdCompontents[componentName] = []
  
      // #Mystery #Debugging #ExperienceReport
      // Task was to figure out why the created callback is called several times when loading the
      // componen for the first time? E.g 5 ace editors for the container, where 2 are actually needed
      // maybe they are also called for the template documents that we store?
      // e.g. lively-editor (+ 1 ace + lively-version (+1 ace)) + lively-version (1 ace)
      // that would actually account for the missing three instances
      // It is Saturday night... past midnight and I finnally have at least an hypothesis, 
      // where I was debugging in the dark the last 3 hours.
      // I got burned so hard by the "created" event that was thrown at me even if not myself 
      // was created but if a child of mine was created too... and we did not expected such behavior
      // that this time I wanted to find out what was going on here. Even though it seemed to 
      // be not a problem
      
      this.proxies[componentName].createdCallback = function() {
        // window.createdCompontents[componentName].push(this)  
        // console.log("[components] call createdCallback for " + componentName, this)
        ComponentLoader.onCreatedCallback(this, componentName, this)
      }
      this.proxies[componentName].attachedCallback = function() {
        ComponentLoader.onAttachedCallback(this, componentName)
      };
      this.proxies[componentName].detachedCallback = function() {
         ComponentLoader.onDetachedCallback(this, componentName)
      };
  
      // don't store it just in a lexical scope, but make it available for runtime development
  
      document.registerElement(componentName, {
        prototype: this.proxies[componentName]
      });
    })
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
  static loadUnresolved(lookupRoot, deep, debuggingHint) {
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
      
      loadingPromises[name].name = name + " " + Date.now()
      
      this.loadByName(name);

      return createdPromise;
    });

    // return a promise that resolves once all unresolved elements from the unresolved-array
    // are completely created
    return new Promise( (resolve, reject) => {
      
      // fuck promises!!!! I hate them. There is one promise pending.... but just does not fail. It just hangs around doing nothing! #Jens
      promises.forEach( p => {
        p.then( r => {
          p.finished = true;
        }, er => console.log("ERROR in promise: " + p.name))
        
      })
      window.setTimeout( function() {
        var unfinished = false;
        var unfinishedPromise;
        promises.forEach( p => {
          if (!p.finished) {
            unfinishedPromise = p
            unfinished = true;
          }
        })
        if (unfinished) {
          resolve("timeout") // "(if) the fuel gauge breaks, call maintenance. If they’re not there in 20 minutes, fuck it."
          lively.notify("Timout due to unresolved promises, while loading " + unfinishedPromise.name + " context: " + debuggingHint )
        }
      }, 15 * 1000)

      Promise.all(promises).then( result => resolve(), reject => {
          console.log("ERROR loading " +reject)
          reject()
      })
    })
  }

  // this function loads a component by adding a link tag to the head
  static loadByName(name) {
      function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
      }
    
      // #TODO make templates path configurable... and make its search in many places
      var url = '/templates/' + name + '.html'
      // #TODO continue here url.exists() 
      var link = document.createElement("link");
      link.rel = "import";
      link.href = kernel.resolve(url)
      link.dataset.lively4Donotpersist = "all";
      
      document.head.appendChild(link);
  }

  static createComponent(tagString) {
    var comp = document.createElement(tagString);
    return comp;
  }

  static openIn(parent, component, beginning) {
    var created = false;
    var compPromise = new Promise((resolve, reject) => {
      component.addEventListener("created", (e) => {
        if (e.path[0] !== component) {
          // console.log("[components] ingnore and stop created event from child " + e.path[0].tagName);
          return 
        }
        if (created) {
          // #Just check... we had this issue before
          throw new Error("[compontents] created called twice for " + component)
        } else {
          created = true
          e.stopPropagation();
          resolve(e.target);
        }
        
      });
    });

    if (beginning) {
      parent.insertBefore(component, parent.firstChild);
    } else {
      parent.appendChild(component);
    }
    this.loadUnresolved(document.body, true, "openIn " + component);

    return compPromise;
  }

  static openInBody(component) {
    return this.openIn(document.body, component, true);
  }

  static openInWindow(component, pos, title) {
    // this will call the window's createdCallback before
    // we append the child, if the window template is already
    // loaded
    var w = this.createComponent("lively-window");
    if (pos) {
      lively.setPosition(w, pos);
    }
    w.style.opacity = 0.2
    w.appendChild(component);


    this.openInBody(w);

    // therefore, we need to call loadUnresolved again after
    // adding the child, so that it finds it and resolves it,
    // if it is currently unresolved
    var windowPromise = new Promise((resolve, reject) => {
      this.loadUnresolved(document.body, true, "openInWindow " + component).then(() => {
        w.style.opacity = 1 
        if (component.windowTitle) 
          w.setAttribute('title', '' + component.windowTitle);

        resolve(w);
      });
    });

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
    
    return lively.fillTemplateStyles(templateClone, "source: " + componentName).then( () => name);
  }
}
