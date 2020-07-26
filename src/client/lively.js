/*MD 
![](../../media/lively4_logo_smooth_200.png)

# Lively4 core module

[architecture](browse://doc/architecture/lively.md)

 #Lively4 #Singleton #KitchenSink #CyclicDependecies #RefactoringNeeded


MD*/

import './patches.js'; // monkey patch the meta sytem....
// import * as jquery from '../external/jquery.js'; // should not be needed any more!
import _ from 'src/external/lodash/lodash.js'
import * as scripts from './script-manager.js';
import * as messaging from './messaging.js';
import preferences from './preferences.js';
import persistence from './persistence.js';
import html from './html.js';
import * as reflection from './reflection.js';
import files from './files.js';
import paths from './paths.js';
import contextmenu from './contextmenu.js';
import keys from './keys.js';
import components from './morphic/component-loader.js';
import authGithub from './auth-github.js';
import authDropbox from './auth-dropbox.js';
import authGoogledrive  from './auth-googledrive.js';
import expose from './expose.js';
import { toArray, uuid as generateUUID, wait } from 'utils';
import {pt, rect} from './graphics.js';
import Dialog from 'src/components/widgets/lively-dialog.js'
import ViewNav from 'src/client/viewnav.js'
import SystemjsWorker from "src/worker/systemjs-worker.js"
import Stack from 'src/client/utils/stack.js'


/* expose external modules */
// import color from '../external/tinycolor.js';
import focalStorage from '../external/focalStorage.js';
import Selection from 'src/components/halo/lively-selection.js'
import windows from "src/components/widgets/lively-window.js"

import events from "src/client/morphic/events.js"

let $ = window.$; // known global variables.


var debugLogHightlights = new WeakMap()

// a) Special shorthands for interactive development
// b) this is the only reasonable way to use modules in template scripts, due to no shared lexical scope #TODO
// c) This indirection is also needed to let old events listeners signal to code in current modules
var exportmodules = [
  "preferences",
  "files",
  "keys",
  "paths",
  "html",
  "reflection",
  "components",
  "persistence",
  // "color",
  "focalStorage",
  "authGithub",
  "authDropbox",
  "authGoogledrive",
  "contextmenu",
  "windows"
];

class LivelyNotification {
  constructor(data) {
    this.data = data;
  }

  displayOnConsole() {
    console.log('%cLively Notification', "color: gray; font-size: x-small", this.data);
  }
}

/*
 * The "lively" module is currently the kitchen-sink of this environment.
 *
 * #TODO refactor so that methods go into more specific modules.
 */
export default class Lively {

  static get location() {
    return window.location;
  }

  static set location(url) {
    return window.location = url;
  }

  static findDirectDependentModules(path) {
     var mod = System.normalizeSync(path);
     return Object.values(System.loads)
      .filter( ea => {
       if (ea.key.match("unnamed_module"))  {
         
         return false
       }
        
        return ea.dependencies.find(dep => System.normalizeSync(dep, ea.key) == mod)
      })        
      .map( ea => ea.key)
  }

  static findDependedModules(path, recursive, all = []) {
    let dependentModules = this.findDirectDependentModules(path);
    if(recursive) {
      dependentModules.forEach(module => {
        if(!all.includes(module)) {
          all.push(module);
          this.findDependedModules(module, true, all);
        }
      });
      return all;
    } else {
      return dependentModules;
    }
  }

  static findDependedModulesGraph(path, all = []) {

    let tree = {

    }
    tree.name = path;
    let dependentModules = this.findDirectDependentModules(path);
    tree.children = [];

    dependentModules.forEach(module => {
      if(!all.includes(module)) {
        all.push(module);
        tree.children.push(this.findDependedModulesGraph(module, all));
      } else {
        tree.children.push({
          name: module
        });
      }
    });
    return tree;
  }

  // #TODO remove code duplication lively-con
  static async unloadModule(path) {
    var normalizedPath = System.normalizeSync(path)
    try {
      // check, to prevent trying to reloading a module a second time if there was an error #375
      if (System.get(normalizedPath)) {
        await System.import(normalizedPath).then(module => {
          if(module && typeof module.__unload__ === "function") {
            module.__unload__();
          }
        });        
      }      
    } catch(e) {
      console.log("WARNING: error while trying to unload " + path)
    }
    System.registry.delete(normalizedPath);
    // #Hack #issue in SystemJS babel syntax errors do not clear errors
    System['@@registerRegistry'][normalizedPath] = undefined;
    delete System.loads[normalizedPath]
  }

  static async reloadModule(path, force) {
    // var start = performance.now()
    // console.profile('reloadModule')

    path = "" + path;
    var changedModule = System.normalizeSync(path);
    var load = System.loads[changedModule];
    if (!load && !force) {
      await this.unloadModule(path); // just to be sure...
      console.warn("Don't reload non-loaded module");
      return;
    }
    await this.unloadModule(path);
    let mod = await System.import(path);

    /**
     * Reload dependent modules
     */
    // #TODO how can we make the dependecy loading optional... I don't need the whole environment to relaod while developing a core module everybody depends on
    // if (path.match("graphics.js")) {
    //   console.log("[reloadModule] don't load dependencies of " + path)
    //   return mod
    // }

    let dependedModules;
    if(path.match('client/reactive')) {
      // For reactive, find modules recursive, but cut modules not in 'client/reactive' folder
      dependedModules = lively.findDependedModules(path, true);
      dependedModules = dependedModules.filter(mod => mod.match('client/reactive'));
      // #TODO: duplicated code #refactor
    } else if(path.match('client/vivide')) {
      // For vivide, find modules recursive, but cut modules not in 'client/vivide' folder
      dependedModules = lively.findDependedModules(path, true);
      dependedModules = dependedModules.filter(mod => mod.match('client/vivide'));
    } else {
      // Find all modules that depend on me 
      // dependedModules = lively.findDependedModules(path); 
      
      // vs. find recursively all! 
      dependedModules = lively.findDependedModules(path, true); 

    }

    // console.log("[reloadModule] reload yourself ",(performance.now() - start) + `ms` ) 
    // start = performance.now()

    
    // and update them
    await Promise.all(dependedModules.map(dependentModule => this.unloadModule(dependentModule)));

    // console.log("[reloadModule] unload dependend modules ",(performance.now() - start) + `ms` ) 
    // start = performance.now()

    await Promise.all(dependedModules.map(dependentModule => System.import(dependentModule)));
    // for(let ea of dependedModules) {
    //   // console.log("reload " + path + " triggers reload of " + ea)
    //   //System.registry.delete(ea);
    // }
    // // now the system may build up a cache again
    // for(let ea of dependedModules) {
    //   // console.log("import " + ea)
    //   // #TODO, #BUG: does not seem to work as intended
    //   // however, import statement triggers the execution
    // }
    // now check for dependent web components
    for(let ea of dependedModules) {
      // System.import(ea);
    }

    // console.log("[reloadModule] updated depended modules ",(performance.now() - start) + `ms` ) 
    // start = performance.now()
    
    /**
     * Update Templates: Reload a template's .html file
     */
    for (let eaPath of [path].concat(dependedModules)) {
      // console.log("update dependend: ", eaPath)
      let found = lively.components.getTemplatePaths().find(templatePath => eaPath.match(templatePath))
      if (found) {
        /**
         * Update a templates prototype
         */
        let moduleName = eaPath.replace(/[^/]*/,"");
        let mod = await System.import(eaPath);
        let defaultClass = mod.default;
        if (defaultClass) {
          console.log("update template prototype: " + moduleName);
          components.updatePrototype(defaultClass, moduleName);
        }

        let templateURL = eaPath.replace(/\.js$/,".html");
        try {
          console.log("[templates] update template " + templateURL);
          setTimeout(() => {
            lively.files.loadFile(templateURL).then( sourceCode =>
              lively.updateTemplate(sourceCode));
          },100)

        } catch(e) {
          lively.notify("[templates] could not update template " + templateURL, ""+e);
        }
      }
    }

    // console.log("[reloadModule] updated components ",(performance.now() - start) + `ms` ) 
    // console.profileEnd('reloadModule')

    return mod;
  }

