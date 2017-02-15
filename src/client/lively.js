
import './patches.js'; // monkey patch the meta sytem....

import * as jquery from '../external/jquery.js';
import * as _ from '../external/underscore.js';

import * as scripts from './script-manager.js';
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';

import html from './html.js';
import files from './files.js';
import paths from './paths.js';

import contextmenu from './contextmenu.js';

import keys from './keys.js';
import components from './morphic/component-loader.js';

import authGithub from './auth-github.js';
import authDropbox from './auth-dropbox.js';
import authGoogledrive  from './auth-googledrive.js';

import expose from './expose.js';

import generateUUID from './uuid.js';

/* expose external modules */
import color from '../external/tinycolor.js';
import focalStorage from '../external/focalStorage.js';

import * as kernel from 'kernel';

let $ = window.$; // known global variables.

import {pt} from './graphics.js';

// a) Special shorthands for interactive development
// b) this is the only reasonable way to use modules in template scripts, due to no shared lexical scope #TODO
// c) This indirection is also needed to let old events listeners signal to code in current modules 
var exportmodules = [
  "preferences",
  "files",
  "keys",
  "paths",
  "html",
  "components",
  "color",
  "focalStorage",
  "authGithub",
  "authDropbox",
  "authGoogledrive"
];

// #LiveProgramming #Syntax #ES6Modules #Experiment #Jens
// By structuring our modules differently, we still can act as es6 module to the outside but develop at runtime
// #IDEA: I refactored from "static module and function style" to "dynamic object" style
export default class Lively {
  
  static get location() {
    return window.location;
  }
  
  static set location(url) {
    return window.location = url;
  }

  static async reloadModule(path) {
    path = "" + path;
    var changedModule = System.normalizeSync(path);
    var load = System.loads[changedModule]
    if (!load) {
      console.log("Don't reload non-loaded module")
      return   
    }
    
    System.registry.delete(System.normalizeSync(path))
    return System.import(path).then( m => {
      // Find all modules that depend on me
      var dependedModules = Object.values(System.loads).filter( ea => 
        ea.dependencies.find(dep => System.normalizeSync(dep, ea.key) == changedModule))
      // and update them
      dependedModules.forEach( ea => {
        console.log("reload " + path + " triggers reload of " + ea.key)
        System.registry.delete(ea.key)  
        System.import(ea.key)
      })
      return m
    }).then( mod => {
      var moduleName = path.replace(/[^\/]*/,"");
      
      var defaultClass = mod.default;
      
      if (defaultClass) {
        console.log("update template prototype: " + moduleName);
        components.updatePrototype(defaultClass.prototype);
      }
   
      return mod;
    });
  }

