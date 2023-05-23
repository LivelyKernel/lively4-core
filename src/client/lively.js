"disable deepeval"
/*MD 
![](../../media/lively4_logo_smooth_200.png)

# Lively4 core module

[architecture](browse://doc/architecture/lively.md)

 #Lively4 #Singleton #KitchenSink #CyclicDependecies #RefactoringNeeded


MD*/

import './patches.js'; // monkey patch the meta sytem....
// import * as jquery from '../external/jquery.js'; // should not be needed any more!
import _ from 'src/external/lodash/lodash.js';
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
import authGoogledrive from './auth-googledrive.js';
import expose from './expose.js';
import { toArray, uuid as generateUUID, wait } from 'utils';
import { pt, rect } from './graphics.js';
import Dialog from 'src/components/widgets/lively-dialog.js';
import ViewNav from 'src/client/viewnav.js';
import SystemjsWorker from "src/worker/systemjs-worker.js";
import Stack from 'src/client/utils/stack.js';

/* expose external modules */
// import color from '../external/tinycolor.js';
import focalStorage from '../external/focalStorage.js';
import Selection from 'src/components/halo/lively-selection.js';
import windows from "src/components/widgets/lively-window.js";

import events from "src/client/morphic/events.js";

let $ = window.$; // known global variables.

/*globals that*/

import {default as HaloService} from "src/components/halo/lively-halo.js"

var debugLogHightlights = new WeakMap();

// a) Special shorthands for interactive development
// b) this is the only reasonable way to use modules in template scripts, due to no shared lexical scope #TODO
// c) This indirection is also needed to let old events listeners signal to code in current modules
var exportmodules = ["preferences", "files", "keys", "paths", "html", "reflection", "components", "persistence",
// "color",
"focalStorage", "authGithub", "authDropbox", "authGoogledrive", "contextmenu", "windows"];

class LivelyNotification {
  constructor(data) {
    this.data = data;
  }

  displayOnConsole() {
    console.log('%cLively Notification', "color: gray; font-size: x-small", this.data);
  }
}

import Callable from 'src/client/utils/callable.js'

class PrinterBuilder extends Callable {
  
  constructor() {
    super();
    this.config = []
  }

  __call__(element) {
    return this.printElement(element)
  }