  static loadJavaScriptThroughDOM(name, src, force=false, type="text/javascript") {
    return new Promise((resolve) => {
      var scriptNode = document.querySelector("#"+name);
      if (!force && scriptNode) {
        resolve() // nothing to be done here
        return
      }

      if (scriptNode) {
        scriptNode.remove();
      }
      var script = document.createElement("script");
      script.id=name;
      script.charset="utf-8";
      script.type=type;
      if (force) {
        src = src + ("?" + Date.now());
      }
      script.src= src;
      script.onload = function() {
        resolve();
      };
      document.head.appendChild(script);
    });
  }


  static loadCSSThroughDOM(name, href, force) {
    return new Promise((resolve) => {
      var linkNode = document.querySelector("#"+name);
      if (linkNode) {
        linkNode.remove();
      }
      var link = document.createElement("link");
      link.rel="stylesheet";
      link.id=name;
      link.charset="utf-8";
      link.type="text/css";
      if (force) {
        href += + "?" + Date.now();
      }
      link.href= href;
      link.onload = function() {
        resolve();
      };
      document.head.appendChild(link);
    });
  }
  static async fillTemplateStyle(element, url) {
    var url =  lively.paths.normalizeURL(url)
    return fetch("cached:" + url).then(r => r.text()).then(css => {
      // console.log("[lively] fill css " + cssURL + "," + Math.round(css.length / 1000) + "kb" )
      element.setAttribute("data-url", url) // so we find it again for updating... data-src is relative
      element.innerHTML = css;
    })
  }
  
  static async fillTemplateStyles(root, debugInfo, baseURL=lively4url) {
    // there seems to be no <link ..> tag allowed to reference css inside of templates #Jens
    
    // var start = performance.now()
    var promises = [];
    var allSrc = []
    root.querySelectorAll("style").forEach(ea => {
      var src = ea.getAttribute("data-src");
      if (src) {
        
        var cssURL = src
        if (!cssURL.match(/^[a-zA-Z0-9]+:/)) {
          cssURL = baseURL.replace(/\/?$/, "/") + cssURL
        }
        allSrc.push(src)
        promises.push(this.fillTemplateStyle(ea, cssURL));
      }
    });
    await Promise.all(promises)    
    // console.log("load fillTemplateStyles "  + (performance.now() - start) +"ms :"+ debugInfo);
  }

  static showError(error) {
    this.handleError(error);
  }

   static async handleError(error) {
    lively.LastError = error;
    try {
      if (!error) return; // hmm... this is currious...
      if (error.message.match("Maximum call stack size exceeded")) {
        console.log(error)
        return
      }
      if (document.querySelector("lively-console")) {
        console.log(error)
      } else {
        console.error('[error] ', error, error.stack);
        if (!window.__karma__) {
          await lively.notify("Error: ", error, 10, () => {
              lively.openComponentInWindow("lively-error").then( comp => {
                comp.stack =  error.stack
                comp.parentElement.setAttribute("title",  "" + error.message)
                comp.style.height = "max-content"
                var bounds = comp.getBoundingClientRect()
                comp.parentElement.style.height = (bounds.height + 20)+ "px"
                comp.parentElement.style.width = bounds.width + "px"
              })
            }, "red");
        }
      }
    } catch(e) {
      console.log("An error happend while handling and error: " + e)
    }
  }

  static async loaded() {
    // #Refactor with #ContextJS
    // guard againsst wrapping twice and ending in endless recursion
    // if (!console.log.originalFunction) {
    //     var nativeLog = console.log;
    //     console.log = function() {
    //         nativeLog.apply(console, arguments);
    //         console.log.apply(undefined, arguments);
    //     };
    //     console.log.originalFunction = nativeLog; // #TODO use generic Wrapper mechanism here
    // }
    // if (!console.error.originalFunction) {
    //     var nativeError = console.error;
    //     console.error = function() {
    //         nativeError.apply(console, arguments);
    //         console.log.apply(undefined, arguments);
    //     };
    //     console.error.originalFunction = nativeError; // #TODO use generic Wrapper mechanism here
    // }

    // General Error Handling
    if (window.onerror === null) {
      window.onerror  = function(message, source, lineno, colno, error) {
    	  lively.handleError(error);
      };
    }
    // do it just once
    if (!window.unhandledRejectionEventLister) {
      window.unhandledRejectionEventLister = function(evt) {lively.handleError(evt.reason)} ;
      window.addEventListener('unhandledrejection', unhandledRejectionEventLister);
    }

    await this.exportModules();
    

    if (!window.lively4chrome) {
      // for container content... But this will lead to conflicts with lively4chrome  ?? #Jens
      lively.loadCSSThroughDOM("livelystyle", lively4url + "/templates/lively4.css");
    }
    // preload some components
    // #FixMe does not work this way, because this might conflict with the normal loading ....
    // await components.loadByName("lively-window");
    // await components.loadByName("lively-editor");
    // await components.loadByName("lively-script");
    
    setTimeout(() => {
      // wait for the timeout and try again
      document.body.querySelectorAll("img").forEach(ea => ea.src = "" + ea.src) // #Hack #swx RPC messages...
    }, 12 * 1000)


  }


  static async exportModules() {
    exportmodules.forEach(name => lively[name] = eval(name)); // oh... this seems uglier than expectednit

    await System.import("src/client/clipboard.js").then( m => {
      lively.clipboard = m.default
    }) // depends on me
    await System.import("src/client/graffle.js") // depends on me
    await System.import("src/client/draganddrop.js") // depends on me
    
    
    await System.import("src/client/poid.js") // depends on me
    // #TODO should we load fetch protocols lazy?
    await System.import("demos/plex/plex-scheme.js") // depends on me
    await System.import("src/client/protocols/todoist.js") 
    await System.import("src/client/protocols/wikipedia.js") 
    await System.import("src/client/protocols/tmp.js")
    await System.import("src/client/protocols/bib.js")
    
    await System.import("src/client/protocols/microsoft.js") 
    
    await System.import("src/client/files-caches.js") // depends on me
  }
  

  // #Deprecated who does/dir use this code and what for
  static asUL(anyList){
    var ul = document.createElement("ul")
    ul.style.minWidth = "50px"
    ul.style.minHeight = "50px"
    ul.style.backgroundColor = "gray"
    anyList.forEach(ea => {
      var item = document.createElement("li")
      item.textContent = ea
      item.value = ea
      ul.appendChild(item)
    })
    return ul
  }


  static openWorkspace(string, pos, worldContext) {
    string = string || "";
    var name = "lively-code-mirror"
    return  lively.openComponentInWindow(name, null, pt(700,400), worldContext).then((comp) => {
      comp.mode = "text/jsx";
      comp.value = string;
      comp.setAttribute("overscroll", "contain")
      comp.style.height = "100%"
      var container = comp.parentElement
      if (pos) lively.setGlobalPosition(container,pos);
      container.setAttribute("title", "Workspace");
      comp.focus();
      return comp;
    });
  }

  static openInspector(object, pos, str, worldContext) {
    return lively.openComponentInWindow("lively-inspector", pos, pt(400,500), worldContext).then(inspector => {
        inspector.windowTitle = "Inspect: " + str;
        inspector.inspect(object);
        return inspector
    });
  }

  static ensureSpawnArea() {
    var spawnId = "livelySpawnArea"
    var spawn = document.body.querySelector("#" + spawnId)
    if (!spawn) {
      spawn = document.createElement("div")
      spawn.id = spawnId
      spawn.style.display = "none"
      spawn.isMetaNode = true
      document.body.appendChild(spawn)
    }
    return spawn
  }
  
  
  static async create(name="lively-table", parent=this.ensureSpawnArea()) {
    
    // =this.ensureSpawnArea()
    
    var element = document.createElement(name)
    // #TODO normal elements will not resolve this promoise #BUG
    if (name.match("-")) {
      await lively.components.openIn(parent, element)
    } else {
      parent.appendChild(element)
    }
    // if (document.activeElement) {
    //   var pos = lively.getGlobalBounds(document.activeElement).bottomLeft()
    //   lively.setGlobalPosition(element, pos)
    // }
    return element
  }

  static pt(x,y) {
    return pt(x,y)
  }
  