  static loadJavaScriptThroughDOM(name, src, force) {
    return new Promise((resolve) => {
      var scriptNode = document.querySelector("#"+name);
      if (scriptNode) {
        scriptNode.remove();
      }
      var script = document.createElement("script");
      script.id=name;
      script.charset="utf-8";
      script.type="text/javascript";
      if (force) {
        src += + "?" + Date.now();
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


  static fillTemplateStyles(root, debugInfo) {
    // there seems to be no <link ..> tag allowed to reference css inside of templates #Jens
    var promises = [];
    var allSrc = []
    _.each(root.querySelectorAll("style"), ea => {
      var src = ea.getAttribute("data-src"); 
      if (src) {
        allSrc.push(src)
        // console.log("load fillTemplateStyles: " + lively4url + src );
        promises.push(fetch(lively4url + src).then(r => r.text()).then(css => {
          ea.innerHTML = css;
        }));
      }
    });
    return Promise.all(promises)
  }

  static showError(error) {
    this.handleError(error);
  }
  
  static handleError(error) {
    lively.LastError = error;
    if (!error) return; // hmm... this is currious...
    lively.notify("Error: ", error.message, 10, () =>
    		  lively.openWorkspace("Error:" + error.message + "\nLine:" + error.lineno + " Col: " + error.colno+"\nSource:" + error.source + "\nError:" + error.stack), 
          "red");
  }

  static loaded() {
    // #Refactor with #ContextJS
    // guard againsst wrapping twice and ending in endless recursion
    // if (!console.log.originalFunction) {
    //     var nativeLog = console.log;
    //     console.log = function() {
    //         nativeLog.apply(console, arguments);
    //         lively.log.apply(undefined, arguments);
    //     };
    //     console.log.originalFunction = nativeLog; // #TODO use generic Wrapper mechanism here
    // }
    // if (!console.error.originalFunction) {
    //     var nativeError = console.error;
    //     console.error = function() {
    //         nativeError.apply(console, arguments);
    //         lively.log.apply(undefined, arguments);
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

    this.exportModules()

    if (!window.lively4chrome) {
      // for container content... But this will lead to conflicts with lively4chrome  ?? #Jens
      lively.loadCSSThroughDOM("livelystyle", lively4url + "/templates/lively4.css");
    }    
    // preload some components
    components.loadByName("lively-window");
    components.loadByName("lively-editor");
  }
  
  
  static exportModules() {
    exportmodules.forEach(name => lively[name] = eval(name)); // oh... this seems uglier than expected
  }
  

  static array(anyList){
    return Array.prototype.slice.call(anyList);
  }

  static openWorkspace(string, pos) {
    var name = "juicy-ace-editor";
    var comp  = document.createElement(name);
    return components.openInWindow(comp).then((container) => {
      pos = pos || lively.pt(100,100);
      comp.changeMode("javascript");
      comp.enableAutocompletion();
      // comp.setAttribute("persistent", "true"); #TODO slows down typing?
      comp.editor.setValue(string);
      comp.setTargetModule('workspace_module_' + generateUUID().replace(/-/g, '_'));
      lively.setPosition(container,pos);
      container.setAttribute("title", "Workspace");
    }).then( () => {
      comp.editor.focus();
      return comp;
    });
  }
  
  static openInspector(object, pos, str) {
    lively.openComponentInWindow("lively-inspector", null, pt(400,500)).then( inspector => {
        inspector.windowTitle = "Inspect: " + str;
        inspector.inspect(object);
    });
  }

  static boundEval(str, ctx) {
    // just a hack... to get rid of some async....
    // #TODO make this more general
    // works: await new Promise((r) => r(3))
    // does not work yet: console.log(await new Promise((r) => r(3)))
    // if (str.match(/^await /)) {
    //   str = "(async () => window._ = " + str +")()"
    // }

    // #Hack #Hammer #Jens Wrap and Unwrap code into function to preserve "this"
    var transpiledSource = babel.transform('(function(){/*lively.code.start*/' + str+'})').code
        .replace(/^(?:[\s\n]*["']use strict["'];[\s\n]*)([\S\s]*?)(?:\(function\s*\(\)\s*\{\s*\/\*lively.code.start\*\/)/, "$1") // strip prefix
        .replace(/\}\);[\s\n]*$/,""); // strip postfix

    console.log("code: " + transpiledSource);
    console.log("context: " + ctx);
    var interactiveEval = function interactiveEval(code) {
      return eval(code);
    };
    return interactiveEval.call(ctx, transpiledSource);
  }

  static pt(x,y) {
    return {x: x, y: y};
  }

  static setPosition(obj, point) {
      obj.style.position = "absolute";

      // var bounds = that.getBoundingClientRect().top
      //var deltax = point.x - bounds.left
      // var deltay = point.y - bounds.top

      // obj.style.left = ""+  ((obj.style.left || 0) - deltax) + "px";
      // obj.style.top = "" + ((obj.style.top || 0) - deltay) + "px";
      obj.style.left = ""+  point.x + "px";
      obj.style.top = "" +  point.y + "px";
  }
  
  
  // Example: lively.getPosition(that)
  
  static getPosition(obj) {
    var pos;
    if (obj.clientX)
      return pt(obj.clientX, obj.clientY);
    if (obj.style) {
      pos = pt(parseFloat(obj.style.left), parseFloat(obj.style.top));
    }
    if (isNaN(pos.x) || isNaN(pos.y)) {
      pos = $(obj).position(); // fallback to jQuery...
      pos = pt(pos.left, pos.top);
    }
    return pos;
  }
  
  // static getPosition(obj) {
  //     if (obj.clientX)
  //       return {x: obj.clientX, y: obj.clientY}
  //     else if (obj.style)
  //       return {x: parseFloat(obj.style.left), y: parseFloat(obj.style.top)}
  //     throw Error("" + obj + " has not position");
  // }
  
  static openFile(url) {
    if (url.hostname == "lively4"){
      var container  = $('lively-container')[0];
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
    if (evt.path[0] !== document.body) return;
    console.log("hide context menu:" + evt);
    contextmenu.hide();
  }

  static openContextMenu(container, evt, target, worldContext) {
    if (HaloService.areHalosActive() ||
      (HaloService.halosHidden && ((Date.now() - HaloService.halosHidden) < 500))) {
      target = that;
    }
    contextmenu.openIn(container, evt, target, worldContext);
  }

  static log(/* varargs */) {
      var args = arguments;
      $('lively-console').each(function() {
        try{
          if (this.log) this.log.apply(this, args);
        }catch(e) {
          // ignore...
        }
      });
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
  static notify(titleOrOptions, text, timeout, cb, color) {
    var title = titleOrOptions;
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
    // #TODO make native notifications opitional?
    // this.nativeNotify(title, text, timeout, cb) 
    console.log("Note: " + title + "\n" + text);

    if (!this.notificationList || !this.notificationList.parentElement) {
      this.notificationList = document.createElement("lively-notification-list");
      components.openIn(document.body, this.notificationList).then( () => {
        this.notificationList.addNotification(title, text, timeout, cb, color);
      });
    } else {
      if (this.notificationList.addNotification) {
       this.notificationList.addNotification(title, text, timeout, cb, color);
      } else {
        console.log("Notification List not initialized yet");
      }
    }



  }

  static initializeDocument(doc, loadedAsExtension, loadContainer) {
    console.log("Lively4 initializeDocument");
    lively.loadCSSThroughDOM("font-awesome", lively4url + "/src/external/font-awesome/css/font-awesome.min.css");
    
    doc.addEventListener('contextmenu', function(evt) {
        if (evt.ctrlKey) {
          evt.preventDefault();
          lively.openContextMenu(document.body, evt);
          return false;
        }
    }, false);
    doc.addEventListener('click', function(evt){lively.hideContextMenu(evt)}, false);
    doc.addEventListener('keydown', function(evt){lively.keys.handle(evt)}, false);

    if (loadedAsExtension) {
      System.import("src/client/customize.js").then(customize => {
          customize.customizePage();
      });
      lively.notify("Lively4 extension loaded!",
        "  CTRL+LeftClick  ... open halo\n" +
        "  CTRL+RightClick ... open menu");
      return Promise.resolve();
    } else {
      // don't want to change style of external web-sites...
      lively.loadCSSThroughDOM("lively4", lively4url +"/src/client/lively.css");
      
      var titleTag = document.querySelector("title");
      if (!titleTag) {
        titleTag = document.createElement("title");
        titleTag.textContent = "Lively 4";        
        document.head.appendChild(titleTag);
      }

      if (loadContainer) {
        var container = document.createElement("lively-container");
        container.id = 'main-content';
        container.setAttribute("load", "auto");
        container.style.width = "calc(100%)";
        container.style.height = "calc(100%)";
        container.style.position = "fixed";
        container.setAttribute("data-lively4-donotpersist","all");

        return components.openIn(document.body, container).then( () => {
          container.__ingoreUpdates = true; // a hack... since I am missing DevLayers...
          container.get('#container-content').style.overflow = "visible";
        });
      } 
    }
  }

  static initializeHalos() {
    if ($('lively-halo').size() === 0) {
        $('<lively-halo>')
            .attr('data-lively4-donotpersist', 'all')
            .appendTo($('body'));
    }
    components.loadUnresolved();
  }
  
  static initializeSearch() {
    if ($('lively-search-widget').size() === 0) {
      $('<lively-search-widget>')
          .attr('data-lively4-donotpersist', 'all')
          .appendTo($('body'));
    }
    components.loadUnresolved();
  }

   static unload() {
      lively.notify("unloading Lively is not supported yet! Please reload page....");
  }

  static async updateTemplate(html) {
    var tagName = await components.reloadComponent(html);
    if (!tagName) return;

    _.each($(tagName), function(oldInstance) {
      if (oldInstance.__ingoreUpdates) return;

      // if (oldInstance.isMinimized && oldInstance.isMinimized()) return // ignore minimized windows
      // if (oldInstance.isMaximized && oldInstance.isMaximized()) return // ignore isMaximized windows

      var owner = oldInstance.parentElement;
      var newInstance = document.createElement(tagName);
      
      if (oldInstance.livelyPreMigrate) {
        oldInstance.livelyPreMigrate(oldInstance); 
      }
      owner.replaceChild(newInstance, oldInstance);
      _.each(oldInstance.childNodes, function(ea) {
        if (ea) { // there are "undefined" elemented in childNodes... sometimes #TODO
          newInstance.appendChild(ea);
          console.log("append old child: " + ea);
        }
      });
      _.each(oldInstance.attributes, function(ea) {
        console.log("set old attribute " + ea.name + " to: " + ea.value);
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
  }

  static showPoint(point) {
    var comp = document.createElement("div");
    comp.style['pointer-events'] = "none";
    comp.style.width = "5px";
    comp.style.height = "5px";
    comp.style.padding = "1px";
    comp.style.backgroundColor = 'rgba(255,0,0,0.5)';
    comp.style.zIndex = 1000;
    comp.isMetaNode = true;
    document.body.appendChild(comp);
    lively.setPosition(comp, point);
    comp.setAttribute("data-is-meta", "true");

    setTimeout( () => $(comp).remove(), 3000);
    // ea.getBoundingClientRect
    return comp
  }

  static showSource(object, evt) {
    if (object instanceof HTMLElement) {
        var comp  = document.createElement("lively-container");
        components.openInWindow(comp).then((container) => {
          comp.editFile(lively4url +"/templates/" + object.localName + ".html");
        });
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }

  static async showClassSource(object, evt) {
    // object = that
    if (object instanceof HTMLElement) {
      let templateFile = lively4url +"/templates/" + object.localName + ".html",
        source = await fetch(templateFile).then( r => r.text()),
        template = $.parseHTML(source).find( ea => ea.tagName == "TEMPLATE"),
        className = template.getAttribute('data-class'),
        baseName = this.templateClassNameToTemplateName(className),
        moduleURL = lively4url +"/templates/" + baseName + ".js";
      lively.openBrowser(moduleURL, true, className);
    } else {
      lively.notify("Could not show source for: " + object);
    }
  }


  static showElement(elem, timeout) {
    if (!elem || !elem.getBoundingClientRect) return ;
    var comp = document.createElement("div");
    var bounds = elem.getBoundingClientRect();
    var pos = lively.pt(
      bounds.left +  $(document).scrollLeft(),
      bounds.top +  $(document).scrollTop());

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

    setTimeout( () => $(comp).remove(), timeout || 3000);
    return comp;
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

  static async registerTemplate() {
    var template = document.currentScript.ownerDocument.querySelector('template');
    var clone = document.importNode(template.content, true);
    var proto;
    var className = template.getAttribute("data-class");
    if (className) {
      // className = "LivelyFooBar"
      let baseName = this.templateClassNameToTemplateName(className);
      var module= await System.import(lively4url +'/templates/' + baseName +".js");
      proto =  Object.create(module.prototype || module.default.prototype);
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

  static openSearchWidget(text) {
    // index based search is not useful at the moment
    if (true) {
      this.openComponentInWindow("lively-search").then( comp => {
         comp.searchFile(text);
      });
    } else {
      var comp = document.getElementsByTagName("lively-search-widget")[0];
      if (comp.isVisible && text == comp.query) {
        comp.isVisible = false;
      } else {
        comp.isVisible = true;
        comp.search(text, true);
      }
    }
  }
  
  static hideSearchWidget() {
    var comp = document.getElementsByTagName("lively-search-widget")[0];
    comp.hide();
  }

  static openHelpWindow(text) {
    this.openComponentInWindow("lively-help").then(comp => {
      comp.parentElement.style.width = "850px";
      comp.parentElement.style.height = "600px";
      comp.getHelp(text);
    });
  }

  static openComponentInWindow(name, pos, extent) {
    var lastWindow = _.first(lively.array(document.body.querySelectorAll("lively-window")));
  
  
    var w = document.createElement("lively-window");
    if (extent) {
      w.style.width = extent.x;
      w.style.height = extent.y;
    }
    if (lastWindow) {
      var lastPos = lively.getPosition(lastWindow);
      var windowWidth = w.getBoundingClientRect().width;
      console.log("window width")
      if (lastPos !== undefined && windowWidth !== undefined) {
        if (lastPos.x > windowWidth) {
          lively.setPosition(w, lastPos.subPt(pt(windowWidth + 25, 0)));
        } else {
          lively.setPosition(w, lastPos.addPt(pt(25,25)));
        }
      }      
    }
    return components.openInBody(w).then((w) => {
    	return components.openIn(w, document.createElement(name)).then((comp) => {
    	  if (pos) 
          lively.setPosition(w, pos);
        
        if (comp.windowTitle) w.setAttribute("title", "" + comp.windowTitle);
        return comp
    	})
    })
  }
  
  // lively.openBrowser("https://lively4/etc/mounts", true, "Github")
  static async openBrowser(url, edit, pattern, replaceExisting) {
    var editorComp;
    var containerPromise;
    if (replaceExisting) {
      editorComp = _.detect(document.querySelectorAll("lively-container"), 
        ea => ea.isSearchBrowser);
    } 
 
    var lastWindow = _.first(lively.array(document.body.querySelectorAll("lively-window"))
      .filter(  ea => ea.childNodes[0].isSearchBrowser));
      
    containerPromise = editorComp ? Promise.resolve(editorComp) :
      lively.openComponentInWindow("lively-container");

    return containerPromise.then(comp => {
      editorComp = comp;
      comp.parentElement.style.width = "850px";
      comp.parentElement.style.height = "600px";
      
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
    }).then(() => {
      if (edit && pattern) {
        editorComp.asyncGet("#editor").then(livelyEditor => {
          var ace = livelyEditor.currentEditor();
          ace.find(pattern);
        });
      }
    });
  }
  
  static get(query) {
    return document.querySelector(query)
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
  
}

if (!window.lively || window.lively.name != "Lively") {
  window.lively = Lively;
  console.log("loaded lively intializer");
  // only load once... not during development
  Lively.loaded();
} else {
  var oldLively = window.lively
  Lively.previous = oldLively
  window.lively = Lively;
}

Lively.exportModules();
  
console.log("loaded lively");