  printElement(element) {
    const printout = this.config.includes('asDiv') ? <div></div> : <span></span>;
    
    if (element === null) {
      printout.append('null')
      return printout;
    }
    if (element === undefined) {
      printout.append('undefined')
      return printout;
    }
    if (element instanceof ShadowRoot) {
      printout.append('ShadowRoot')
      return printout;
    }
    if (element === self) {
      printout.append('window')
      return printout;
    }
    if (element === document) {
      printout.append('document')
      return printout;
    }
    
    if (this.config.includes('tagName')) {
      printout.append(<span style='color: green'>{element.localName}</span>)
    }

    if (this.config.includes('id') && element.id) {
      printout.append(<span style='color: darkgray'>#{element.id}</span>)
    }

    if (this.config.includes('classes') && element.classList.length > 0) {
      printout.append(<span style='color: blue'>.{[...element.classList].join('.')}</span>)
    }

    if (this.config.includes('pos')) {
      let pos;
      try {
        pos = lively.getPosition(element);
      } catch (e) {}
      if (pos) {
        printout.append(<span style='color: brown'> [{pos.x !== undefined ? pos.x : ''},{pos.y !== undefined ? pos.y : ''}]</span>)
      } else {
        printout.append(<span style='color: brown'> []</span>)
      }
    }

    if (this.config.includes('offset')) {
      printout.append(<span style='color: brown'> ({element.offsetLeft},{element.offsetTop})</span>)
    }

    return printout
  }

  // get tag() {
  //   this.config.push('tag')
  //   return this
  // }

  get tagName() {
    this.config.push('tagName')
    return this
  }

  get id() {
    this.config.push('id')
    return this
  }

  get classes() {
    this.config.push('classes')
    return this
  }

  get pos() {
    this.config.push('pos')
    return this
  }

  get offset() {
    this.config.push('offset')
    return this
  }

  get asDiv() {
    this.config.push('asDiv')
    return this
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
  
  static nextFrame() {
    return new Promise(requestAnimationFrame)
  }

  static findDirectDependentModules(path, checkDeepevalFlag) {
    var mod = System.normalizeSync(path);
    
    var loads = Object.values(System.loads)
    var myload = loads.find(ea => ea.key == mod)
    
    if (myload && checkDeepevalFlag) {
      try {
        // try to get to the source code without async fetch
        var source = myload.metadata.pluginLoad.source
        var isDeepEvaling = source.match(/\"disable deepeval\"/) // Unnessary esacape on purpose to not match myself
        if (isDeepEvaling) return []
      } catch(e) {
        console.error("findDirectDependentModules could not get source from SystemJS ", e)
      }
    }
    
    return loads.filter(ea => {
      if (ea.key.match("unnamed_module")) {

        return false;
      }

      return ea.dependencies.find(dep => System.normalizeSync(dep, ea.key) == mod);
    }).map(ea => ea.key);
  }

  static findModuleDependencies(path) {
    var mod = System.normalizeSync(path);
    var load = Object.values(System.loads).find(ea => ea.key == mod)
    if (!load) return []
    return load.dependencies.map(ea => System.normalizeSync(ea))
  }

  
  // #TODO #Refactor think about using options 
  static findDependedModules(path, recursive, reverse=false, checkDeepevalFlag=false, all = []) {
    let dependentModules 

    if (reverse) {
      dependentModules = this.findModuleDependencies(path);
    } else {
      dependentModules = this.findDirectDependentModules(path, checkDeepevalFlag);
    }
    if (recursive) {
      dependentModules.forEach(module => {
        if (!all.includes(module)) {
          all.push(module);
          this.findDependedModules(module, true, reverse, checkDeepevalFlag, all);
        }
      });
      return all;
    } else {
      return dependentModules;
    }
  }

  static findDependedModulesGraph(path, all = [], reverse=false) {

    let tree = {};
    tree.name = path;
    let dependentModules 
    if (reverse) {
      dependentModules = this.findModuleDependencies(path);
    } else {
      dependentModules = this.findDirectDependentModules(path);
    }
    tree.children = [];

    dependentModules.forEach(module => {
      if (!all.includes(module)) {
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
    var normalizedPath = System.normalizeSync(path);
    try {
      // check, to prevent trying to reloading a module a second time if there was an error #375
      if (System.get(normalizedPath)) {
        await System.import(normalizedPath).then(module => {
          if (module && typeof module.__unload__ === "function") {
            module.__unload__();
          }
        });
      }
    } catch (e) {
      console.log("WARNING: error while trying to unload " + path);
    }
    System.registry.delete(normalizedPath);
    // #Hack #issue in SystemJS babel syntax errors do not clear errors
    System['@@registerRegistry'][normalizedPath] = undefined;
    delete System.loads[normalizedPath];
  }

  static async reloadModule(path, force = false, forceRetranspile, deep=true) {
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
    if(forceRetranspile) {
      System.forceRetranspilation = true;    
    }
    await this.unloadModule(path);
    let mod = await System.import(path);
    if(forceRetranspile) {
      System.forceRetranspilation = false;    
    }

    /**
     * Reload dependent modules
     */
    // #TODO how can we make the dependecy loading optional... I don't need the whole environment to relaod while developing a core module everybody depends on
    // if (path.match("graphics.js")) {
    //   console.log("[reloadModule] don't load dependencies of " + path)
    //   return mod
    // }

    let dependedModules = [];
    if (deep) {
      if (['__stats__.js', 'lively-code-mirror-modes.js'].some(ending => path.endsWith(ending))) {
        // these files have a different mode of live programming:
        // they update some global state/behavior to its latest version without requiring dependent modules to be reloaded
        dependedModules = [];
      } else if (path.match('client/reactive')) {
        // For reactive, find modules recursive, but cut modules not in 'client/reactive' folder
        dependedModules = lively.findDependedModules(path, true, false, true);
        dependedModules = dependedModules.filter(mod => mod.match('client/reactive'));
        // #TODO: duplicated code #refactor
      } else if (path.match('client/vivide')) {
        // For vivide, find modules recursive, but cut modules not in 'client/vivide' folder
        dependedModules = lively.findDependedModules(path, true, false, true);
        dependedModules = dependedModules.filter(mod => mod.match('client/vivide'));
      } else {
        // Find all modules that depend on me 
        // dependedModules = lively.findDependedModules(path); 

        // vs. find recursively all! 
        dependedModules = lively.findDependedModules(path, true, false, true);
      }      
    }
    

    // console.log("[reloadModule] reload yourself ",(performance.now() - start) + `ms` ) 
    // start = performance.now()

    // and update them
    for (let ea of dependedModules) {
      try {
        await this.unloadModule(ea);
      } catch (e) {
        lively.notify("[lively] Ignore Error unloadModule dependend module", ea, e);
      }
    }

    // start = performance.now()
    // await Promise.all(dependedModules.map(dependentModule => System.import(dependentModule)));
    for (let ea of dependedModules) {
      try {
        await System.import(ea);
      } catch (e) {
        lively.error("Error reloading dependend module", ea);
      }
    }



    // console.log("[reloadModule] updated depended modules ",(performance.now() - start) + `ms` ) 
    // start = performance.now()

    /**
     * Update Templates: Reload a template's .html file
     */
    for (let eaPath of [path].concat(dependedModules)) {
      // console.log("update dependend: ", eaPath)
      let found = lively.components.getTemplatePaths().find(templatePath => eaPath.match(templatePath));
      if (found) {
        /**
         * Update a templates prototype
         */
        let moduleName = eaPath.replace(/[^/]*/, "");
        let mod = await System.import(eaPath);
        let defaultClass = mod.default;
        if (defaultClass) {
          console.log("update template prototype: " + moduleName);
          components.updatePrototype(defaultClass, moduleName);
        }

        let templateURL = eaPath.replace(/\.js$/, ".html");
        try {
          console.log("[templates] update template " + templateURL);
          setTimeout(() => {
            lively.files.loadFile(templateURL).then(sourceCode => lively.updateTemplate(sourceCode, templateURL));
          }, 100);
        } catch (e) {
          lively.notify("[templates] could not update template " + templateURL, "" + e);
        }
      }
    }

    // console.log("[reloadModule] updated components ",(performance.now() - start) + `ms` ) 
    // console.profileEnd('reloadModule')

    return mod;
  }

  static loadJavaScriptThroughDOM(name, src, force = false, type = "text/javascript") {
    return new Promise(resolve => {
      var scriptNode = document.querySelector("#" + name);
      if (!force && scriptNode) {
        resolve // nothing to be done here
        ();return;
      }

      if (scriptNode) {
        scriptNode.remove();
      }
      var script = document.createElement("script");
      script.id = name;
      script.charset = "utf-8";
      script.type = type;
      if (force) {
        src = src + ("?" + Date.now());
      }
      script.src = src;
      script.onload = function () {
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  static loadCSSThroughDOM(name, href, force) {
    return new Promise(resolve => {
      var linkNode = document.querySelector("#" + name);
      if (linkNode) {
        linkNode.remove();
      }
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.id = name;
      link.charset = "utf-8";
      link.type = "text/css";
      if (force) {
        href += "?" + Date.now();
      }
      link.href = href;
      link.onload = function () {
        resolve();
      };
      document.head.appendChild(link);
    });
  }
  static async fillTemplateStyle(element, url) {
    var url = lively.paths.normalizeURL(url);
    try {
      var css = await fetch("cached:" + url).then(r => r.text())
    } catch (e) {
      console.warn("WARNING cached fetch failed, fillTemplateStyle ", e)
    }
    if(!css) {
        try {
          css = await fetch(url).then(r => r.text())
        } catch(e) {
          console.error("ERROR fetch  failed n ifillTemplateStyle ", e)
          return
        }
    }
    
    // console.log("[lively] fill css " + cssURL + "," + Math.round(css.length / 1000) + "kb" )
    // so we find it again for updating... data-src is relative
    element.setAttribute("data-url", url);
    element.innerHTML = css;
  }

  static async fillTemplateStyles(root, debugInfo, baseURL = lively4url + '/') {
    // there seems to be no <link ..> tag allowed to reference css inside of templates #Jens

    // var start = performance.now()
    var promises = [];
    const lively4dir = lively4url + '/';
    function normalize(cssURL) {
      let url;
      if (cssURL[0] === '/') {
        url = new URL(cssURL.substring(1), lively4dir);
      } else if (cssURL[0] === '.') {
        url = new URL(cssURL, baseURL);
      } else {
        url = new URL(cssURL);
      }

      if (!url) {
        return '';
      }
      return url.toString();
    }

    root.querySelectorAll("style").forEach(ea => {
      const cssURL = ea.getAttribute("data-src");
      if (cssURL) {
        const normalizedURL = normalize(cssURL);
        promises.push(this.fillTemplateStyle(ea, normalizedURL));
      }
    });
    await Promise.all(promises
    // console.log("load fillTemplateStyles "  + (performance.now() - start) +"ms :"+ debugInfo);
    );
  }

  static showError(error) {
    this.handleError(error);
  }

  static async handleError(error) {
    lively.LastError = error;
    try {
      if (!error) return; // hmm... this is currious...
      if (error.message.match("Maximum call stack size exceeded")) {
        console.log(error);
        return;
      }
      if (document.querySelector("lively-console")) {
        console.log(error);
      } else {
        console.error('[error] ', error, error.stack);
        if (!window.__karma__) {
          await lively.notify("Error: ", error, 10, () => {
            this.showErrorWindow(error);
          }, "red");
        }
      }
    } catch (e) {
      console.log("An error happend while handling and error: " + e);
    }
  }
  
  static showErrorWindow(error) {
    lively.openComponentInWindow("lively-error").then(comp => {
      comp.stack = error.stack;
      comp.parentElement.setAttribute("title", "" + error.message);
      comp.style.height = "max-content";
      var bounds = comp.getBoundingClientRect();
      comp.parentElement.style.height = bounds.height + 20 + "px";
      comp.parentElement.style.width = bounds.width + "px";
    });
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
      window.onerror = function (message, source, lineno, colno, error) {
        lively.handleError(error);
      };
    }
    // do it just once
    if (!window.unhandledRejectionEventLister) {
      window.unhandledRejectionEventLister = function (evt) {
        lively.handleError(evt.reason);
      };
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
      document.body.querySelectorAll("img").forEach(ea => ea.src = "" + ea.src // #Hack #swx RPC messages...
      );
    }, 12 * 1000);
  }

  static async exportModules() {
    exportmodules.forEach(name => lively[name] = eval(name)); // oh... this seems uglier than expectednit

    await System.import("src/client/clipboard.js").then(m => {
      lively.clipboard = m.default;
    } // depends on me
    );await System.import("src/client/graffle.js" // depends on me
    );await System.import("src/client/draganddrop.js" // depends on me


    );await System.import("src/client/poid.js" // depends on me
    // #TODO should we load fetch protocols lazy?
    );await System.import("demos/plex/plex-scheme.js" // depends on me
    );await System.import("src/client/protocols/todoist.js");
    await System.import("src/client/protocols/wikipedia.js");
    await System.import("src/client/protocols/tmp.js");
    await System.import("src/client/protocols/bib.js");
    await System.import("src/client/protocols/author.js");
    await System.import("src/client/protocols/keyword.js");
    // await System.import("src/client/protocols/academic.js");
    await System.import("src/client/protocols/scholar.js");
    
    await System.import("src/client/protocols/microsoft.js");

    await System.import("src/client/files-caches.js" // depends on me
    );
  }

  // #Deprecated who does/dir use this code and what for
  static asUL(anyList) {
    var ul = document.createElement("ul");
    ul.style.minWidth = "50px";
    ul.style.minHeight = "50px";
    ul.style.backgroundColor = "gray";
    anyList.forEach(ea => {
      var item = document.createElement("li");
      item.textContent = ea;
      item.value = ea;
      ul.appendChild(item);
    });
    return ul;
  }

  static openWorkspace(string, pos, worldContext) {
    string = string || "";
    var name = "lively-code-mirror";
    return lively.openComponentInWindow(name, null, pt(700, 400), worldContext).then(comp => {
      comp.mode = "text/jsx";
      comp.value = string;
      comp.setAttribute("overscroll", "contain");
      comp.style.height = "100%";
      var container = comp.parentElement;
      if (pos) lively.setClientPosition(container, pos);
      container.setAttribute("title", "Workspace");
      comp.focus();
      return comp;
    });
  }

  static openInspector(object, pos, str, worldContext) {
    return lively.openComponentInWindow("lively-inspector", pos, pt(400, 500), worldContext).then(inspector => {
      inspector.windowTitle = "Inspect: " + str;
      inspector.inspect(object);
      return inspector;
    });
  }

  static ensureSpawnArea() {
    var spawnId = "livelySpawnArea";
    var spawn = document.body.querySelector("#" + spawnId);
    if (!spawn) {
      spawn = document.createElement("div");
      spawn.id = spawnId;
      spawn.style.display = "none";
      spawn.isMetaNode = true;
      document.body.appendChild(spawn);
    }
    return spawn;
  }

  static async create(name = "lively-table", parent = this.ensureSpawnArea()) {

    // =this.ensureSpawnArea()

    var element = document.createElement(name
    // #TODO normal elements will not resolve this promoise #BUG
    );if (name.match("-")) {
      await lively.components.openIn(parent, element);
    } else {
      parent.appendChild(element);
    }
    // if (document.activeElement) {
    //   var pos = lively.getClientBounds(document.activeElement).bottomLeft()
    //   lively.setClientPosition(element, pos)
    // }
    return element;
  }

  /*MD # Geometry MD*/
  static pt(x, y) {
    return pt(x, y);
  }
  
  static rect(...args) {
    return rect(...args);
  }

  static getExtent(node) {
    if (node === window) {
      return pt(window.innerWidth, window.innerHeight);
    }
    // using the getBoundingClientRect produces the wrong extent
    var style = getComputedStyle(node);
    if (!style) {
      return pt(0, 0);
    }
    return pt(parseFloat(style.width), parseFloat(style.height));
  }

  static setExtent(node, extent) {
    // node.style.width = '' + extent.x + 'px';
    // node.style.height = '' + extent.y + 'px';
    // node.dispatchEvent(new CustomEvent("extent-changed"))
    this.setWidth(node, extent.x, true);
    this.setHeight(node, extent.y);
  }

  static setWidth(node, x, noevent) {
    node.style.width = '' + x + 'px';
    if (!noevent) node.dispatchEvent(new CustomEvent("extent-changed"));
  }

  static setHeight(node, y, noevent) {
    node.style.height = '' + y + 'px';
    if (!noevent) node.dispatchEvent(new CustomEvent("extent-changed"));
  }

  // #important
  static setPosition(obj, point, mode, animateDuration) {
    if (obj instanceof SVGElement && !(obj instanceof SVGSVGElement)) {
      if (obj.transform && obj.transform.baseVal) {
        // get the position of an svg element
        var t = obj.transform.baseVal.consolidate();
        if (t) {
          t.setTranslate(point.x, point.y);
        } else {
          obj.setAttribute("transform", `translate(${point.x}, ${point.y})`);
        }
      } else {
        throw new Error("path has no transformation");
      }
    } else {
      var old = lively.getPosition(obj
      // normal DOM Element
      );obj.style.position = mode || "absolute";
      obj.style.left = "" + point.x + "px";
      obj.style.top = "" + point.y + "px";
      obj.dispatchEvent(new CustomEvent("position-changed"));

      if (animateDuration) {
        obj.animate([{ left: old.x + "px", top: old.y + "px" }, { left: point.x + "px", top: point.y + "px" }], {
          duration: animateDuration
        });
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
        var t = obj.transform.baseVal.consolidate();
        if (!t) return pt(0, 0);
        var m = t.matrix;
        var p = new DOMPoint(0, 0);
        var r = p.matrixTransform(m);
        if (!r || !r.x) return pt(0, 0);
        return pt(r.x / r.w, r.y / r.w);
      } else {
        throw new Error("path has no transformation");
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
    if (obj instanceof KeyboardEvent) {
      return lively.getClientPosition(obj.target);
    }
    if (!pos) return undefined
    
    // #Fallback .... and compute the style
    if (isNaN(pos.x) || isNaN(pos.y)) {
      var style = getComputedStyle(obj);
      pos = pt(parseFloat(style.left), parseFloat(style.top));
    }
    return pos;
  }

  static getClientPosition(obj) {
    if (obj instanceof UIEvent) {
      // keyboard events don't have a position.
      // so we take the position of the target element.
      if (obj instanceof KeyboardEvent) {
        return lively.getClientPosition(obj.target);
      }
      
      if (obj.clientX !== undefined && obj.clientY !== undefined) {
        return pt(obj.clientX, obj.clientY);
      }

      throw new Error(`unsupported UIEvent type ${obj.constructor.name}`)
    }
    
    // WARNING: this method works pretty well but does not consider any CSS transformation
    if (!obj.getBoundingClientRect) {
      return pt(0, 0);
    }
    const bounds = obj.getBoundingClientRect();
    return pt(bounds.left, bounds.top);
  }
  
  static setClientPosition(node, pos) {
    lively.setPosition(node, lively.pt(0, 0));
    var delta = pos.subPt(lively.getClientPosition(node));
    lively.moveBy(node, delta);
  }
  
  static getPagePosition(obj) {
    if (obj instanceof UIEvent) {
      // keyboard events don't have a position.
      // so we take the position of the target element.
      if (obj instanceof KeyboardEvent) {
        return lively.getPagePosition(obj.target);
      }
      
      if (obj.pageX !== undefined && obj.pageY !== undefined) {
        return pt(obj.pageX, obj.pageY);
      }

      throw new Error(`unsupported UIEvent type ${obj.constructor.name}`)
    }
    
    // WARNING: this method works pretty well but does not consider any CSS transformation
    if (!obj.getBoundingClientRect) {
      lively.warn('no rect')
      return pt(0, 0);
    }
    
    const clientBounds = obj.getBoundingClientRect();
    return lively.pageOffset().addXY(clientBounds.left, clientBounds.top)
  }
  
  static setPagePosition(node, pos) {
    lively.setPosition(node, lively.pt(0, 0));
    const delta = pos.subPt(lively.getPagePosition(node));
    lively.moveBy(node, delta);
  }

  // #helper
  static clientPosToPage(pos) {
    return pos.addPt(lively.pageOffset())
  }
  
  // #helper
  static pagePosToClient(pos) {
    return pos.subPt(lively.pageOffset())
  }
  
  // #helper
  static pageOffset() {
    return lively.pt(window.pageXOffset, window.pageYOffset);
  }

  static getClientCenter(node) {
    return this.getClientPosition(node).addPt(this.getExtent(node).scaleBy(0.5));
  }

  static setClientCenter(node, pos) {
    this.setClientPosition(node, pos.subPt(this.getExtent(node).scaleBy(0.5)));
  }

  /**
   * vertical
   * t - top
   * m - middle
   * b - bottom
   * horizontal
   * l - left
   * c - center
   * r - right
   */
  static _getScalingFromDescription(where) {
    if (where.length !== 2) {
      throw new Error(`anchor description should be 2 characters long, but was ${where}`)
    }
    const [vertical, horizontal] = where
    // if (!['t', 'm', 'b'])
    const vScale = {
      t: 0, m: 0.5, b: 1
    }[vertical]
    const hScale = {
      l: 0, c: 0.5, r: 1
    }[horizontal]
    if (vScale === undefined) {
      throw new Error(`vertical anchor should be one of 't', 'm', 'b', but was '${where}'`)
    }
    if (hScale === undefined) {
      throw new Error(`vertical anchor should be one of 'l', 'c', 'r', but was '${where}'`)
    }
    return pt(hScale, vScale);
  }

  static getClientPositionAt(node, where = 'tl') {
    return this.getClientPosition(node).addPt(this.getExtent(node).scaleByPt(this._getScalingFromDescription(where)));
  }

  static setClientPositionAt(node, pos, where = 'tl') {
    this.setClientPosition(node, pos.subPt(this.getExtent(node).scaleByPt(this._getScalingFromDescription(where))));
  }

  static moveBy(node, delta, animateDuration) {
    this.setPosition(node, this.getPosition(node).addPt(delta), undefined, animateDuration);
  }

  static getBounds(node) {
    var pos = lively.getPosition(node);
    var extent = lively.getExtent(node);
    return rect(pos, pos.addPt(extent));
  }

  static setBounds(node, bounds) {
    lively.setPosition(node, bounds.topLeft());
    lively.setExtent(node, bounds.extent());
  }

  static getClientBounds(node) {
    var bounds = node.getBoundingClientRect();
    if (!bounds) {
      return rect(0, 0, 0, 0);
    }
    return rect(bounds.left, bounds.top, bounds.width, bounds.height);
  }
  
  static getPageBounds(node) {
    var bounds = node.getBoundingClientRect();
    if (!bounds) {
      return rect(0, 0, 0, 0);
    }
    const offset = lively.pageOffset();
    return rect(bounds.left + offset.x, bounds.top + offset.y, bounds.width, bounds.height);
  }
  
  static centerIn(element, outerElement) {
    const bounds = lively.getClientBounds(element);
    const outerBounds = lively.getClientBounds(outerElement);
    bounds.centerIn(outerBounds)
    lively.setClientPosition(element, bounds.topLeft());
  }

  // compute the global bounds of an element and all absolute positioned elements
  static getTotalClientBounds(element) {

    var all = Array.from(element.querySelectorAll("*")).filter(ea => ea.style.position == "absolute" || ea.style.position == "relative").concat([element]).map(ea => lively.getClientBounds(ea));
    var max;
    var min;
    all.forEach(ea => {
      var topLeft = ea.topLeft();
      var bottomRight = ea.bottomRight
      // console.log("ea " + topLeft + " " + bottomRight)
      ();min = topLeft.minPt(min || topLeft);
      max = bottomRight.maxPt(max || bottomRight);
    }
    // console.log("min " + min + " max " + max)
    );return rect(min, max);
  }

  static getScroll() {
    return pt(document.scrollingElement.scrollLeft || 0, document.scrollingElement.scrollTop || 0);
  }
  
  /*MD # --- MD*/
  // #Depricated
  static openFile(url) {
    if (url.hostname == "lively4") {
      var container = document.querySelector('lively-container');
      if (container) {
        container.followPath(url.pathname);
      } else {
        console.log("fall back on editor: " + url);
        this.editFile(url);
      }
    } else {
      this.editFile(url);
    }
  }

  static editFile(url) {
    var editor = document.createElement("lively-editor");
    components.openInWindow(editor).then(container => {
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
    if (HaloService && (HaloService.areHalosActive() || HaloService.halosHidden && Date.now() - HaloService.halosHidden < 500)) {
      target = that;
    }
    lively.contextmenu.openIn(container, evt, target, worldContext);
  }

  static nativeNotify(title, text, timeout, cb) {
    if (!this.notifications) this.notifications = [];
    this.notifications.push({ title: title, text: text, cb: cb, time: Date.now() });

    if (Notification.permission !== "granted") Notification.requestPermission();

    var time = Date.now();

    // check if the third last notification was already one second ago
    if (this.notifications.length > 5 && Date.now() - this.notifications[this.notifications.length - 3].time < 1000) {
      return console.log("SILENT NOTE: " + title + " (" + text + ")");
    }

    console.log("NOTE: " + title + " (" + text + ")");

    var notification = new Notification(title || "", {
      icon: 'https://www.lively-kernel.org/media/livelylogo-small.png',
      body: text || ""
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
            lively.openWorkspace(titleOrOptions.details).then(comp => {
              comp.parentElement.setAttribute("title", title);
              comp.unsavedChanges = () => false; // close workspace without asking
            });
          };
        }
      }

      var notificationList = document.querySelector("lively-notification-list");
      if (!notificationList) {
        notificationList = await lively.create("lively-notification-list", document.body);
        if (notificationList && notificationList.addNotification) {
          notificationList.addNotification(title, text, timeout, cb, color);
        }
      } else {
        var duplicateNotification = Array.from(document.querySelectorAll("lively-notification")).find(ea => "" + ea.title === "" + title && "" + ea.message === "" + text);
        if (duplicateNotification) {
          duplicateNotification.counter++;
          duplicateNotification.render();
        } else {
          if (notificationList && notificationList.addNotification) {
            notificationList.addNotification(title, text, timeout, cb, color);
          }
        }
      }
    } catch (e) {
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
    debugger;
    lively.notify(title, text, timeout, cb, 'red');
  }

  static async ensureHand() {
    var hand = lively.hand;
    if (!hand) {
      hand = await lively.create("lively-hand", document.body);
      hand.style.visibility = "hidden";
    }
    return hand;
  }

  // we do it lazy, because a hand can be broken or gone missing...
  static get hand() {
    return document.body.querySelector(":scope > lively-hand");
  }

  static get selection() {
    return Selection.current;
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

  static initializeEventHooks() {
    events.installHooks();
  }

  // lively.ini
  static initializeEvents(doc) {
    doc = doc || document;
    this.addEventListener('lively', doc, 'mousedown', evt => lively.onMouseDown(evt), true); // capture...
    this.addEventListener('lively', doc, 'contextmenu', evt => lively.onContextMenu(evt), false);
    this.addEventListener('lively', doc, 'click', function (evt) {
      lively.hideContextMenu(evt);
    }, false);
    this.addEventListener('lively', doc, 'keydown', function (evt) {
      lively.keys.handle(evt);
    }, false);

    this.addEventListener('lively', doc, 'keyup', function (evt) {
      lively.keys.onKeyUp(evt);
    }, false);
  }

  static async initializeDocument(doc, loadedAsExtension, loadContainer) {

    this.loadedAsExtension = loadedAsExtension;

    await modulesExported;

    this.loadedAsExtension = loadedAsExtension;

    console.log("Lively4 initializeDocument");
    // persistence.disable();

    await lively.loadCSSThroughDOM("font-awesome", lively4url + "/src/external/font-awesome/css/font-awesome.min.css");

    lively.components.loadByName("lively-notification");
    lively.components.loadByName("lively-notification-list");

    this.initializeEvents(doc);
    this.initializeHalos();

    lively.addEventListener("preventDragCopy", document, "dragstart", evt => {
      if (evt.composedPath()[0] === document.body) {
        evt.stopPropagation();
        evt.preventDefault();
      }
    });

    console.log(window.lively4stamp, "load local lively content "
    // #RACE #TODO ... 

    // yes, we want also to change style of external websites...
    );await lively.loadCSSThroughDOM("lively4", lively4url + "/src/client/lively.css");

    await persistence.current.loadLivelyContentForURL();
    preferences.loadPreferences();
    if (preferences.get('TipOfTheDay')) {
      const existingContainers = Array.from(document.body.querySelectorAll('lively-code-tip'));
      if (existingContainers.length !== 0) {
        existingContainers.map(tip => tip.parentElement.remove());
      }
      lively.openComponentInWindow("lively-code-tip", undefined, lively.pt(800, 200));
    }
    // here, we should scrap any existing (lazyly created) preference, there should only be one

    await lively.ensureHand();

    // lively.selection;

    // #Hack... just to be on the save side #ACM
    // where to put side specific adapations... cannot be overriden by CSS? #TODO
    document.body.style.textAlign = "left";

    if (loadedAsExtension) {
      lively.notify("Lively4 extension loaded!", "  CTRL+LeftClick  ... open halo\n" + "  CTRL+RightClick ... open menu");
    } else {

      // only scroll thrugh CTRL+drag #TODO what does UX say?
      // document.body.style.overflow = "hidden"

      var titleTag = document.querySelector("title");
      if (!titleTag) {
        titleTag = document.createElement("title");
        titleTag.textContent = "Lively 4";
        document.head.appendChild(titleTag);
      }

      document.body.style.backgroundColor = "rgb(240,240,240)";
      ViewNav.enable(document.body);

      this.loadContainer = loadContainer; // remember....
      
      if (lively.preferences.getURLParameter("load") || lively.preferences.getURLParameter("edit")) {
         this.showMainContainer()
      }
    }

    if (this.deferredUpdateScroll) {
      document.scrollingElement.scrollLeft = this.deferredUpdateScroll.x;
      document.scrollingElement.scrollTop = this.deferredUpdateScroll.y;
      delete this.deferredUpdateScroll;
    }

    console.log("FINISHED Loading in " + ((performance.now() - lively4performance.start) / 1000).toFixed(2) + "s");
    console.log(window.lively4stamp, "lively persistence start ");
  }

  static async showMainContainer() {
    var container = document.querySelector('#main-content');
    if (!container) {
      var w = await lively.create("lively-window");
      document.body.appendChild(w);
      container = await lively.create("lively-container");
      w.appendChild(container);
      container.becomeMainContainer();
      
      w.focus()
    }
    return container;
  }

  static initializeHalos() {
    if (!window.lively) {
      return setTimeout(() => {
        this.initializeHalos();
      }, 100);
    }
    if (!document.body.querySelector('lively-halo')) {
      lively.components.openInBody(document.createElement('lively-halo')).then(comp => {
        comp.setAttribute('data-lively4-donotpersist', 'all');
      });
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
  static async updateTemplate(html, url) {
    var tagName = await components.reloadComponent(html, url);
    if (!tagName) return;

    // conservative approach:
    // let objectToMigrate = Array.from(document.body.querySelectorAll(tagName));
    
    function allElementsThat(condition) {
      const filteredElements = []
      const allElements = lively.allElements(true)
      
      for(let ea of allElements) {
        if (condition(ea)) {
          filteredElements.push(ea)
        }
      }
      
      return filteredElements
    }
    
    // realy take every element yout can find, even if it might break things #Experimental
    const objectsToMigrate = allElementsThat(ea => ea.localName == tagName)
    
    if (lively.halo) {
      objectsToMigrate.push(...lively.halo.shadowRoot.querySelectorAll(tagName));
    }
    objectsToMigrate.forEach(oldInstance => {
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
        if (ea) {
          // there are "undefined" elemented in childNodes... sometimes #TODO
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
          inspector.inspect(newInstance);
        }
      });
    });

    // new (old) strategy... don't throw away the instance... just update them inplace?
    const uppercaseTagName = tagName.toUpperCase();
    allElementsThat(ea => ea.tagName === uppercaseTagName).forEach(ea => {
      if (ea.livelyUpdate) {
        try {
          ea.livelyUpdate();
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  static showInfoBox(target) {
    var info = document.createElement("div");
    info.classList.add("draginfo");
    info.target = target;
    info.isMetaNode = true;
    info.style.width = "300px";
    info.style['pointer-events'] = "none";
    info.setAttribute("data-is-meta", "true");
    info.style.color = "darkblue";
    info.update = function () {
      lively.setClientPosition(this, lively.getClientPosition(this.target).subPt(pt(0, 20)));
    };
    info.style['z-index'] = 10000;
    info.update();
    lively.addEventListener("ShowInfoBox", target, "position-changed", () => {
      info.update();
    });
    info.stop = function () {
      this.remove();
      lively.removeEventListener("ShowInfoBox", target, "position-changed");
    };

    document.body.appendChild(info);
    return info;
  }

  static showPoint(point, removeAfterTime) {
    return this.showRect(point, pt(5, 5), removeAfterTime);
  }

  static showEvent(evt, removeAfterTime) {
    var r = lively.showPoint(pt(evt.clientX, evt.clientY), removeAfterTime);
    r.style.backgroundColor = "rgba(100,100,255,05)";
    return r;
  }
  
  static get highlights() {
    return document.body.querySelectorAll(".lively-highlight")
  }

  static removeHighlights() {
    return this.highlights.forEach( ea => ea.remove())
  }
  
  static showRect(point, extent, removeAfterTime = 3000) {
    // check for alternative args
    if (point && !extent) {
      extent = point.extent();
      point = point.topLeft();
    }

    if (!point || !point.subPt) return;
    var comp = <div class="showrect lively-highlight"></div>;
    comp.style['pointer-events'] = "none";
    comp.style.width = extent.x + "px";
    comp.style.height = extent.y + "px";
    comp.style.padding = "1px";
    comp.style.backgroundColor = 'rgba(255,0,0,0.5)';
    comp.style.zIndex = 1000;
    comp.isMetaNode = true;

    var bodyBounds = document.body.getBoundingClientRect();

    document.body.appendChild(comp);
    lively.setPosition(comp, point.subPt(pt(bodyBounds.left, bodyBounds.top)));
    comp.setAttribute("data-is-meta", "true");

    if (removeAfterTime) {
      setTimeout(() => comp.remove(), removeAfterTime);
    }
    // ea.getBoundingClientRect
    return comp;
  }

  static showPath(path, color, printArrow, timeoutOrFalse = 3000) {
    color = color || "red";
    var comp = this.createPath(path, color, printArrow);
    document.body.appendChild(comp);
    comp.style.zIndex = 1000;
    lively.setClientPosition(comp, pt(0, 0));
    comp.setAttribute("data-is-meta", "true");
    comp.isMetaNode = true;
    comp.style.pointerEvents = "none";
    comp.style.touchAction = "none";
    if (timeoutOrFalse) setTimeout(() => comp.remove(), timeoutOrFalse);
    return comp;
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
        overflow: visible;`;

    var dpath = path.map((ea, i) => (i == 0 ? "M " : "L ") + ea.x + " " + ea.y).join(" ");
    var defs = `      <defs>
          <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="2" refY="6"
                 orient="auto">
              <path d="M2,2 L2,11 L10,6 L2,2" style="fill: ${color};" />
          </marker>
       </defs>`;

    var last = _.last(path);

    comp.innerHTML = defs + `<path id="path" fill="none" stroke='${color}' d='${dpath}' 
      style='${printArrow ? 'marker-end: url(#markerArrow);' : ""}'></path>` + `<g font-size="12" font-family="sans-serif" fill="${color}" stroke="none"
  text-anchor="middle">
    <text x="${last.x}" y="${last.y}" dx="10">${label ? label : ""}</text>
  </g>`;

    return comp;
  }

  static async showSource(object, evt) {
    if (object instanceof HTMLElement) {
      if (!object.localName.match(/-/)) {
        return lively.notify("Could not show source for native element");
      }
      lively.openBrowser((await this.components.searchTemplateFilename(object.localName + ".html")), true);
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }

  static async showClassSource(object, evt) {
    if (object instanceof HTMLElement) {
      if (!object.localName.match(/-/)) {
        return lively.notify("Could not show source for native element");
      }
      let templateFile = await this.components.searchTemplateFilename(object.localName + ".html"),
          source = await fetch(templateFile).then(r => r.text()),
          template = lively.html.parseHTML(source).find(ea => ea.tagName == "TEMPLATE"),
          moduleURL = await this.components.searchTemplateFilename(object.localName + ".js");
      lively.openBrowser(moduleURL, true);
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }

  static showElement(elem, timeout = 3000) {
    if (!elem || !elem.getBoundingClientRect) return;
    var comp = <div class="lively-highlight"></div>
    var bounds = elem.getBoundingClientRect();
    var bodyBounds = document.body.getBoundingClientRect();
    var offset = pt(bodyBounds.left, bodyBounds.top);
    var pos = pt(bounds.left, bounds.top).subPt(offset);

    comp.style.width = bounds.width + "px";
    comp.style.height = bounds.height + "px";
    comp.style['pointer-events'] = "none";
    // comp.style.height = "0px"
    comp.style["z-index"] = 1000;
    comp.style.border = "1px solid red";
    comp.isMetaNode = true;
    document.body.appendChild(comp);
    lively.setPosition(comp, pos);
    comp.setAttribute("data-is-meta", "true");

    comp.innerHTML = "<pre data-is-meta='true' style='position: relative; top: -8px; width: 200px; background: rgba(255,255,255,0.8); color: red; font-size: 8pt'>" + elem.tagName + ": " + elem.id + "\n" + elem.getAttribute("class") + "\n" + "</pre>";

    if (timeout) setTimeout(() => comp.remove(), timeout);
    return comp;
  }

  static get elementPrinter() {
    return new PrinterBuilder();
  }

  // highlight and show log info on element
  static showLog(elem, log = "", timeout) {

    var lastDebugLayer = debugLogHightlights.get(elem);
    if (!lastDebugLayer || !lastDebugLayer.parentElement) {
      var debugText = "";
    } else {
      debugText = lastDebugLayer.querySelector("pre").textContent;
    }
    var debugLayer = lively.showElement(elem, timeout);
    debugLogHightlights.set(elem, debugLayer);
    debugLayer.querySelector("pre").textContent = debugText + "\n" + log;
  }

  static async showProgress(label) {
    var progressContainer = document.querySelector("#progressContainer");
    if (!progressContainer) {
      progressContainer = document.createElement("div");
      progressContainer.id = "progressContainer";
      progressContainer.isMetaNode = true;
      // progressContainer.style['pointer-events'] = "none";
      progressContainer.style.zIndex = 1000;
      document.body.appendChild(progressContainer);
      lively.setClientPosition(progressContainer, pt(50, 50));
    }

    var progress = await (<lively-progress></lively-progress>);
    progressContainer.append(progress);
    lively.setExtent(progress, pt(300, 20));
    progress.textContent = label;
    return progress;
  }

  static allProperties(obj, result) {
    result = result || {};
    Object.getOwnPropertyNames(obj).forEach(name => {
      result[name] = obj.constructor.name;
    });
    if (obj.__proto__) {
      lively.allProperties(obj.__proto__, result);
    }
    return result;
  }

  static templateClassNameToTemplateName(className) {
    return className.replace(/[A-Z]/g, ea => "-" + ea.toLowerCase()).replace(/^-/, "");
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
      var url = await this.components.searchTemplateFilename(baseName + ".js");
      if (url) {
        // console.log("Components: load module " + url)
        var module = await System.import(url);
        proto = Object.create(module.prototype || module.default.prototype);
      } else {
        throw new Error("Components: could not find module for " + baseName);
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
    this.eventListeners.push({ target: target, type: type, listener: listener, domain: domain, options: options });
    target.addEventListener(type, listener, options);
  }

  static removeEventListener(domain, target, type, listener) {
    this.eventListeners = this.eventListeners.filter(ea => {
      if ((!target || ea.target === target) && (!type || ea.type == type) && (!listener || ea.listener === listener) && (!domain || ea.domain == domain)) {
        // actually removing the event listener
        // console.log("removeEventListener", ea.target, ea.type, ea.listener)
        ea.target.removeEventListener(ea.type, ea.listener, ea.options);
        return false;
      } else {
        return true;
      }
    });
  }

  static openSearchWidget(text, worldContext, searchContext = document.body) {
    if (lively.preferences.get("FileIndex")) {
      this.openComponentInWindow("lively-index-search").then(comp => {
        var pattern = text.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
        comp.search(pattern);
        lively.setExtent(comp.parentElement, pt(1000, 700));
        comp.focus();
      });
    } else {
      var container = lively.query(searchContext, "lively-container");
      this.openComponentInWindow("lively-search", undefined, undefined, worldContext).then(comp => {
        if (container) {
          // search in the current repository
          var url = container.getURL().toString();
          var base = lively4url.replace(/[^/]*$/, "");
          if (url.match(base)) {
            var repo = url.replace(base, "").replace(/\/.*$/, "");
            comp.searchRoot = repo;
          }
        }
        comp.searchFile(text);
        comp.focus();
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
    console.log('hide search widget');
    document.body.querySelectorAll("lively-search").forEach(ea => ea.parentElement.remove());
  }

  static openIssue(number) {
    // #TODO customize or derive github issue url, making it context cependend
    window.open("https://github.com/LivelyKernel/lively4-core/issues/" + number);
  }

  static openHelpWindow(text) {
    this.openComponentInWindow("lively-help").then(comp => {
      comp.parentElement.style.width = "850px";
      comp.parentElement.style.height = "600px";
      comp.getHelp(text);
    });
  }

  static async openComponentInWindow(name, globalPos, extent, worldContext, immediate = () => {}) {
    worldContext = worldContext || document.body;

    var w = await lively.create("lively-window");
    if (extent) {
      lively.setExtent(w, extent);
    }
    if (!globalPos) {
      let pos = lively.findPositionForWindow(worldContext);
      globalPos = lively.getClientPosition(worldContext).addPt(pos);
    }
    
    w.focus()

    return components.openIn(worldContext, w, true).then(w => {
      lively.setClientPosition(w, globalPos);

      const element = document.createElement(name);
      immediate(element)

      return components.openIn(w, element).then(comp => {
        components.ensureWindowTitle(comp, w);
        return comp;
      });
    });
  }

  static openInWindowSync(element, globalPos, extent) {
    const w = document.createElement("lively-window");
    document.body.append(w)
    w.ensureInitialized()
    
    if (extent) {
      lively.setExtent(w, extent);
    }

    if (!globalPos) {
      const pos = lively.findPositionForWindow(document.body);
      globalPos = lively.getClientPosition(document.body).addPt(pos);
    }
    lively.setClientPosition(w, globalPos);

    w.append(element)
    components.ensureWindowTitle(element, w);
    
    return w
  }

  static findPositionForWindow(worldContext) {
    // this gets complicated: find a free spot starting top left going down right
    var windows = Array.from(worldContext.querySelectorAll(":scope > lively-window"));
    var offset = 20;
    var pos;
    var topLeft = pt(50, 50);

    for (var i = 0; !pos; i++) {
      let p1 = pt(i * offset, i * offset);
      let p2 = pt((i + 1) * offset, (i + 1) * offset);
      var found = windows.find(ea => {
        // var ea = that; var i =0
        var eaPos = lively.getClientPosition(ea).subPt(topLeft
        // check if there is a window in direction bottom right
        );return (p1.lessPt(eaPos) || p1.eqPt(eaPos)) && eaPos.lessPt(p2);
      });
      // no window is found... so place the next there
      if (!found) pos = topLeft.addPt(pt(i * offset, i * offset));
    }
    return pos.subPt(lively.getClientPosition(worldContext));
  }

  // lively.openBrowser("https://lively4/etc/mounts", true, "Github")


  static async openBrowser(url, edit, patternOrPosition, replaceExisting, worldContext, useExisting) {
    worldContext = worldContext || document.body;
    
    if (patternOrPosition && patternOrPosition.start) {
      var locationObject = patternOrPosition;
    } else if (patternOrPosition && patternOrPosition.line) {
      var lineAndColumn = patternOrPosition;
    } else {
      var pattern = patternOrPosition;
    }

    if (!url || !url.match(/^[a-z]+:/)) url = lively4url;
    var livelyContainer;
    var containerPromise;
    let existingFound = false;
    if (replaceExisting) {
      livelyContainer = Array.from(worldContext.querySelectorAll("lively-container")).find(ea => ea.isSearchBrowser);
    } else if (useExisting) {
      const containers = Array.from(worldContext.querySelectorAll('lively-container')).filter(c => c.getAttribute('src') === url);
      livelyContainer = containers.find(c => c.getAttribute('mode') === 'edit' === edit);
      existingFound = !!livelyContainer;
    }

    var lastWindow = _.first(Array.from(worldContext.querySelectorAll("lively-window")).filter(ea => ea.childNodes[0] && ea.childNodes[0].isSearchBrowser));

    containerPromise = livelyContainer ? Promise.resolve(livelyContainer) : lively.openComponentInWindow("lively-container", undefined, undefined, worldContext);

    return containerPromise.then(comp => {
      if (existingFound) {
        if(comp.parentElement.isMinimized()) {
          comp.parentElement.toggleMinimize();
        }
        comp.parentElement.focus();
        comp.focus();
        return;
      }
      livelyContainer = comp;
      livelyContainer.hideNavbar();
      comp.parentElement.style.width = "950px";
      comp.parentElement.style.height = "800px";

      if (lastWindow) {
        lively.setPosition(comp.parentElement, lively.getPosition(lastWindow).addPt(pt(25, 25)));
      }

      if (edit) comp.setAttribute("mode", "edit");
      if (pattern) {
        comp.isSearchBrowser = true;
        comp.hideNavbar();
      }
      comp.focus();
      return comp.followPath(url);
    }).then(async () => {
      if (edit) {
        await livelyContainer.asyncGet("#editor").then(async livelyEditor => {
          var codeMirror = await livelyEditor.awaitEditor();

          if (pattern) {
            livelyEditor.find(pattern);
          } else if (lineAndColumn) {

            codeMirror.setSelection(
              { line: lineAndColumn.line, ch: lineAndColumn.column }, 
              { line: lineAndColumn.line, ch: lineAndColumn.column + (lineAndColumn.selection ? +lineAndColumn.selection.length : 0) }
            // #TODO ...
            // ace.gotoLine(lineAndColumn.line, lineAndColumn.column)
            );
          } else if (locationObject) {
            codeMirror.setSelection(locationObject.start, locationObject.end);
          }
          codeMirror.focus();
          codeMirror.scrollIntoView(codeMirror.getCursor(), 200);
        });
      }
      return livelyContainer;
    });
  }

  static openDebugger() {
    if (!window.lively4ChromeDebugger) {
      return lively.notify("Please install Lively4Chrome Extension for debugger support.");
    }
    window.lively4ChromeDebugger.getCurrentDebuggingTarget().then(res => {
      // Use chrome.window.create to create an independent window, window.open does not work
      window.lively4ChromeDebugger.createWindow({
        url: lively4url + '/debugger.html?targetId=' + res.targetId,
        width: 1000, left: parseInt((screen.width - 1000) / 2),
        height: 750, top: parseInt((screen.height - 750) / 2),
        type: 'popup'
      }).catch(error => {
        lively.notify("Unable to create new window for debugger.");
      });
    });
  }

  static async openMarkdown(url, title = "Markdown", parameters = {}) {
    var comp = await lively.openComponentInWindow("lively-markdown", undefined, pt(1000, 800));
    comp.setAttribute("url", url);
    var src = await fetch(url).then(r => r.text());
    comp.parameters = parameters;
    comp.setContent(src);
    comp.parentElement.setAttribute("title", title);
    await comp.evaluated;

    return comp;
  }

  static get(query) {
    return document.querySelector(query);
  }

  static confirm(msg, customizeCB) {
    return Dialog.confirm(msg, customizeCB);
  }

  static prompt(msg, value, customizeCB) {
    return Dialog.prompt(msg, value, customizeCB);
  }

  static findWorldContext(element) {

    if (!element) return document.body;
    if (element.id == "container-root") return element;

    if (!element.parentElement) {
      // if (element.parentNode.host && element.parentNode.host.localName == "lively-container") {
      //   return element.parentNode.host.getContentRoot()
      // }
      // ||  element.tagName == "LIVELY-FIGURE"
      return element.parentNode; // shadow root
    }

    if (element.tagName == "BODY") {
      return element;
    } else {
      return this.findWorldContext(element.parentElement);
    }
  }
  
  static findParentShadowRoot(element) {
    if (!element) return ;
    if (!element.parentElement) {
      return element.parentNode; // shadow root
    }
    if (element.tagName == "BODY") {
      return 
    } else {
      return this.findWorldContext(element.parentElement);
    }
  }
  
  static findWorldContextHost(element) {
    var shadowRoot = this.findParentShadowRoot(element)
    if (shadowRoot) return shadowRoot.host
  }

  static isActiveElement(element) {
    var activeElemnt = this.activeElement();
    return this.allParents(activeElemnt, [], true).includes(element);
  }

  static activeElement(worldContext, type) {
    worldContext = worldContext || document;
    var element = worldContext.activeElement;
    if (type && element.localName == type) return element;
    if (element.shadowRoot && element.shadowRoot.activeElement) return this.activeElement(element.shadowRoot, type); // probe if we want to go deeper
    return element;
  }

  static getSelection(worldContext, type) {
    worldContext = worldContext || document;
    var element = worldContext.activeElement;
    var selection = worldContext.getSelection();
    if (type && element.localName == type) return element;
    if (element.shadowRoot && element.shadowRoot.activeElement) {
      return this.getSelection(element.shadowRoot, type); // probe if we want to go deeper
    }
    return selection;
  }

  
  static findWindow(element) {
    if (element.isWindow) return element;
    if (element.parentNode) return this.findWindow(element.parentNode);
    if (element.host) return this.findWindow(element.host);
    return document.body; // nothing found... just use the body
  }

  // lively.print(document)
  static print(obj) {
    var s = "" + obj + "{";
    for (var i in obj) {
      if (!(obj[i] instanceof Function) && obj[i] !== undefined) s += i + ": " + obj[i] + "\n";
    }
    s + "}";
    return s;
  }

  static allKeys(obj) {
    var keys = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i) || obj.__lookupGetter__(i)) {
        keys.push(i);
      }
    }
    return keys;
  }

  static methods(obj) {
    return Object.getOwnPropertyNames(obj).filter(ea => {
      var desc = Object.getOwnPropertyDescriptor(obj, ea);
      return desc.value && _.isFunction(desc.value);
    });
  }

  /*MD ## Events MD*/

  static onUnload() {
    // #TODO How to deal with multiple open lively pages?
    // last closing site wins!
    // #IDEA: we could versionize the local content and saving to it will merge in conflicting changes first? But for this to work, we would need a change history in our local storage, too?
    persistence.current.saveLivelyContent();
  }

  /* Change Preference Callbacks */

  static async onInteractiveLayerPreference(enabled) {
    if (enabled) {
      await System.import("src/client/interactive.js");
      InteractiveLayer.beGlobal();
    } else {
      if (window.InteractiveLayer) InteractiveLayer.beNotGlobal();
    }
  }

  static async onShowFixedBrowserPreference(enabled) {
    if (!this.loadedAsExtension && enabled) {
      this.showMainContainer();
    } else {
      var content = document.querySelector("#main-content");
      if (content && content.parentElement.isWindow) {
        content.parentElement.remove();
      }
    }
  }

  static async onShowDocumentGridPreference(enabled) {
    if (enabled) {
      ViewNav.showDocumentGrid(document.body);
    } else {
      ViewNav.hideDocumentGrid(document.body);
    }
  }

  static async onOfflineFirstPreference(enabled) {
    // store it where the service worker can see it... before we are loaded
    lively.focalStorage.setItem("swxOfflineFirst", enabled);
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'config',
        option: "offlineFirst",
        value: enabled
      });
    } else {
      console.log("onOfflineFirstPreference: navigator.serviceWorker.controller not there?");
    }
  }

  static async onBodyPositionPreference(pos) {
    lively.setPosition(document.body, pos);
  }
  
  static async onEnableAEDebuggingPreference(debuggingEnabled) {
    if (lively4isLoading) return // no recompile needed
    
    const brokenModules = ["Connection.js", "triples.js", "knot-view.js"]
    const activeAEModules = Object.values(System.loads).filter((o) => {
      try{
        return o.metadata.pluginLoad.metadata.enable === "aexpr" && ! brokenModules.some(m => o.key.includes(m));
      } catch (e) {
        return false;
      }
    });
    for(const module of activeAEModules) {
      await lively.unloadModule(module.key);
    }
    for(const module of activeAEModules) {
      await lively.reloadModule(module.key, true, true);
    }
    // lively.notify("Changed AE debugging: " + debuggingEnabled);
  }

  static async onBodyScrollPreference(pos) {
    this.deferredUpdateScroll = pos;
  }

  static async onFileIndexPreference(bool) {
    if (bool) {
      this.updateFileIndexDirectory(lively4url + "/");
    }
  }

  static async updateFileIndexDirectory(url) {
    return new Promise(resolve => {
      if (!this.fileIndexWorker) {
        this.fileIndexWorker = new SystemjsWorker("src/worker/fileindex-worker.js");
      }

      // fuck it this might break when called concurrently...
      this.fileIndexWorker.onmessage = evt => {
        if (evt.data.message == "updateDirectoryFinished") {
          resolve();
        }
      };
      this.fileIndexWorker.postMessage({ message: "updateDirectory", url: url });
    });
  }

  /*
   * Continousely send a message to swx to keep it alive, since it boots slowly...
   */
  static async onSWXKeepAlivePreference(bool) {
    while (lively.preferences.get("SWXKeepAlive")) {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'meta',
          command: 'keepalive'
        });
      }
      // console.log("swx keep alive")
      await lively.sleep(1000);
    }
  }

  /*
   * keep detailed bootlog in indexdb for later visualization and analysis
   */
  static async onLogBootPreference(bool) {
    localStorage["logLivelyBoot"] = bool;
  }
  
  static async onTabbedWindowsPreference(bool) {
    if (bool) {
      System.import("src/components/widgets/lively-window-docking.js")
    }
  }
  
  static async onDisableBabelCachingPreference(bool) {
    localStorage.disableBabelCaching = bool
  }
  
  

  /*MD ### Focus MD*/

  static isGlobalKeyboardFocusElement(element) {
    return element === document.body || element && element.id == "copy-hack-element" || element && element.tagName == "LIVELY-CONTAINER" && element.shadowRoot && !element.shadowRoot.activeElement;
  }

  static hasGlobalFocus() {
    return this.isGlobalKeyboardFocusElement(document.activeElement);
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

    this.focusWithoutScroll(document.body);
  }

  // #TODO: feature is under development and will ship in Chrome 64
  // same as element.focus({ preventScroll : true}); ?
  static focusWithoutScroll(element) {
    if (!element) return;

    //console.log("focusWithoutScroll " + element, lively.stack().toString())
    var scrollTop = document.scrollingElement.scrollTop;
    var scrollLeft = document.scrollingElement.scrollLeft;
    element.focus({ preventScroll: true });
    // the focus scrolls as a side affect, but we don't want that
    document.scrollingElement.scrollTop = scrollTop;
    document.scrollingElement.scrollLeft = scrollLeft;
    //console.log("scroll back " + scrollTop + " " + scrollLeft )
  }

  static ensureID(element) {
    var id = element.getAttribute("data-lively-id");
    if (!id) {
      id = generateUUID();
      element.setAttribute("data-lively-id", id);
    }
    return id;
  }
  
 
  
  static deeepElementByID(id) {
    if (!id) return;
    for(var ea of lively.allElements(true)) {
      if (ea && ea.getAttribute && ea.getAttribute("data-lively-id") == id) {
        return ea
      }
    }
  }

  static elementByID(id, worldContext, fallbackToDocument = true) {
    if (!id) {
      return;
    }
    if (!worldContext) {
      if (fallbackToDocument) {
        worldContext = document;
      } else {
        return;
      }
    }

    return worldContext.querySelector(`[data-lively-id="${id}"]`);
  }

  static query(element, query) {
    // lively.showElement(element)
    var result = element.querySelector(query);
    if (!result && element.isWindow) return; // scope that search to windows
    if (!result && element.parentElement) result = this.query(element.parentElement, query);
    if (!result && element.parentNode) result = this.query(element.parentNode, query);
    if (!result && element.host && element.host.querySelector) result = this.query(element.host, query);
    return result;
  }

  static waitOnQuerySelector(element, selector, maxtime) {
    maxtime = maxtime || 10000;
    var startTime = Date.now();
    return new Promise((resolve, reject) => {
      var check = () => {
        var found = element.querySelector(selector);
        if (found) resolve(found);else if (Date.now() - startTime > maxtime) reject();else setTimeout(check, 100);
      };
      check();
    });
  }

  static elementToCSSName(element) {
    try {
      return element.localName + (element.id ? "#" + element.id : "") + (element.classList && element.classList.length > 0 ? "." + Array.from(element.classList).join(".") : "");
    } catch (e) {
      return ""; // silent fail.... 
    }
  }

  static async openPart(partName, worldContext = document.body) {
    var data = await fetch(`${lively4url}/src/parts/${partName}.html`).then(t => t.text());
    var element = lively.clipboard.pasteHTMLDataInto(data, worldContext);
    element.setAttribute("data-lively-part-name", partName);
    return element;
  }

  static queryAll(element, query) {
    var all = new Set();
    element.querySelectorAll(query).forEach(ea => all.add(ea));
    var containers = element.querySelectorAll("lively-container");
    containers.forEach(ea => {
      ea.shadowRoot.querySelectorAll(query).forEach(ea => all.add(ea));
    });
    return Array.from(all);
  }

  static gotoWindow(element, justFocuWhenInBounds) {
    element.focus();

    if (!justFocuWhenInBounds) {
      var elementBounds = lively.getClientBounds(element);
      var windowBounds = rect(0, 0, window.innerWidth, window.innerHeight);
      if (!windowBounds.containsRect(elementBounds)) {
        // only do somthing if we are not visible
        document.scrollingElement.scrollTop = 0;
        document.scrollingElement.scrollLeft = 0;
        var offset = pt(window.innerWidth, window.innerHeight).subPt(lively.getExtent(element));

        var pos = lively.getPosition(element).subPt(offset.scaleBy(0.5));
        lively.setPosition(document.body, pos.scaleBy(-1), undefined, 1000);
      }
    }
  }

  //  lively.allPreferences()
  static allPreferences() {
    var regexp = /on(.*)Preference/;
    return Object.getOwnPropertyNames(lively).filter(ea => ea.match(regexp)).map(ea => ea.match(regexp)[1]);
  }

  static async bench(func) {
    var s = Date.now();
    await func();
    return Date.now() - s;
  }

  static get haloService() {
    return HaloService;
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
    
    if (evt.button == 0 && evt.ctrlKey) {
      evt.preventDefault();
      evt.stopPropagation();
      return // disable ctrl + left click under MacOS
    }
    
    if (!evt.shiftKey) {
      // evt.ctrlKey
      evt.preventDefault();
      evt.stopPropagation();

      // #Hack #Workaround weired browser scrolling behavior
      if (lively.lastScrollLeft || lively.lastScrollTop) {
        document.scrollingElement.scrollTop = lively.lastScrollTop;
        document.scrollingElement.scrollLeft = lively.lastScrollLeft;
      }

      if (self.__preventGlobalContextMenu__) {
        return;
      }

      var link = Array.from(evt.composedPath()).find(ea => ea.localName == "a");
      if (link) {
        // #TODO can we shorten this or hide this context specific behavior, 
        // e.g. asking a link for href in the "context" of a lively container should
        // produce the following behavior! #ContextJS #UseCase 
        var url = link.getAttribute("href");
        if (!url) return;
        var container = await lively.query(link, "lively-container");
        if (!url.match(/^[a-zA-Z0-9]+:/)) {
          if (container) {
            url = container.getURL().toString().replace(/[^/]*$/, "") + url;
          }
        }
        var items = [];
        if (container) {
          items.push(["follow", () => {
            container.followPath(url);
          }]);
        }
        items.push(["open in window", () => {
          lively.openBrowser(url);
        }]);
        items.push(["edit in window", () => {
          lively.openBrowser(url, true);
        }]);
        var menu = new lively.contextmenu(this, items);
        menu.openIn(document.body, evt, this);
      } else {
        lively.openContextMenu(document.body, evt);
      }
      return false;
    }
  }

  static halt(time = 1000) {
    window.setTimeout(() => {
      debugger;
    }, time);
  }

  static async sleep(time = 1000) {
    return wait(time);
  }

  // sleep until the system is not as busy 
  static async rest(max_idle_time = 50, waited=0, log=false) {
    var time = performance.now()
    await lively.sleep(0)
    var delta = performance.now() - time 
    if (log) {
        console.log("rested for " + delta + "ms")
    }
    if (delta > max_idle_time) {
      return this.rest(max_idle_time, waited + delta, log)
    }
    return waited + delta
  }
  
  // check something, and sleep and check again... stop after found or timeout
  // "when in doubt let it tick"
  static async sleepUntil(cb, time = 5000, step = 50) {
    var timeout;
    lively.sleep(time).then(() => {
      timeout = true;
    });
    var result;
    while (!result && !timeout) {
      result = cb();
      await lively.sleep(step);
    }
    return result;
  }

  static async time(func) {
    var start = performance.now();
    if (func) {
      await func();
    }
    return performance.now() - start;
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

  static _allElements(deep = false, root = document.body, all = new Set()) {
    if (deep && root.shadowRoot) {
      this._allElements(deep, root.shadowRoot, all);
    }
    root.querySelectorAll("*").forEach(ea => {
      if (deep && ea.shadowRoot) {
        this._allElements(deep, ea.shadowRoot, all);
      }
      all.add(ea);
    });
    all.add(root);
    return all;
  }

  static allElements(deep = false, root = document.body, all = new Set()) {
    const globalRoots = [document.body, document.documentElement, document.head]
    if (self.__gs_sources__ && globalRoots.includes(root)) {
      self.__gs_sources__.sources.forEach(source => lively._allElements(deep, source.editor, all))
    }
    return lively._allElements(deep, root, all)
  }

  static allTextNodes(root) {
    var n,
        result = [],
        walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) {
      result.push(n);
    }
    return result;
  }

  static findAllElements(filterFunc, deep) {
    return Array.from(this.allElements(deep)).filter(filterFunc);
  }

  static allParents(element, parents = [], deep = false) {
    if (!element) return parents;
    if (!element.parentElement) {
      if (deep && element.parentNode) {
        if (element.parentNode === document) {
          return parents;
        }
        parents.push(element.parentNode);
        parents.push(element.parentNode.host);

        return this.allParents(element.parentNode.host, parents, deep);
      } else {
        return parents;
      }
    }
    parents.push(element.parentElement);
    this.allParents(element.parentElement, parents, deep);
    return parents;
  }
  
  static findParent(element, condition, { deep = false, withSelf = false } = {}) {
    return this.allParents(element, withSelf ? [element] : [], deep).find(condition)
  }
  
  static ancestry(element) {
    // return [start, ...lively.allParents(start, undefined, true)];
    if (!element) {
      return [];
    }

    function ancestryFromEvent(target) {
      if (!(target instanceof EventTarget)) {
        return [target, lively.allParents(target, undefined, true)];
      }

      let elements = [];

      const getAncestryEvent = new CustomEvent('getAncestry');
      const cb = evt => elements = evt.composedPath();
      try {
        target.addEventListener('getAncestry', cb);
        target.dispatchEvent(getAncestryEvent);
      } finally {
        target.removeEventListener('getAncestry', cb);
      }

      return elements;
    }

    const parents = [];
    let localAncestry;
    do {
      localAncestry = ancestryFromEvent(element);
      parents.push(...localAncestry);
      /* if we started in a shadowroot as non-slotted element, we have to look outside further*/
    } while (localAncestry.last instanceof ShadowRoot && (element = localAncestry.last.host));

    return parents;
  }
  
  static offsetAncestry(element) {
    if (!element) {
      return [];
    }

    const parents = [];
    let parent = element;

    do {
      parents.push(parent);
    } while (parent = parent.offsetParent);

    return parents;
  }

  /* test if element is in DOM */
  static isInBody(element) {
    return this.isInElement(element, document.body)
  }

  static isInElement(element, otherElement) {
    return this.allParents(element, undefined, true).includes(otherElement);
  }

  
  static showHalo(element) {
    window.that = element;
    HaloService.showHalos(element);
  }

  static swxURL(url) {
    var m = url.toString().match(/^([a-zA-Z0-9]+)\:\/?\/?(.*)$/);
    if (!m) {
      throw new Error("coudl not convert url to an swx form: " + url);
    }
    return "https://lively4/scheme/" + m[1] + "/" + m[2];
  }

  static allElementsFromPoint(pos, root = document, visited = new Set()) {
    var result = [];
    var elements = root.elementsFromPoint(pos.x, pos.y
    // this is a workaround of the issue that elementsFromPoint contains parent elements...

    );elements.filter(e => {
      const notYetVisited = !visited.has(e);
      visited.add(e);
      return notYetVisited;
    }).forEach(ea => {
      if (ea.shadowRoot && ea.shadowRoot.elementsFromPoint) {
        var shadowRootElements = this.allElementsFromPoint(pos, ea.shadowRoot, visited);
        result.push(...shadowRootElements);
      }
      result.push(ea);
    });

    return result;
  }

  static registerSWXHandshake() {

    if (!navigator.serviceWorker) {
      console.warn("[lively] registerSWXHandshake fail: no serviceWorker found");
      return;
    }
    lively.removeEventListener("handshake", navigator.serviceWorker);
    lively.addEventListener("handshake", navigator.serviceWorker, "message", async evt => {
      try {
        if (!evt.data.name || !evt.data.name.match(/swx:started/)) return; // not for me

        if (!evt.ports[0]) {
          console.warn("registerSWXHandshake got message... but could not answer");
          return;
        }
        console.log("[lively] SWX started");
        evt.ports[0].postMessage({
          name: "client:handshake"
        });
      } catch (err) {
        evt.ports[0].postMessage({ error: err });
      }
    });
  }

  static headersToJSO(headers) {
    var o = {};
    for (var [k, v] of headers.entries()) {
      o[k] = v;
    }
    return o;
  }

  static registerSWXFetchHandler() {

    if (!navigator.serviceWorker) {
      console.warn("[lively] registerSWXFetchHandler faile: no serviceWorker found");
      return;
    }
    lively.removeEventListener("proxy", navigator.serviceWorker);
    lively.addEventListener("proxy", navigator.serviceWorker, "message", async evt => {
      try {
        if (!evt.data.name || !evt.data.name.match('swx:proxy:')) return; // not for me

        let url = evt.data.url;
        if (!evt.ports[0]) {
          console.warn("registerSWXFetchHandler got message... but could not answer");
          return;
        }
        if (evt.data.name == 'swx:proxy:GET') {
          //  console.log("[lively] registerSWXFetchHandler FETCH SWX: " + url)
          var response = await fetch(url, {
            method: "GET",
            headers: Object.assign(evt.data.headers, {
              "lively-proxied": "true"
            })
          });
          evt.ports[0].postMessage({
            content: await response.blob(),
            ok: response.ok,
            redirected: response.redirected,
            status: response.status,
            statusText: response.statusText,
            type: response.type,
            url: response.url,
            headers: this.headersToJSO(response.headers)
          });
        }
      } catch (err) {
        evt.ports[0].postMessage({ error: err });
      }
    });
  }
  
  static runDevCodeAndLog() {
    // #Experimental #Live #FeedbackLoop
    var devcode = document.body.querySelector("#DEVCODE")
    var devlog = document.body.querySelector("#DEVLOG")
    if (devcode && devlog) {
      devlog.value = "working on it... wait"
      lively.sleep(100).then( async () => {
       var result = await devcode.boundEval(devcode.value) 
       var value =result.value
       if (value.then) value = await value;
       devlog.value = "" + value
     })
  }

  }
}

if (!window.lively || window.lively.name != "Lively") {
  window.lively = Lively;
  console.log(window.lively4stamp, "loaded lively intializer");
  // only load once... not during development
  Lively.loaded();
} else {
  var oldLively = window.lively;
  Lively.previous = oldLively;
  Lively.fileIndexWorker = oldLively.fileIndexWorker;
  window.lively = Lively;
}

// #TODO pull this this out into boot.js #Continue
lively.registerSWXFetchHandler // #BUG this is to late for booting lively itself if not everthing is in the zip

();lively.registerSWXHandshake();

var modulesExported = Lively.exportModules();