  // #important
  static setPosition(obj, point, mode, animateDuration) {
    if (obj instanceof SVGElement && !(obj instanceof SVGSVGElement)) {
      if (obj.transform && obj.transform.baseVal) {
        // get the position of an svg element
        var t = obj.transform.baseVal.consolidate()
        if (t) {
          t.setTranslate(point.x,point.y)
        } else {
          obj.setAttribute("transform", `translate(${point.x}, ${point.y})`)
        }
      } else {
        throw new Error("path has no transformation")
      }
    } else {
      var old = lively.getPosition(obj)
      // normal DOM Element
      obj.style.position = mode || "absolute";
      obj.style.left = ""+  point.x + "px";
      obj.style.top = "" +  point.y + "px";
      obj.dispatchEvent(new CustomEvent("position-changed"))
      
      if (animateDuration) {
        obj.animate([
          {left: old.x + "px", top: old.y + "px"},
          {left: point.x + "px", top: point.y+ "px"}
        ],{ 
          duration: animateDuration,
        })
      }
      
    }
  }


  // Example: lively.getPosition(that)

  // #important
  static getPosition(obj) {
    
    var pos;
    if (obj instanceof SVGElement && !(obj instanceof SVGSVGElement)) {
      if (obj.transform && obj.transform.baseVal) {
        // get the position of an svg element
        var t = obj.transform.baseVal.consolidate()
        if (!t) return pt(0,0)
        var m = t.matrix
        var p = new DOMPoint(0, 0)
        var r = p.matrixTransform(m)
        if (!r || !r.x ) return pt(0,0)
        return pt(r.x / r.w, r.y / r.w)
      } else {
        throw new Error("path has no transformation")
      }
    }

    if (obj.clientX !== undefined) {
      return pt(obj.clientX, obj.clientY);
    }
    
    // try to use directly the style object... 
    if (obj.style) {
      pos = pt(parseFloat(obj.style.left), parseFloat(obj.style.top));
    }
    // keyboard events don't have a position.
    // take the position of the target element.
    if(obj instanceof KeyboardEvent) {
      return lively.getGlobalPosition(obj.target);
    }
    // #Fallback .... and compute the style
    if (isNaN(pos.x) || isNaN(pos.y)) {
      var style = getComputedStyle(obj)
      pos = pt(parseFloat(style.left), parseFloat(style.top));
    }
    return pos;
  }

  static  getExtent(node) {
    if (node === window) {
      return pt(window.innerWidth, window.innerHeight)
    }
    // using the getBoundingClientRect produces the wrong extent
    var style = getComputedStyle(node);
    if (!style) {
      return pt(0,0)
    }
    return pt(parseFloat(style.width), parseFloat(style.height))
  }

  static  setExtent(node, extent) {
    // node.style.width = '' + extent.x + 'px';
    // node.style.height = '' + extent.y + 'px';
    // node.dispatchEvent(new CustomEvent("extent-changed"))
    this.setWidth(node, extent.x, true)
    this.setHeight(node, extent.y)
  }

  static setWidth(node, x, noevent) {
    node.style.width = '' + x + 'px';
    if (!noevent) node.dispatchEvent(new CustomEvent("extent-changed"))
  }

  static setHeight(node, y, noevent) {
    node.style.height = '' + y + 'px';
    if (!noevent) node.dispatchEvent(new CustomEvent("extent-changed"))
  }


  static  getGlobalPosition(node) {
    // WARNING: this method works pretty well but does not consider any CSS transformation
    if (!node.getBoundingClientRect) {
      return pt(0, 0)
    }
    var bounds = node.getBoundingClientRect()
    return pt(bounds.left, bounds.top)
  }

  static  setGlobalPosition(node, pos) {
    // if (!node.parentElement) return
    // var parentPos = this.getGlobalPosition(node.parentElement)
    // this.setPosition(node, pos.subPt(parentPos))

    // With all the parent elements, shadow roots and so on it is difficult to set a global position
    // ususally, we would get the global position of a parent element, but this is not always correct
    // so we use our own global position...
    lively.setPosition(node, pt(0,0)) // #somehow one time is not enough...
    var delta = pos.subPt(lively.getGlobalPosition(node))
    lively.moveBy(node, delta)
  }

  static  getGlobalCenter(node) {
    return this.getGlobalPosition(node).addPt(this.getExtent(node).scaleBy(0.5))
  }

  static  setGlobalCenter(node, pos) {
    this.setGlobalPosition(node, pos.subPt(this.getExtent(node).scaleBy(0.5)))
  }

  static moveBy(node, delta, animateDuration) {
    this.setPosition(node, this.getPosition(node).addPt(delta), undefined, animateDuration)
  }

  static  getBounds(node) {
    var pos = lively.getPosition(node)
    var extent = lively.getExtent(node)
    return rect(pos, pos.addPt(extent))
  }

  static  setBounds(node, bounds) {
    lively.setPosition(node, bounds.topLeft())
    lively.setExtent(node, bounds.extent())
  }


  static  getGlobalBounds(node) {
    var bounds = node.getBoundingClientRect()
    if (!bounds) {
      return rect(0,0,0,0)
    } 
    return rect(bounds.left, bounds.top, bounds.width, bounds.height)
  }

  // compute the global bounds of an element and all absolute positioned elements
  static getTotalGlobalBounds(element) {

    var all = Array.from(element.querySelectorAll("*"))
      .filter(ea => ea.style.position == "absolute" || ea.style.position == "relative")
      .concat([element])
      .map(ea => lively.getGlobalBounds(ea))
    var max
    var min
    all.forEach(ea => {
      var topLeft = ea.topLeft()
      var bottomRight = ea.bottomRight()
      // console.log("ea " + topLeft + " " + bottomRight)
      min = topLeft.minPt(min || topLeft)
      max = bottomRight.maxPt(max || bottomRight)
    })
    // console.log("min " + min + " max " + max)
    return rect(min, max)
  }

  static getScroll() {
    return pt(
      document.scrollingElement.scrollLeft || 0,
      document.scrollingElement.scrollTop || 0);
  }

  // #Depricated
  static openFile(url) {
    if (url.hostname == "lively4") {
      var container  = document.querySelector('lively-container')
      if (container) {
        container.followPath(url.pathname);
      } else {
        console.log("fall back on editor: "+ url);
        this.editFile(url);
      }
    } else {
      this.editFile(url);
    }
  }

  static editFile(url) {
    var editor  = document.createElement("lively-editor");
    components.openInWindow(editor).then((container) => {
        lively.setPosition(container, lively.pt(100, 100));
        editor.setURL(url);
        editor.loadFile();
    });
  }

  static hideContextMenu(evt) {
    if (evt.composedPath()[0] !== document.body) return;
    console.log("hide context menu:" + evt);
    contextmenu.hide();
  }

  static openContextMenu(container, evt, target, worldContext) {
    if (window.HaloService && 
        (HaloService.areHalosActive() ||
        (HaloService.halosHidden && ((Date.now() - HaloService.halosHidden) < 500)))) {
      target = that;
    }
    lively.contextmenu.openIn(container, evt, target, worldContext);
  }

  static nativeNotify(title, text, timeout, cb) {
    if (!this.notifications) this.notifications = [];
    this.notifications.push({title: title, text: text, cb: cb, time: Date.now()});


    if (Notification.permission !== "granted") Notification.requestPermission();

    var time = Date.now();

    // check if the third last notification was already one second ago
    if(this.notifications.length > 5 &&
      (Date.now() - this.notifications[this.notifications.length - 3].time < 1000)) {
      return console.log("SILENT NOTE: " + title  + " (" + text + ")");
    }

    console.log("NOTE: " + title  + " (" + text + ")");


    var notification = new Notification(title || "", {
      icon: 'https://www.lively-kernel.org/media/livelylogo-small.png',
      body: text || "",
    });
    if (cb) notification.onclick = cb;
    if (timeout === undefined) timeout = 3;
    setTimeout(() => notification.close(), timeout * 1000);
    // notification.onclick = cb

  }

