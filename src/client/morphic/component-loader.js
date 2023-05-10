import scriptManager from  "src/client/script-manager.js";
import files from "../files.js"

// store promises of loaded and currently loading templates
if (!self.lively4loadingPromises) {
  // WARNING: only used by loadUnresolved and not loadByName
  self.lively4loadingPromises = {} // just to be on the save side....
}
export var loadingPromises = self.lively4loadingPromises;

var _loggingEnabled = false
var _log = function(...args) {
  if (_loggingEnabled) {
    console.log("ComponentLoader ",...args)
  }
}

var _timeEnabled = false
var _timeLog = function(name, msg, ...args) {
  if (_timeEnabled) {
    console.log("[component] " + name + " " + Math.round(performance.now() - ComponentLoader.templateFirstLoadTimes[name]) +"ms "+ msg, ...args)
  }
}

// for compatibility
export function register(componentName, template, prototype) {
  return ComponentLoader.register(componentName, template, prototype);
}

/* #FutureWork should interactive state change of "(module) global" state be preserved while reloading / developing modules
    ComponentLoader.foo = 3
    ComponentLoader.foo

#Discussion

pro) expected in Smalltalk-like developent and live-programmning experience
contra) gap between development-time and runtime (those manualy changes could make something work that without it won't...)

synthese) if modules and classes are also objects that can have run-time-specific state they should be migrated the same as objects. 

*/



export default class ComponentLoader {

  static load() {
    this._def("templates", {});
    this._def("prototypes", {});
    this._def("proxies", {});
    this._def("templatePathsCache", {});
    this._def("templatePathsCacheTime", {});
    this._def("templateFirstLoadTimes", {}); 
  }
  
  static globalObject() {
    window.lively4components = window.lively4components || {}
    return window.lively4components
  }
  
  static _def(name, init) {
      Object.defineProperty(this, name, {
        get() {
          // Since, we want to keep state accross module reloading.... #PreserveState
          var obj = this.globalObject()
          if (!obj[name]) obj[name] = init;
          return obj[name];
        },
        set(value) {
          var obj = this.globalObject()
          if (!obj[name]) obj[name] = value;
        },
        enumerable: true,
        configurable: true
      });
  }