  /** notify **
   *
   * - displays an notification in the lower left of screen
   * - takes arguments also as object parameter
   *
   * EXAMPLE:
   *
      lively.notify({
      	title: "hello",
      	text: "world",
      	color: "blue",
      	timeout: 10,
      	details: "what's up?"})
   */
  static async notify(titleOrOptions, text, timeout, cb, color) {
    try {
      // #TODO make native notifications opitional?
      // this.nativeNotify(title, text, timeout, cb)
      var title = titleOrOptions;
      new LivelyNotification({ title, text }).displayOnConsole();
      if (titleOrOptions && titleOrOptions.title) {
        title = titleOrOptions.title;
        text = titleOrOptions.title;
        timeout = titleOrOptions.timeout;
        cb = titleOrOptions.more;
        color = titleOrOptions.color;

        // open details in a workspace
        if (titleOrOptions.details) {
          cb = () => {
            lively.openWorkspace(titleOrOptions.details).then( comp => {
              comp.parentElement.setAttribute("title", title);
              comp.unsavedChanges = () => false; // close workspace without asking
            });
          };
        }
      }

      var notificationList = document.querySelector("lively-notification-list")
      if (!notificationList) {
        notificationList = await lively.create("lively-notification-list", document.body);
        notificationList.addNotification(title, text, timeout, cb, color);
      } else {
        var duplicateNotification = Array.from(document.querySelectorAll("lively-notification")).find(ea => "" + ea.title === "" + title && "" + ea.message === "" + text);
        if (duplicateNotification) {
          duplicateNotification.counter++;
          duplicateNotification.render();
        } else {
          notificationList.addNotification(title, text, timeout, cb, color);
        }
      }
    } catch(e) {
      console.log('%cERROR in lively.notify', 'font-size: 9px; color: red', e);
    }
  }

  static success(title, text, timeout, cb) {
    lively.notify(title, text, timeout, cb, 'green');
  }

  static warn(title, text, timeout, cb) {
    lively.notify(title, text, timeout, cb, 'yellow');
  }

  static error(title, text, timeout, cb) {
    debugger
    lively.notify(title, text, timeout, cb, 'red');
  }

  static async ensureHand() {
    var hand = lively.hand
    if (!hand) {
      hand = await lively.create("lively-hand", document.body)
      hand.style.visibility = "hidden"
    }
    return hand
  }

  // we do it lazy, because a hand can be broken or gone missing...
  static get hand() {
    return document.body.querySelector(":scope > lively-hand")
  }

  static get selection() {
    return Selection.current
    // var selection = document.body.querySelector(":scope > lively-selection")
    // if (!selection) {
    //   selection = document.createElement("lively-selection")
    //   lively.components.openInBody(selection);
    // }
    // return selection
  }

  /*MD 
  # Inititialization 
  
  MD*/
  
  // lively.ini
  static initializeEvents(doc) {
    doc = doc || document
    this.addEventListener('lively', doc, 'mousedown', evt => lively.onMouseDown(evt), true); // capture...
    this.addEventListener('lively', doc, 'contextmenu', evt => lively.onContextMenu(evt), false);
    this.addEventListener('lively', doc, 'click', function(evt){lively.hideContextMenu(evt)}, false);
    this.addEventListener('lively', doc, 'keydown', function(evt){lively.keys.handle(evt)}, false);
    
    this.addEventListener('lively', doc, 'keyup', function(evt){lively.keys.onKeyUp(evt)}, false);
    events.installHooks()
  }

  static async initializeDocument(doc, loadedAsExtension, loadContainer) {
    
    this.loadedAsExtension = loadedAsExtension
    
    await modulesExported
    
    this.loadedAsExtension = loadedAsExtension
    
    console.log("Lively4 initializeDocument" );
    // persistence.disable();

    await lively.loadCSSThroughDOM("font-awesome", lively4url + "/src/external/font-awesome/css/font-awesome.min.css");
    
    lively.components.loadByName("lively-notification")
    lively.components.loadByName("lively-notification-list")

    this.initializeEvents(doc);
    this.initializeHalos();

    lively.addEventListener("preventDragCopy", document, "dragstart", (evt) => {
      if ((evt.composedPath()[0] === document.body)) {
        evt.stopPropagation()
        evt.preventDefault()
      }
    })

    console.log(window.lively4stamp, "load local lively content ")
    // #RACE #TODO ... 

    // yes, we want also to change style of external websites...
    await lively.loadCSSThroughDOM("lively4", lively4url +"/src/client/lively.css");
    
    await persistence.current.loadLivelyContentForURL()
    preferences.loadPreferences()
    if (preferences.get('TipOfTheDay')) {
      const existingContainers = Array.from(document.body.querySelectorAll('lively-code-tip'));
      if(existingContainers.length !== 0) {
        existingContainers.map(tip => tip.parentElement.remove());
      }
      lively.openComponentInWindow("lively-code-tip", undefined,  lively.pt(800,200));
    }
    // here, we should scrap any existing (lazyly created) preference, there should only be one

    await lively.ensureHand();
    
    
    // lively.selection;
    
    // #Hack... just to be on the save side #ACM
    // where to put side specific adapations... cannot be overriden by CSS? #TODO
    document.body.style.textAlign = "left"
    
    
    if (loadedAsExtension) {
      lively.notify("Lively4 extension loaded!",
        "  CTRL+LeftClick  ... open halo\n" +
        "  CTRL+RightClick ... open menu");
      
    } else {

      // only scroll thrugh CTRL+drag #TODO what does UX say?
      // document.body.style.overflow = "hidden"

      var titleTag = document.querySelector("title");
      if (!titleTag) {
        titleTag = document.createElement("title");
        titleTag.textContent = "Lively 4";
        document.head.appendChild(titleTag);
      }

      document.body.style.backgroundColor = "rgb(240,240,240)"
      ViewNav.enable(document.body)

      
      this.loadContainer = loadContainer // remember....
      // if (loadContainer && lively.preferences.get("ShowFixedBrowser")) {
      //   this.showMainContainer()
      // }
    }

    if(this.deferredUpdateScroll) {
      document.scrollingElement.scrollLeft = this.deferredUpdateScroll.x;
      document.scrollingElement.scrollTop = this.deferredUpdateScroll.y;
      delete this.deferredUpdateScroll;
		}
        
    console.log("FINISHED Loading in " + ((performance.now() - lively4performance.start) / 1000).toFixed(2) + "s")
    console.log(window.lively4stamp, "lively persistence start ")
    
    
    setTimeout(() => {
      console.log("start persistence...")
      persistence.current.start()
    }, 2000)
  }
  
  
  
  static async showMainContainer() {
    var container = document.querySelector('main-content')
    if (!container) {
      var w = await lively.create("lively-window");
      document.body.appendChild(w)
      container = await lively.create("lively-container");
      w.appendChild(container)
      container.becomeMainContainer()
    }
    return container
  }

  static initializeHalos() {
    if (!window.lively) {
      return setTimeout(() => { this.initializeHalos() }, 100)
    }
    if (!document.body.querySelector('lively-halo')) {
      lively.components.openInBody(document.createElement('lively-halo')).then(comp => {
        comp.setAttribute('data-lively4-donotpersist', 'all')
      })
    }
  }

  static unload() {

    lively.notify("unloading Lively is not supported yet! Please reload page....");
  }

  /*
   * After changing code... we have to update intances...
   * a) don't touch the instance, just update the class
   *
   */
  static async updateTemplate(html) {
    var tagName = await components.reloadComponent(html);
    if (!tagName) return;

    let objectToMigrate = Array.from(document.body.querySelectorAll(tagName));
    if(lively.halo) {
      objectToMigrate.push(...lively.halo.shadowRoot.querySelectorAll(tagName));
    }
    objectToMigrate.forEach(oldInstance => {
      if (oldInstance.__ignoreUpdates) return;
      if (oldInstance.livelyUpdateStrategy !== 'migrate') return;
      
      // if (oldInstance.isMinimized && oldInstance.isMinimized()) return // ignore minimized windows
      // if (oldInstance.isMaximized && oldInstance.isMaximized()) return // ignore isMaximized windows

      var owner = oldInstance.parentElement || oldInstance.parentNode;
      var newInstance = document.createElement(tagName);

      if (oldInstance.livelyPreMigrate) {
        oldInstance.livelyPreMigrate(oldInstance);
      }
      if (owner) {
        owner.replaceChild(newInstance, oldInstance);
      }
      Array.from(oldInstance.childNodes).forEach(ea => {
        if (ea) { // there are "undefined" elemented in childNodes... sometimes #TODO
          newInstance.appendChild(ea);
          // console.log("append old child: " + ea);
        }
      });

      Array.from(oldInstance.attributes).forEach(ea => {
        // console.log("set old attribute " + ea.name + " to: " + ea.value);
        newInstance.setAttribute(ea.name, ea.value);
      });

      // Migrate Position
      if (oldInstance.style.position == "absolute") {
        newInstance.style.top = oldInstance.style.top;
        newInstance.style.left = oldInstance.style.left;
      }

      // Migrate "that" pointer
      if (window.that == oldInstance) {
        window.that = newInstance;
      }

      if (newInstance.livelyMigrate) {
        newInstance.livelyMigrate(oldInstance); // give instances a chance to take over old state...
      }

      // #LiveProgrammingHack
      document.querySelectorAll("lively-inspector").forEach(inspector => {
        if (inspector.targetObject === oldInstance) {
          inspector.inspect(newInstance)
        }
      })
    });
  

    // new (old) strategy... don't throw away the instance... just update them inplace?
    lively.findAllElements(ea => ea.tagName == tagName.toUpperCase(), true).forEach( ea => {
      if (ea.livelyUpdate) {
        try {
          ea.livelyUpdate()
        } catch(e) {
          console.error(e)
        }
      }
    })
  }

  static showInfoBox(target) {
    var info = document.createElement("div")
    info.classList.add("draginfo")
    info.target = target
    info.isMetaNode = true
    info.style.width = "300px"
    info.style['pointer-events'] = "none";
    info.setAttribute("data-is-meta", "true");
    info.style.color = "darkblue"
    info.update = function() {
      lively.setGlobalPosition(this, lively.getGlobalPosition(this.target).subPt(pt(0, 20)))
    }
    info.style['z-index'] = 10000
    info.update()
    lively.addEventListener("ShowInfoBox", target, "position-changed", () => {
      info.update()
    })
    info.stop = function() {
      this.remove()
      lively.removeEventListener("ShowInfoBox", target, "position-changed")
    }

    document.body.appendChild(info)
    return info
  }


  static showPoint(point, removeAfterTime) {
    return this.showRect(point, pt(5,5), removeAfterTime)
  }

  static showEvent(evt, removeAfterTime) {
    var r = lively.showPoint(pt(evt.clientX, evt.clientY), removeAfterTime)
    r.style.backgroundColor = "rgba(100,100,255,05)"
    return r
  }

  static showRect(point, extent, removeAfterTime=3000) {
    // check for alternative args
    if (point && !extent) {
      extent = point.extent()
      point = point.topLeft()
    }

    if (!point || !point.subPt) return
    var comp = document.createElement("div");
    comp.style['pointer-events'] = "none";
    comp.style.width = extent.x + "px";
    comp.style.height = extent.y + "px";
    comp.style.padding = "1px";
    comp.style.backgroundColor = 'rgba(255,0,0,0.5)';
    comp.style.zIndex = 1000;
    comp.isMetaNode = true;

    var bodyBounds = document.body.getBoundingClientRect()


    document.body.appendChild(comp);
    lively.setPosition(comp, point.subPt(pt(bodyBounds.left, bodyBounds.top)));
    comp.setAttribute("data-is-meta", "true");

    if (removeAfterTime) {
      setTimeout( () => comp.remove(), removeAfterTime);
    }
    // ea.getBoundingClientRect
    return comp
  }


  static showPath(path, color, printArrow) {
    color = color || "red"
    var comp = this.createPath(path, color, printArrow)
    document.body.appendChild(comp);
    comp.style.zIndex = 1000;
    lively.setGlobalPosition(comp, pt(0,0));
    comp.setAttribute("data-is-meta", "true");
    comp.isMetaNode = true;
    comp.style.pointerEvents = "none";
    comp.style.touchAction = "none";
    setTimeout( () => comp.remove(), 3000);
    return comp
  }

  static createPath(path, color, printArrow, label) {
    if (!path || path.length < 1) return;
    if (printArrow === undefined) printArrow = true;

    var comp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    comp.style = `position: absolute;
        top: 0px;
        left: 0px;
        width: 100px;
        height: 100px;
        border: none;
        opacity: 1;
        overflow: visible;`

    var dpath = path.map((ea,i) => (i == 0 ? "M " : "L ") + ea.x + " " + ea.y).join(" ")
    var defs =
`      <defs>
          <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="2" refY="6"
                 orient="auto">
              <path d="M2,2 L2,11 L10,6 L2,2" style="fill: ${color};" />
          </marker>
       </defs>`;

    var last = _.last(path)

    comp.innerHTML = defs + `<path id="path" fill="none" stroke='${color}' d='${dpath}' 
      style='${ 
        printArrow ? 'marker-end: url(#markerArrow);' : ""
      }'></path>`  + `<g font-size="12" font-family="sans-serif" fill="${color}" stroke="none"
  text-anchor="middle">
    <text x="${last.x}" y="${last.y}" dx="10">${label ? label : ""}</text>
  </g>`

    return comp
  }