  static updatePrototype(aClass, moduleName) {    
    var componentName = moduleName.replace(/.*\//,"").replace(/\.js$/,"")
    if (componentName && this.prototypes[componentName]) {
      this.prototypes[componentName] = aClass
      this.proxies[componentName].__proto__ = aClass
      this.proxies[componentName].prototype.__proto__ = aClass.prototype
    }
  }

  static async onCreatedCallback(object, componentName) {
    _log('onCreatedCallback ' + componentName)
      
    // attach lively4scripts from the shadow root to this
    if (this.shadowRoot)
      scriptManager.attachScriptsFromShadowDOM(object);
    
    // attach lively4script from the instance
    scriptManager.findLively4Script(object, false);

    if (typeof object.createdCallback === "function") {
      // ComponentLoader.prototypes[componentName].createdCallback.call(object);
      object.createdCallback();
    }

    // load any unknown elements, which this component might introduce
    _log('START onCreatedCallback loadUnresolved ' + componentName)
            
    this._livelyLoading = Promise.resolve()
    this._livelyLoadingDep =  ComponentLoader.loadUnresolved(
        object, true, "onCreated " + componentName, false).then((args) => {
      _log('FINISHED onCreatedCallback loadUnresolved ' + componentName)

      // lively.fillTemplateStyles(object.shadowRoot, "source: " + componentName).then(() => {
        // call the initialize script, if it exists
      
        if (typeof object.initialize === "function") {
          object.initialize();
        }
        _log("dispatch created " +componentName )
        _log("Identitity: " + (window.LastRegistered === object))
        
      // })
      if (this.templateFirstLoadTimes[componentName]) {
        _log('Component first load time: ' + ((performance.now() - this.templateFirstLoadTimes[componentName]) / 1000).toFixed(3) + "s " + componentName + " ")
        this.templateFirstLoadTimes[componentName] = null;
      }
      _log("[component loader] fire created " + componentName)
      object._lively4created = Date.now()
      object.dispatchEvent(new Event("created")); // when we wait on other unresolved components, we can run into cyclic dependencies.... #Cyclic
    }).catch( e => {
      console.error(e); 
      return e
    });
    this._livelyLoadingDep
  }
  
  static async onAttachedCallback(object, componentName) {
    
    if (this._livelyLoading) {
      await this._livelyLoading // should we provicde this robustness here? Or should these be more pure metal...
    }
    
    _log("onAttachedCallback " + componentName)
    
    if (object.attachedCallback && 
      ComponentLoader.proxies[componentName].attachedCallback != object.attachedCallback) {
        object.attachedCallback.call(object);
    } else if (ComponentLoader.prototypes[componentName].attachedCallback) {
      ComponentLoader.prototypes[componentName].attachedCallback.call(object);
    }
  }
  
  static async onDetachedCallback(object, componentName) {
    
    if (this._livelyLoading) {
      await this._livelyLoading
    }
    
    if (object.detachedCallback 
    && ComponentLoader.proxies[componentName].detachedCallback != object.detachedCallback) {
      object.detachedCallback.call(object);
    } else if (ComponentLoader.prototypes[componentName].detachedCallback) {
      ComponentLoader.prototypes[componentName].detachedCallback.call(object);
    }
  }
  
  static applyTemplate(element, componentName) {
    var template = this.templates[componentName]
    return this.applyTemplateElement(element, template) 
  }

  static applyTemplateElement(element,template) {
    if (template) {
      if (!element.shadowRoot) {
        element.attachShadow({mode: 'open'});
      }      
      var fragment = template.cloneNode(true)
      fragment.childNodes.forEach(ea => {
        var clone = document.importNode(ea, true)
        // #OriginTracking: attach meta infos here
        element.shadowRoot.appendChild(clone)
      })
    }
  }

  // this function registers a custom element,
  // it is called from the bootstap code in the component templates
  static async register(componentName, template, aClass, componentUrl) { 
    _log("[component loader] register " + componentName)
    var proxy
    
    // For reflection and debugging
    this.templates[componentName] = template;
    this.prototypes[componentName] = aClass;
    
    if (template) {
      _log("[component loader] register fillTemplateStyles: " + componentName)
      await lively.fillTemplateStyles(template, "source: " + componentName, componentUrl)
    }
    
    if (!this.proxies[componentName]) {
      proxy = class extends HTMLElement {
        static get name() {
          return componentName
        } 
        
        get _lively4version() {
          return 2
        }
        
        constructor() {
          _log("[component loader] Proxy Constructor " + componentName)
    
          super(); // always call super() first in the constructor.
          
          ComponentLoader.applyTemplate(this, componentName)
          ComponentLoader.onCreatedCallback(this, componentName)
        }

        connectedCallback( args) {
          _log('connectedCallback ' + componentName )
          
          
          // return super.connectedCallback(...args)
          // super seams to bind early?
          ComponentLoader.onAttachedCallback(this, componentName)
          if (this.constructor.__proto__.prototype.connectedCallback) {
            return this.constructor.__proto__.prototype.connectedCallback.apply(this, args)
          }
        }
        disconnectedCallback(...args) {
          _log('diconnectedCallback ' + componentName )
          
          // return super.disconnectedCallback(...args)
          ComponentLoader.onDetachedCallback(this, componentName)
          if (this.constructor.__proto__.prototype.disconnectedCallback) {
            return this.constructor.__proto__.prototype.disconnectedCallback.apply(this, args)
          }
        }

        adoptedCallback(...args)	{
          _log('adoptedCallback ' + componentName )
          // return super.adoptedCallback(...args)
          if (this.constructor.__proto__.prototype.adoptedCallback) {
            return this.constructor.__proto__.prototype.adoptedCallback.apply(this, args)  
          }
        }
      }
      // set the prototype of the proxy the first time
      // #Idea: use "extemds aClass" ?
      //       proxy.__proto__ = aClass
      //       proxy.prototype.__proto__ = aClass.prototype
      
      _log("[component loader] define component: " + componentName)
      window.customElements.define(componentName, proxy); // #WebComponent #Magic
      this.proxies[componentName] =  proxy
    } else {
      proxy = this.proxies[componentName] 
      
    }
    
    // change the prototype of the proxy
    proxy.__proto__ = aClass
    proxy.prototype.__proto__ = aClass.prototype
  }

  // this function loads all unregistered elements, starts looking in lookupRoot,
  // if lookupRoot is not set, it looks in the whole document.body,
  // if deep is set, it also looks into shadow roots
  static loadUnresolved(lookupRoot, deep, debuggingHint, withChildren=false, withyourself=false) {
    lookupRoot = lookupRoot || document.body;

    var selector = ":not(:defined)";
    var unresolved = []
    
    // check if lookupRoot is unresolved
    
    // loot at me
    if (withyourself && lookupRoot.parentElement) {
      var unresolvedSiblingsAndMe = Array.from(lookupRoot.parentElement.querySelectorAll(selector));
      if (unresolvedSiblingsAndMe.includes(lookupRoot)) {
        unresolved.push(lookupRoot)
      }
    }
    // find all unresolved elements looking downwards from lookupRoot
    
    // look at my children? 
    if (withChildren) {
      unresolved = unresolved.concat(Array.from(lookupRoot.querySelectorAll(selector)));
    }
    
    // look into the shadow?
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
    
    
    var __debugOpenPromisedComponents = new Set()
    
    var promises = unresolved.filter((el) => {
      // filter for unique tag names
      if (!el.nodeName || el.nodeName.toLowerCase() == "undefined") return false;
      var name = el.nodeName.toLowerCase();
      return !unique.has(name) && unique.add(name);
    })
    .map((el) => {
      var name = el.nodeName.toLowerCase();
      return this.ensureLoadByName(name, __debugOpenPromisedComponents, el)
    })
    .filter(promise => promise != null);
    
    _log("findUnresolvedDeep components: ", promises)

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
          resolve("timeout") // "(if) the fuel gauge breaks, call maintenance. If they are not there in 20 minutes, fuck it."
          console.warn("Timout due to unresolved promises, while loading " + unfinishedPromise.name + " context: " + debuggingHint, " unresolved: " + Array.from(__debugOpenPromisedComponents).join(", ") )
        }
      }, 20 * 1000)

      Promise.all(promises).then( result => resolve(), err => {
          _log("ERROR loading component ", err)
      })
    })
  }
  
  static ensureLoadByName(name, __debugOpenPromisedComponents=new Set(), el) {
     if (loadingPromises[name]) {
        // console.log("EARLY ensureLoadByName... " + name)
        // the loading was already triggered
        return loadingPromises[name];
      }

      __debugOpenPromisedComponents.add(name)
      // create a promise that resolves once el is completely created
      var createdPromise = new Promise((resolve, reject) => {
        if (el) {
          if (el._lively4created) {
            return resolve({target: el})
          }
          el.addEventListener("created", (evt) => {
            evt.stopPropagation();
            __debugOpenPromisedComponents.delete(name)
            resolve(evt);
          });          
        }
      });

      // trigger loading the template of the unresolved element
      loadingPromises[name] = createdPromise;
      
      loadingPromises[name].name = "[Loaded " +name + " " + Date.now() + "]"
      
      this.loadByName(name).then((didInsertTag) => {
        if(!didInsertTag) {
          console.error("Component Loader", `Template ${name} could not be loaded.`, 3, null, "yellow");
          delete loadingPromises[name];
          return null;
        }
      })
      // console.log("FINISHED ensureLoadByName... " + name)
      return createdPromise;
  }
  
  
  static resetTemplatePathCache() {
    this.templatePaths = undefined
    this.templatePathsCache = undefined
    this.templatePathsCacheTime = undefined
  }

  static async getTemplatePathContent(path) {
    
   
    
    let cacheInvalidationTime = 60 * 5 * 1000;
    let cached = this.templatePathsCache[path]
    let time = this.templatePathsCacheTime[path]
    if (cached && ((Date.now() - time) < cacheInvalidationTime)) return cached
    
    let resultPromise =  fetch(path, { method: 'OPTIONS' }).then(resp => {
      if (resp.status !== 200) return undefined
      return resp.json()
    });
    this.templatePathsCacheTime[path] = Date.now()
    this.templatePathsCache[path] = new Promise(async (resolve, reject) => {
      let result = await resultPromise;
      if (result) {
          resolve({contents: result.contents});
        return cached 
      }
    })
    return resultPromise 
  }
  
  static getTemplatePaths() {
    if (!this.templatePaths) {
      const defaultPaths = [ // default
        lively4url + '/templates/',
        lively4url + '/src/components/',
        lively4url + '/src/components/widgets/',
        lively4url + '/src/components/tools/',
        lively4url + '/src/components/halo/',
        lively4url + '/src/components/demo/',
        lively4url + '/src/components/draft/',
        lively4url + '/src/components/d3/',
        lively4url + '/src/client/vivide/components/',
        lively4url + '/src/client/reactive/components/rewritten/',
        lively4url + '/src/client/reactive/components/basic/',
        lively4url + '/src/client/reactive/components/basic/aexpr-graph/',
        lively4url + '/src/client/pen-editor/components/',
        lively4url + '/src/babylonian-programming-editor/',
        lively4url + '/src/babylonian-programming-editor/demos/canvas/',
        lively4url + '/src/babylonian-programming-editor/demos/todo/',
        lively4url + '/src/client/reactive/components/rewritten/conduit/src/components/',
        lively4url + '/src/client/reactive/components/rewritten/conduit/rpComponents/',
      ];

      const customPaths = this.persistentCustomTemplatePaths
        .map(path => path.startsWith('/') ? lively4url + path : path);

      this.templatePaths = defaultPaths.concat(customPaths); 
    } 
    return this.templatePaths;
  }

  /*MD ### PersistentCustomPaths MD*/
  static get persistentCustomTemplatePaths() {
    return JSON.parse(localStorage.lively4customTemplatePaths || '[]')
  }

  static set persistentCustomTemplatePaths(paths) {
    // localStorage.lively4customTemplatePaths = []
    localStorage.lively4customTemplatePaths = JSON.stringify(paths);
    this.resetTemplatePathCache();
  }

  static addPersistentCustomTemplatePath(path) {
    const customPaths = this.persistentCustomTemplatePaths;

    if (!customPaths.includes(path)) {
      customPaths.push(path);
      this.persistentCustomTemplatePaths = customPaths;
    }
  }

  static removePersistentCustomTemplatePath(path) {
    const customPaths = this.persistentCustomTemplatePaths;

    const index = customPaths.indexOf(path);
    if (index > -1) {
      customPaths.splice(index, 1);
      this.persistentCustomTemplatePaths = customPaths;
    }
  }

  static async searchTemplateFilename(filename) {
    
    var templatePaths =  this.getTemplatePaths()
    let templateDir = undefined;          
  
    // #IDEA, using HTTP HEAD could be faster, but is not always implemented... as ource OPTIONS is neigher
    // this method avoids the 404 in the console.log
    
    // the OPTIONS request seems to break karma... waits to long..
    if (!window.__karma__) { 
      for(templateDir of templatePaths) {
        try {
          var stats = await this.getTemplatePathContent(templateDir);
          var found = stats.contents.find(ea => ea.name == filename)
        } catch(e) {
          _log("searchTemplateFilename: could not get stats of  " + filename + " ERROR: ", e)
          found = null
        }
        if (found) {
          return templateDir + filename
        }
      }

    } else {
      // so the server did not understand OPTIONS, so lets ask for the files directly
      if (!found) {
        for(templateDir of templatePaths) {
          found = await fetch(templateDir + filename, { method: 'GET' }) // #TODO use HEAD, after implementing it in lively4-server
            .then(resp => resp.status == 200); 
          if (found) {
            return templateDir + filename
          }  
        } 
      }      
    }
    return undefined
  }
  
  // #TODO use loadingPromises here... #Issue, as we used it in livley.js directly, we loaded lively-window in parralel... 
  static async loadByName(name) {
    _log("[component loader] loadByName " + name)
    
    this.templateFirstLoadTimes[name] = performance.now()
    var modUrl = await this.searchTemplateFilename(name + '.js')
    if (!modUrl) {
      throw new Error("Could not find template for " + name)
    }
    _timeLog(name, " found module filename")
    
    // #OriginTracking: get source code information here
    var templateURL = await this.searchTemplateFilename(name + '.html')
    _timeLog(name, " found template filename")
    
    // Check  if the template will be loadable (this would e.g. fail if we were offline without cache)
    // We have to check this before inserting the link tag because otherwise we will have
    // the link tag even though the template was not properly loaded
    try {
      if(files.exists(modUrl)) {
        _timeLog(name, "module exists")
        var mod = await System.import(modUrl)
        _timeLog(name, "module loaded")
        var aClass = mod.default
        
        if (templateURL) {
          if(files.exists(templateURL)) {
            _timeLog(name, "template exits")
            var templateSource = await fetch(templateURL).then(r => r.text());
            _timeLog(name, "template loaded")
            var div = document.createElement("div")
            div.innerHTML = templateSource
            var template = div.querySelector("template")
            template.remove()
          }          
        }
        this.register(name, template && template.content, aClass, templateURL)
        _timeLog(name, "registered")
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  // #TODO refactor this to use lively.create(), because this is not enough... 
  static createComponent(tagString) {
    var comp = document.createElement(tagString);
    return comp;
  }
  
  static openIn(parent, component, beginning) {
    var created = false;
    var compPromise = new Promise((resolve) => {
      if (component._lively4created ) return resolve(component)
      
      component.addEventListener("created", (e) => {
        if (e.composedPath()[0] !== component) {
          _log("[components] ingnore and stop created event from child " + e.composedPath[0].tagName);
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
    this.loadUnresolved(component, true, "openIn " + component, true, true);
    return compPromise;
  }

  static openInBody(component) {
    return this.openIn(document.body, component, true);
  }

  static async openInWindow(component, pos) {
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

    if (!component.localName.match(/-/)) {
      return w // standard elments... which are no components
    }
    
    // therefore, we need to call loadUnresolved again after
    // adding the child, so that it finds it and resolves it,
    // if it is currently unresolved
    var windowPromise = new Promise((resolve) => {
      this.loadUnresolved(document.body, true, "openInWindow " + component).then(() => {
        w.style.opacity = 1.0
        this.ensureWindowTitle(component, w)

        resolve(w);
      });
    });

    return windowPromise;
  }
  
  static ensureWindowTitle(component, w) {
    if (component.windowTitle) {
      w.setAttribute('title', '' + component.windowTitle);
    }
  }  

  static reloadComponent(source, url) {
    var template = lively.html.parseHTML(source).find(ea => ea.localName == "template");
    if (!template) return;
    var name = template.id;
    if (!name) return;
    var templateClone = document.importNode(template.content, true);
    ComponentLoader.templates[name] = templateClone;
    
    return lively.fillTemplateStyles(templateClone, "source: " + name, url).then( () => name);
  }
  
}

ComponentLoader.load()
ComponentLoader.resetTemplatePathCache()