  static async showSource(object, evt) {
    if (object instanceof HTMLElement) {
      if (!object.localName.match(/-/)) {
        return lively.notify("Could not show source for native element");  
      }
      lively.openBrowser(await this.components.searchTemplateFilename(object.localName + ".html"), true)
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }

  static async showClassSource(object, evt) {
    if (object instanceof HTMLElement) {
      if (!object.localName.match(/-/)) {
        return lively.notify("Could not show source for native element");  
      }
      let templateFile =await this.components.searchTemplateFilename(object.localName + ".html"),
        source = await fetch(templateFile).then( r => r.text()),
        template = lively.html.parseHTML(source).find( ea => ea.tagName == "TEMPLATE"),
        moduleURL = await this.components.searchTemplateFilename(object.localName + ".js");
      lively.openBrowser(moduleURL, true);
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }


  static showElement(elem, timeout) {
    if (!elem || !elem.getBoundingClientRect) return ;
    var comp = document.createElement("div");
    var bounds = elem.getBoundingClientRect();
    var bodyBounds = document.body.getBoundingClientRect()
    var offset = pt(bodyBounds.left, bodyBounds.top)
    var pos = pt(bounds.left, bounds.top).subPt(offset);

    comp.style.width = bounds.width +"px";
    comp.style.height = bounds.height +"px";
    comp.style['pointer-events'] = "none";
    // comp.style.height = "0px"
    comp.style["z-index"] = 1000;
    comp.style.border = "1px solid red";
    comp.isMetaNode = true;
    document.body.appendChild(comp);
    lively.setPosition(comp, pos);
    comp.setAttribute("data-is-meta", "true");

    comp.innerHTML = "<pre data-is-meta='true' style='position: relative; top: -8px; width: 200px; background: rgba(255,255,255,0.8); color: red; font-size: 8pt'>" +
        elem.tagName +": " + elem.id + "\n" +
        elem.getAttribute("class") +"\n"

      + "</pre>";

    setTimeout( () => comp.remove(), timeout || 3000);
    return comp;
  }
  
  
  // highlight and show log info on element
  static showLog(elem, log="", timeout) {
     
    var lastDebugLayer = debugLogHightlights.get(elem)
    if (!lastDebugLayer || !lastDebugLayer.parentElement) {
      var debugText = ""
    } else {
      debugText = lastDebugLayer.querySelector("pre").textContent 
    }
    var debugLayer = lively.showElement(elem, timeout)
    debugLogHightlights.set(elem, debugLayer)
    debugLayer.querySelector("pre").textContent = debugText + "\n" + log
    
  }
  

  static async showProgress(label) {
    var progressContainer  = document.querySelector("#progressContainer")
    if (!progressContainer) {
      progressContainer = document.createElement("div")
      progressContainer.id = "progressContainer"
      progressContainer.isMetaNode = true
      // progressContainer.style['pointer-events'] = "none";
      progressContainer.style.zIndex = 1000
      document.body.appendChild(progressContainer)
      lively.setGlobalPosition(progressContainer, pt(50, 50))
    }

    var progress = document.createElement("lively-progress")
    await components.openIn(progressContainer, progress)
    lively.setExtent(progress, pt(300,20))
    progress.textContent = label
    return progress
  }

  static allProperties(obj, result) {
    result = result || {};
    Object.getOwnPropertyNames(obj).forEach( name => {result[name] = obj.constructor.name});
    if (obj.__proto__) {
      lively.allProperties(obj.__proto__, result);
    }
    return result;
  }

  static templateClassNameToTemplateName(className) {
    return className.replace(/[A-Z]/g, ea => "-" + ea.toLowerCase()).replace(/^-/,"");
  }


  // Example code for looking up templates in links:
  // Array.from(document.head.querySelectorAll("link"))
  //   .filter(ea => ea.getAttribute("rel") == "import")
  //   .map(ea => ea.href)
  //   .find(ea => ea.endsWith("lively-digital-clock.html"))

  static async registerTemplate() {
    var template = document.currentScript.ownerDocument.querySelector('template');
    var clone = document.importNode(template.content, true);
    var proto;
    var className = template.getAttribute("data-class");
    if (className) {
      // className = "LivelyFooBar"
      let baseName = this.templateClassNameToTemplateName(className);
      var url = await this.components.searchTemplateFilename(baseName +".js")
      if (url) {
        // console.log("Components: load module " + url)
        var module = await System.import(url);
        proto =  Object.create(module.prototype || module.default.prototype);
      } else {
        throw new Error("Components: could not find module for " + baseName)
      }
    }
    components.register(template.id, clone, proto);
  }

  static get eventListeners() {
    if (!window.livelyEventListeners) {
      window.livelyEventListeners = [];
    }
    return window.livelyEventListeners;
  }

  static set eventListeners(list) {
      window.livelyEventListeners = list;
  }

  // Registration and deregistration of eventlisteners for run-time programming...
  static addEventListener(domain, target, type, listener, options) {
    this.eventListeners.push(
      {target: target, type: type, listener: listener, domain: domain, options: options});
    target.addEventListener(type, listener, options);
  }

  static removeEventListener(domain, target, type, listener) {
    this.eventListeners = this.eventListeners.filter(ea => {
      if ((!target      || (ea.target   === target))
          && (!type     || (ea.type     ==  type))
          && (!listener || (ea.listener === listener))
          && (!domain   || (ea.domain   ==  domain))) {
        // actually removing the event listener
        // console.log("removeEventListener", ea.target, ea.type, ea.listener)
        ea.target.removeEventListener(ea.type, ea.listener, ea.options);
        return false;
      } else {
        return true;
      }
    });
  }

  static openSearchWidget(text, worldContext, searchContext=document.body) {
    if (lively.preferences.get("FileIndex")) {
      this.openComponentInWindow("lively-index-search").then( comp => {
        var pattern = text.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")
        comp.searchFile(pattern);
        lively.setExtent(comp.parentElement, pt(1000,700))
        comp.focus()
      });
    } else {
      var container = lively.query(searchContext, "lively-container")
      this.openComponentInWindow("lively-search", undefined, undefined, worldContext).then( comp => {
        if (container) {
          // search in the current repository
          var url = container.getURL().toString()
          var base = lively4url.replace(/[^/]*$/,"")
          if (url.match(base)) {
            var repo = url.replace(base,"").replace(/\/.*$/,"")
            comp.searchRoot = repo
          }
        }
        comp.searchFile(text);
        comp.focus()

      });
    } 
      
      // #Depricated
      // var comp = document.getElementsByTagName("lively-search-widget")[0];
      // if (comp.isVisible && text == comp.query) {
      //   comp.isVisible = false;
      // } else {
      //   comp.isVisible = true;
      //   comp.search(text, true);
      // }
    
  }

  static hideSearchWidget() {
    console.log('hide search widget')
    document.body.querySelectorAll("lively-search").forEach( ea => ea.parentElement.remove());
  }

  static openIssue(number) {
    // #TODO customize or derive github issue url, making it context cependend
    window.open("https://github.com/LivelyKernel/lively4-core/issues/" + number)
  }

  static openHelpWindow(text) {
    this.openComponentInWindow("lively-help").then(comp => {
      comp.parentElement.style.width = "850px";
      comp.parentElement.style.height = "600px";
      comp.getHelp(text);
    });
  }



  static async openComponentInWindow(name, globalPos, extent, worldContext) {
    worldContext = worldContext || document.body

    var w = await lively.create("lively-window");
    if (extent) {
      lively.setExtent(w, extent)
    }
    if (!globalPos) {
      let pos = lively.findPositionForWindow(worldContext);
      globalPos = lively.getGlobalPosition(worldContext).addPt(pos);
    }

    return components.openIn(worldContext, w, true).then(w => {
      lively.setGlobalPosition(w, globalPos);

      return components.openIn(w, document.createElement(name)).then(comp => {
        components.ensureWindowTitle(comp, w)
        return comp;
      });
    });
  }

  static findPositionForWindow(worldContext) {
     // this gets complicated: find a free spot starting top left going down right
      var windows = Array.from(worldContext.querySelectorAll(":scope > lively-window"))
      var offset = 20
      var pos
      var topLeft = pt(50,50)

      for(var i=0; !pos; i++) {
        let p1 = pt(i * offset, i * offset)
        let p2 = pt((i + 1) * offset, (i + 1) * offset)
        var found = windows.find( ea => {
          // var ea = that; var i =0
          var eaPos = lively.getGlobalPosition(ea).subPt(topLeft)
          // check if there is a window in direction bottom right
          return (p1.lessPt(eaPos) || p1.eqPt(eaPos)) && eaPos.lessPt(p2)
        });
        // no window is found... so place the next there
        if (!found) pos = topLeft.addPt(pt(i * offset, i* offset))
      }
      return pos.subPt(lively.getGlobalPosition(worldContext))
  }

  // lively.openBrowser("https://lively4/etc/mounts", true, "Github")
  static async openBrowser(url, edit, patternOrPostion, replaceExisting, worldContext) {
    worldContext = worldContext || document.body
    if (patternOrPostion && patternOrPostion.line)
      var lineAndColumn = patternOrPostion
    else
      var pattern = patternOrPostion

    if (!url || !url.match(/^[a-z]+:\/\//))
      url = lively4url
    var livelyContainer;
    var containerPromise;
    if (replaceExisting) {
      livelyContainer = Array.from(worldContext.querySelectorAll("lively-container")).find(ea => ea.isSearchBrowser);
    }

    var lastWindow = _.first(Array.from(worldContext.querySelectorAll("lively-window"))
      .filter(  ea => ea.childNodes[0] && ea.childNodes[0].isSearchBrowser));

    containerPromise = livelyContainer ? Promise.resolve(livelyContainer) :
      lively.openComponentInWindow("lively-container", undefined, undefined, worldContext);

    return containerPromise.then(comp => {
      livelyContainer = comp;
      livelyContainer.hideNavbar()
      comp.parentElement.style.width = "950px";
      comp.parentElement.style.height = "800px";

      if (lastWindow) {
        lively.setPosition(comp.parentElement,
          lively.getPosition(lastWindow).addPt(pt(25,25)));
      }

      if (edit) comp.setAttribute("mode", "edit");
      if (pattern) {
        comp.isSearchBrowser = true;
        comp.hideNavbar();
      }
      return comp.followPath(url)
    }).then(async () => {
      if (edit) {
        await livelyContainer.asyncGet("#editor").then(async livelyEditor => {
          var codeMirror = await livelyEditor.awaitEditor()
    
          if(pattern) {
            livelyEditor.find(pattern);
            
          } else if (lineAndColumn) {
            
            codeMirror.setSelection(
              {line: lineAndColumn.line, ch: lineAndColumn.column},
              {line: lineAndColumn.line, ch: lineAndColumn.column + 
                (lineAndColumn.selection ? + lineAndColumn.selection.length : 0)})
            // #TODO ...
            // ace.gotoLine(lineAndColumn.line, lineAndColumn.column)
          }
          codeMirror.focus()
          codeMirror.scrollIntoView(codeMirror.getCursor(), 200)
        });
      }
      return livelyContainer
    });
  }

  static openDebugger() {
    if(!window.lively4ChromeDebugger) {
      return lively.notify("Please install Lively4Chrome Extension for debugger support.");
    }
    window.lively4ChromeDebugger.getCurrentDebuggingTarget().then((res) => {
      // Use chrome.window.create to create an independent window, window.open does not work
      window.lively4ChromeDebugger.createWindow({
        url: lively4url + '/debugger.html?targetId=' + res.targetId,
        width: 1000, left: parseInt((screen.width - 1000)/2),
        height: 750, top: parseInt((screen.height - 750)/2),
        type: 'popup'
      }).catch((error) => {
        lively.notify("Unable to create new window for debugger.")
      });
    });
  }

  static get(query) {
    return document.querySelector(query)
  }

  static confirm(msg, customizeCB) {
    return Dialog.confirm(msg, customizeCB)
  }

  static prompt(msg, value, customizeCB) {
    return Dialog.prompt(msg, value, customizeCB)
  }

  static findWorldContext(element) {
    
    if (!element) return document.body
    if (element.id == "container-root") return element
    
    if (!element.parentElement) {
      debugger
      // if (element.parentNode.host && element.parentNode.host.localName == "lively-container") {
      //   return element.parentNode.host.getContentRoot()
      // }
     // ||  element.tagName == "LIVELY-FIGURE"
      return element.parentNode; // shadow root
    }
    
    if (element.tagName == "BODY")
      return element
    else
      return this.findWorldContext(element.parentElement)
  }

  
  static activeElement(worldContext, type) {
    worldContext = worldContext || document
    var element = worldContext.activeElement
    if (type && element.localName == type) return element
    if (element.shadowRoot && element.shadowRoot.activeElement)
      return this.activeElement(element.shadowRoot, type); // probe if we want to go deeper
    return element
  }

  static findWindow(element) {
    if (element.isWindow) return element;
    if (element.parentNode) return this.findWindow(element.parentNode);
    if (element.host) return this.findWindow(element.host);
    return document.body; // nothing found... just use the body
  }

  // lively.print(document)
  static print(obj) {
    var s = "" + obj + "{"
    for(var i in obj) {
      if (!(obj[i] instanceof Function) && obj[i] !== undefined)
      s += i + ": " + obj[i] + "\n"
    }
    s +"}"
    return s
  }


  static allKeys(obj) {
    var keys = []
    for(var i in obj) {
      if (obj.hasOwnProperty(i) || obj.__lookupGetter__(i)) {
        keys.push(i);
      }
    }
    return keys
  }


  static onUnload() {
    // #TODO How to deal with multiple open lively pages?
    // last closing site wins!
    // #IDEA: we could versionize the local content and saving to it will merge in conflicting changes first? But for this to work, we would need a change history in our local storage, too?
    persistence.current.saveLivelyContent()
  }

  /* Change Preference Callbacks */

  static async onInteractiveLayerPreference(enabled) {
    if (enabled) {
      await System.import("src/client/interactive.js");
      InteractiveLayer.beGlobal()
    } else {
      if (window.InteractiveLayer)
        InteractiveLayer.beNotGlobal()
    }
  }

  static async onShowFixedBrowserPreference(enabled) {
    if (!this.loadedAsExtension && enabled) {
      this.showMainContainer()
    } else {
      var content = document.querySelector("#main-content")
      if (content && content.parentElement.isWindow ) {
        content.parentElement.remove()
      }
    }
  }

  static async onShowDocumentGridPreference(enabled) {
    if (enabled) {
      ViewNav.showDocumentGrid(document.body)
    } else {
      ViewNav.hideDocumentGrid(document.body)
    }
  }

  static async onOfflineFirstPreference(enabled) {
    // store it where the service worker can see it... before we are loaded
    lively.focalStorage.setItem("swxOfflineFirst", enabled)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'config',
        option: "offlineFirst",
        value: enabled
      });
    } else {
      console.log("onOfflineFirstPreference: navigator.serviceWorker.controller not there?")
    }


  }


  static async onBodyPositionPreference(pos) {
    lively.setPosition(document.body, pos)
  }

  static async onBodyScrollPreference(pos) {
    this.deferredUpdateScroll = pos;
  }
  
  static async onFileIndexPreference(bool) {
    if (bool) {
      if(!this.fileIndexWorker) {
        this.fileIndexWorker = new SystemjsWorker("src/worker/fileindex-worker.js")
      }
      this.fileIndexWorker.postMessage({message: "updateDirectory", url: lively4url + "/"})
    }
  }

  /*
   * Continousely send a message to swx to keep it alive, since it boots slowly...
   */
  static async onSWXKeepAlivePreference(bool) {
    while(lively.preferences.get("SWXKeepAlive")) {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'meta',
          command: 'keepalive'
        });        
      }
      // console.log("swx keep alive")
      await lively.sleep(1000)
    }
  }

  /*
   * keep detailed bootlog in indexdb for later visualization and analysis
   */
  static async onLogBootPreference(bool) {
    localStorage["logLivelyBoot"] = bool
  }

  static isGlobalKeyboardFocusElement(element) {
    return element === document.body
      || (element && element.id == "copy-hack-element")
      || (element  && element.tagName == "LIVELY-CONTAINER" && element.shadowRoot && !element.shadowRoot.activeElement)
  }

  static hasGlobalFocus() {
    return this.isGlobalKeyboardFocusElement(document.activeElement)
  }

  static globalFocus() {
    // document.querySelector('#copy-hack-element').remove()
    // var copyHack = document.querySelector('#copy-hack-element')
    //   if (!copyHack) {
    //     copyHack = document.createElement("input")
    //     lively.setPosition(copyHack, pt(0,0))
    //     lively.setExtent(copyHack, pt(30,30))
    //     copyHack.style.backgroundColor = "red"
    //     copyHack.id = "copy-hack-element"
    //     copyHack.isMetaNode = true
    //     document.body.appendChild(copyHack)
    //   }
    // lively.focusWithoutScroll(copyHack)

    this.focusWithoutScroll(document.body)
  }

  // #TODO: feature is under development and will ship in Chrome 64
  // same as element.focus({ preventScroll : true}); ?
  static focusWithoutScroll(element) {
    if (!element) return;
    // console.log("focusWithoutScroll " + element)
    var scrollTop = document.scrollingElement.scrollTop;
    var scrollLeft = document.scrollingElement.scrollLeft;
    element.focus({ preventScroll : true});
    // the focus scrolls as a side affect, but we don't want that
    document.scrollingElement.scrollTop = scrollTop;
    document.scrollingElement.scrollLeft = scrollLeft;
    //console.log("scroll back " + scrollTop + " " + scrollLeft )
  }

  static ensureID(element) {
    var id = element.getAttribute("data-lively-id")
    if (!id) {
      id = generateUUID()
      element.setAttribute("data-lively-id", id)
    }
    return id
  }

  static elementByID(id, worldContext) {
    if (!id) return;
    worldContext = worldContext || document;
    return worldContext.querySelector('[data-lively-id="' + id + '"]');
  }

  static query(element, query) {
   // lively.showElement(element)
   var result = element.querySelector(query)
   if (!result && element.isWindow) return; // scope that search to windows
   if (!result && element.parentElement) result = this.query(element.parentElement, query)
   if (!result && element.parentNode) result = this.query(element.parentNode, query)
   if (!result && element.host && element.host.querySelector) result = this.query(element.host, query)
   return result
  }
  
  static waitOnQuerySelector(element, selector, maxtime) {
    maxtime = maxtime || 10000;
    var startTime = Date.now();
    return new Promise((resolve, reject) => {
      var check = () => {
        var found = element.querySelector(selector);
        if (found) resolve(found);
        else if (Date.now() - startTime > maxtime) reject();
        else setTimeout(check, 100);
      };
      check();
    });
  }
  
  static elementToCSSName(element) {
    try {
      return element.localName + (element.id  ? "#" + element.id : "")  + (element.classList && element.classList.length > 0   ? "." + Array.from(element.classList).join(".") : "")      
    } catch(e) {
      return "" // silent fail.... 
    }
  }

  static async openPart(partName, worldContext=document.body) {
    var data = await fetch(`${lively4url}/src/parts/${partName}.html`).then(t => t.text())
    var element  = lively.clipboard.pasteHTMLDataInto(data, worldContext);
    element.setAttribute("data-lively-part-name", partName)
    return element
  }

  static queryAll(element, query) {
    var all = new Set()
    element.querySelectorAll(query).forEach(ea => all.add(ea))
    var containers = element.querySelectorAll("lively-container")
    containers.forEach(ea => {
      ea.shadowRoot.querySelectorAll(query).forEach(ea => all.add(ea))
    })
    return Array.from(all)
  }

  
  static gotoWindow(element, justFocuWhenInBounds) {
    element.focus()

    if (!justFocuWhenInBounds) {
      var elementBounds = lively.getGlobalBounds(element) 
      var windowBounds = rect(0,0, window.innerWidth, window.innerHeight)
      if (!windowBounds.containsRect(elementBounds)) {
        // only do somthing if we are not visible
        document.scrollingElement.scrollTop = 0
        document.scrollingElement.scrollLeft = 0
        var offset = pt(window.innerWidth, window.innerHeight).subPt(lively.getExtent(element))
        
        var pos = lively.getPosition(element).subPt(offset.scaleBy(0.5))
        lively.setPosition(document.body, pos.scaleBy(-1), undefined, 1000)        
      }
    }
  }

  //  lively.allPreferences()
  static allPreferences() {
    var regexp = /on(.*)Preference/
    return Object.getOwnPropertyNames(lively)
      .filter(ea => ea.match(regexp))
      .map(ea => ea.match(regexp)[1])
  }

  static async bench(func) {
    var s = Date.now()
    await func()
    return Date.now() - s
  }

  static get halo() {
    return HaloService.instance;
  }

  static onMouseDown(evt) {
    // lively.showEvent(evt)
    lively.lastScrollTop = document.scrollingElement.scrollTop;
    lively.lastScrollLeft = document.scrollingElement.scrollLeft;
  }

  static async onContextMenu(evt) {
    if (!evt.shiftKey) { // evt.ctrlKey
      evt.preventDefault();
      evt.stopPropagation();
      // #Hack #Workaround weired browser scrolling behavior
      if (lively.lastScrollLeft || lively.lastScrollTop) {
        document.scrollingElement.scrollTop = lively.lastScrollTop;
        document.scrollingElement.scrollLeft = lively.lastScrollLeft;
      }
      
      var link = Array.from(evt.composedPath()).find(ea => ea.localName == "a")
      if (link) {
        // #TODO can we shorten this or hide this context specific behavior, 
        // e.g. asking a link for href in the "context" of a lively container should
        // produce the following behavior! #ContextJS #UseCase 
        var url = link.getAttribute("href")
        var container = await lively.query(link, "lively-container")
        if (!url.match(/^[a-zA-Z0-9]+:/)) {
          if (container) {
            url = container.getURL().toString().replace(/[^/]*$/,"") + url
          }
        }
        var items = []
        if (container) {
          items.push(["follow", () => {
            container.followPath(url)
          }])
        }
        items.push(["open in window", () => {
          lively.openBrowser(url)
        }])
        items.push(["edit in window", () => {
          lively.openBrowser(url, true)
        }])
        var menu = new lively.contextmenu(this, items );
        menu.openIn(document.body, evt, this);
        
      } else  {
        lively.openContextMenu(document.body, evt);
      }
      return false;
    }
  }

  static halt(time=1000) {
    window.setTimeout(() => {
      debugger
    }, time);
  }

  static async sleep(time=1000) {
    return wait(time);
  }
  
  // check something, and sleep and check again... stop after found or timeout
  // "when in doubt let it tick"
  static async sleepUntil(cb, time=5000, step=50) {
      var timeout;
        lively.sleep(time).then(() => {
          timeout = true})
      var result  
      while(!result && !timeout) {
        result = cb()
        await lively.sleep(step)
      }
      return result
  }

  static async time(func) {
    var start = performance.now()
    if (func) {
      await func()
    } 
    return performance.now() - start
  }
  
  // #transformation #TODO #BUG: if we name omitFn 'omit', the omit method from underscore is accessed as this reference!
  // this might be due to rewriting (either var recorder or aexprs)
  static stack({ debug = false, log = false, omitFn = lively.stack, max = Infinity } = {}) {
    let stack = new Stack({ omitFn, max });

    if (log) {
      console.warn(stack);
    }
    if (debug) {
      debugger;
    }

    return stack;
  }
  
  static allElements(deep=false, root=document.body, all=new Set()) {
    if (deep && root.shadowRoot) {
      this.allElements(deep, root.shadowRoot, all)
    }
    root.querySelectorAll("*").forEach(ea => {
      if (deep && ea.shadowRoot) {
        this.allElements(deep, ea.shadowRoot, all)
      }
      all.add(ea)
    })
    all.add(root)
    return all
  }
  
  static allTextNodes(root){
    var n, 
        result=[], 
        walk=document.createTreeWalker(root, NodeFilter.SHOW_TEXT,null,false);
    while(n=walk.nextNode()) {
      result.push(n);
    }
    return result;
  }

  static findAllElements(filterFunc, deep) {
    return Array.from(this.allElements(deep)).filter(filterFunc)
  }
  
  static allParents(element, parents=[], deep = false) {
    if (!element) return parents
    if (!element.parentElement) {
      if(deep && element.parentNode) {
        if (element.parentNode === document) {
          return parents
        }
        parents.push(element.parentNode)
        parents.push(element.parentNode.host)
        
        return this.allParents(element.parentNode.host, parents, deep)
      } else {
        return parents
      }
    }
    parents.push(element.parentElement)
    this.allParents(element.parentElement, parents, deep)
    return parents
  }
  
  /* test if element is in DOM */
  static isInBody(element) {
    return this.allParents(element, undefined, true).includes(document.body)
  }

  static showHalo(element) {
    window.that = element
    HaloService.showHalos(element)
  }
  
  static swxURL(url) {
    var m = url.toString().match(/^([a-zA-Z0-9]+)\:\/?\/?(.*)$/)
    if (!m) {
      throw new Error("coudl not convert url to an swx form: " + url)
    }
    return "https://lively4/scheme/" + m[1] +"/" + m[2]
  }

  static allElementsFromPoint(pos, root=document, visited=new Set()) {
    var result = []
    var elements = root.elementsFromPoint(pos.x, pos.y)
    // this is a workaround of the issue that elementsFromPoint contains parent elements...
    
    elements
      .filter(e => {
        const notYetVisited = !visited.has(e);
        visited.add(e)
        return notYetVisited;
      })
      .forEach(ea => {
        if (ea.shadowRoot && ea.shadowRoot.elementsFromPoint) {
          var shadowRootElements = this.allElementsFromPoint(pos, ea.shadowRoot, visited)
          result.push(...shadowRootElements)        
        }
        result.push(ea)
      })

    return result
  }
  
  
  static registerSWXFetchHandler() {
    
    if (!navigator.serviceWorker) {
      console.warn("[lively] registerSWXFetchHandler faile: no serviceWorker found")
      return;
    }
    lively.removeEventListener("proxy", navigator.serviceWorker)
    lively.addEventListener("proxy", navigator.serviceWorker, "message", async (evt) => {
        try {
          if(!evt.data.name || !evt.data.name.match('swx:proxy:')) return; // not for me

          let url = evt.data.url
          if (!evt.ports[0]) {
            console.warn("registerSWXFetchHandler got message... but could not answer")
            return 
          }
          if(evt.data.name == 'swx:proxy:GET') {
            // console.log("[lively] registerSWXFetchHandler FETCH SWX: " + url)
            evt.ports[0].postMessage({content: await fetch(url, {
              method: "GET",
              headers: Object.assign(evt.data.headers, {
                "lively-proxied": "true"
              })
            }).then(r => r.blob())}); 
          } 
        } catch(err) {
          evt.ports[0].postMessage({error: err});
        }
      });

  }
}

if (!window.lively || window.lively.name != "Lively") {
  window.lively = Lively;
  console.log(window.lively4stamp, "loaded lively intializer");
  // only load once... not during development
  Lively.loaded();
} else {
  var oldLively = window.lively
  Lively.previous = oldLively
  Lively.fileIndexWorker = oldLively.fileIndexWorker
  window.lively = Lively;
}

// #TODO pull this this out into boot.js #Continue
lively.registerSWXFetchHandler() // #BUG this is to late for booting lively itself if not everthing is in the zip


var modulesExported = Lively.exportModules();





console.log(window.lively4stamp, "loaded lively");
