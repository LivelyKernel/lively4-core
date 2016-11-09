'use strict';

import './patches.js' // monkey patch the meta sytem....

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

import authGithub from './auth-github.js'
import authDropbox from './auth-dropbox.js'
import authGoogledrive  from './auth-googledrive.js'

import expose from './expose.js';

/* expose external modules */
import color from '../external/tinycolor.js';
import focalStorage from '../external/focalStorage.js';

import * as kernel from 'kernel'

let $ = window.$,
  babel = window.babel; // known global variables.

import {pt} from 'lively.graphics';


// a) Special shorthands for interactive development
// b) this is the only reasonable way to use modules in template scripts, due to no shared lexical scope #TODO
var exportmodules = [
  "scripts",
  "messaging",
  "preferences",
  "persistence",
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
  
  static import(moduleName, path, forceLoad) {
    if (lively.modules && path) {
      lively.modules.module("" + path).reload({reloadDeps: true, resetEnv: false})
    }
    if (!path) path = this.defaultPath(moduleName)
    if (!path) throw Error("Could not imoport " + moduleName + ", not path specified!")



    if (this[moduleName] && !forceLoad)
      return new Promise((resolve) => { resolve(this[moduleName])})
    if (forceLoad) {
      path += "?" + Date.now()
    }

    return System.import(path).then( (module, err) => {
      if (err) {
        lively.notify("Could not load module " + moduleName, err);
      } else {
        console.log("lively: load "+ moduleName)

        if (moduleName == "lively") {
          this.notify("migrate lively.js")
          var oldLively = window.lively;
          window.lively =module.default || module
          this["previous"] = oldLively
          this.components = oldLively.components // components have important state
        } else {
          this[moduleName] = module.default || module
        }

        if (lively.components && this[moduleName]) {
          lively.components.updatePrototype(this[moduleName].prototype);
        }
        return module.default || module
      }
    })
  }

  static async reloadModule(path) {
    path = "" + path;
    var module = lively.modules.module(path)
    if (!module.isLoaded()) {
      console.log("cannot reload module " + path + " because it is not loaded")
      return;
    }
    console.log("reload module: " + path)
    return module.reload({reloadDeps: true, resetEnv: false})
      .then( () => System.import(path))
      .then( mod => {
      var moduleName = path.replace(/[^\/]*/,"")
      
      var defaultClass = mod.default
      
      if (lively.components && defaultClass) {
        console.log("update template prototype: " + moduleName)
        lively.components.updatePrototype(defaultClass.prototype);
      };
      
      if (moduleName == "lively") {
          this.notify("migrate lively.js")
          var oldLively = window.lively;
          window.lively =module.default || module
          this["previous"] = oldLively
          this.components = oldLively.components // components have important state
      }
      
      return mod;
    })
  }

  static loadJavaScriptThroughDOM(name, src, force) {
    return new Promise((resolve) => {
      var scriptNode = document.querySelector("#"+name);
      if (scriptNode) {
        scriptNode.remove();
      }
      var script = document.createElement("script");
      script.id=name;
      script.charset="utf-8"
      script.type="text/javascript";
      if (force) {
        src += + "?" + Date.now();
      }
      script.src= src;
      script.onload = function() {
        resolve();
      };
      document.head.appendChild(script);
    })
  }


  static loadCSSThroughDOM(name, href, force) {
    return new Promise((resolve) => {
      var linkNode = document.querySelector("#"+name);
      if (linkNode) {
        linkNode.remove();
      }
      var link = document.createElement("link");
      link.rel="stylesheet"
      link.id=name;
      link.charset="utf-8"
      link.type="text/css";
      if (force) {
        href += + "?" + Date.now();
      }
      link.href= href;
      link.onload = function() {
        resolve();
      };
      document.head.appendChild(link);
    })
  }

  static fillTemplateStyles(root) {
     // there seems to be no <link ..> tag allowed to reference css inside of templates #Jens
     var promises = []
     _.each(root.querySelectorAll("style"), ea => {
        var src = ea.getAttribute("data-src")
        if (src) {
          promises.push(fetch(lively4url + src).then(r => r.text()).then(css => {
            ea.innerHTML = css
          }))
        }
     })
     return Promise.all(promises)
  }

  static defaultPath(moduleName) {
    return ({
      math: kernel.realpath("/src/external/math.js"),
      typo: kernel.realpath("/src/external/typo.js"),
      contextmenu: kernel.realpath('/src/client/contextmenu.js'),
      customize: kernel.realpath('/src/client/customize.js'),
      selecting: kernel.realpath('/src/client/morphic/selecting.js'),
      expose: kernel.realpath('/src/client/expose.js')
    })[moduleName]
  }
  
  static showError(error) {
    this.handleError(error)
  }
  
  static handleError(error) {
    lively.LastError = error
    if (!error) return // hmm... this is currious...
    lively.notify("Error: ", error.message, 10, () =>
    		  lively.openWorkspace("Error:" + error.message + "\nLine:" + error.lineno + " Col: " + error.colno+"\nSource:" + error.source + "\nError:" + error.stack), 
          "red")
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
    	  lively.handleError(error)
      }
    }
    // do it just once
    if (!window.unhandledRejectionEventLister) {
      window.unhandledRejectionEventLister = function(evt) {lively.handleError(evt.reason)} ;
      window.addEventListener('unhandledrejection', unhandledRejectionEventLister);
    }

    exportmodules.forEach(name => lively[name] = eval(name)); // oh... this seems uglier than expected

    // for anonymous lively.modules workspaces
    if (lively.modules && !lively.modules.isHookInstalled("fetch", "workspaceFetch")) {
      lively.modules.installHook("fetch", function workspaceFetch(proceed, load) {
        if (load.address.match("workspace://")) return Promise.resolve("")
        return proceed(load)
      })
    }

    // for container content... But this will lead to conflicts with lively4chrome  ?? #Jens
    lively.loadCSSThroughDOM("livelystyle", lively4url + "/templates/lively4.css")
  }

  static array(anyList){
    return Array.prototype.slice.call(anyList);
  }

  static openWorkspace(string, pos) {
    var name = "juicy-ace-editor";
    var comp  = document.createElement(name);
    return lively.components.openInWindow(comp).then((container) => {
      pos = pos || lively.pt(100,100);
      comp.changeMode("javascript");
      comp.enableAutocompletion();
      comp.editor.setValue(string)
      lively.setPosition(container,pos);
      container.setAttribute("title", "Workspace")
    }).then( () => {
      comp.editor.focus();
      return comp
    });
  }
  
  static openInspector(object, pos, str) {
    lively.openComponentInWindow("lively-inspector", null, pt(400,500)).then( inspector => {
        inspector.windowTitle = "Inspect: " + str
        inspector.inspect(object)
    })
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
        .replace(/\}\);[\s\n]*$/,"") // strip postfix

    console.log("code: " + transpiledSource)
    console.log("context: " + ctx)
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
      if (obj.clientX)
        return pt(obj.clientX, obj.clientY)
      if (obj.style) {
        var pos = pt(parseFloat(obj.style.left), parseFloat(obj.style.top))
      }
      if (isNaN(pos.x) || isNaN(pos.y)) {
        pos = $(that).position() // fallback to jQuery...
        pos = pt(pos.left, pos.top)
      }
      return pos
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
    lively.components.openInWindow(editor).then((container) => {
        lively.setPosition(container, lively.pt(100, 100));
        editor.setURL(url);
        editor.loadFile();
    });
  }

  static hideContextMenu(evt) {
    if (evt.path[0] !== document.body) return
    console.log("hide context menu:" + evt)
    contextmenu.hide()
  }

  static openContextMenu(container, evt, target, worldContext) {
    if (HaloService.areHalosActive() ||
      (HaloService.halosHidden && ((Date.now() - HaloService.halosHidden) < 500))) {
      target = that
    }
    console.log("open context menu: " + target);
    contextmenu.openIn(container, evt, target, worldContext)
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
    this.notifications.push({title: title, text: text, cb: cb, time: Date.now()})


    if (Notification.permission !== "granted") Notification.requestPermission();

    var time = Date.now()
    
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
    if (cb) notification.onclick = cb
    if (timeout === undefined) timeout = 3
    setTimeout(() => notification.close(), timeout * 1000);
    // notification.onclick = cb

  }
  
  static notify(titleOrOptions, text, timeout, cb, color) {
    var title = titleOrOptions
    
    
    // #TODO make native notifications opitional?
    // this.nativeNotify(title, text, timeout, cb) 
    console.log("Note: " + title + "\n" + text)

    if (!this.notificationList || !this.notificationList.parentElement) {
      this.notificationList = document.createElement("lively-notification-list")
      lively.components.openIn(document.body, this.notificationList).then( () => {
        this.notificationList.addNotification(title, text, timeout, cb, color)
      })
    } else {
      if (this.notificationList.addNotification) {
       this.notificationList.addNotification(title, text, timeout, cb, color)
      } else {
        console.log("Notification List not initialized yet")
      }
    }



  }

  static initializeDocument(doc, loadedAsExtension) {
    console.log("Lively4 initializeDocument");
      doc.addEventListener('contextmenu', function(evt) {
          if (evt.ctrlKey) {
            evt.preventDefault();
            lively.openContextMenu(document.body, evt);
            return false;
          }
      }, false);

    if (loadedAsExtension) {
      this.import("customize").then(customize => {
          customize.customizePage()
      })
      lively.notify("Lively4 extension loaded!",
        "  CTRL+LeftClick  ... open halo\n" +
        "  CTRL+RightClick ... open menu");
    } else {
      // doc.addEventListener('contextmenu', function(evt) {
      //   evt.preventDefault();
      //   lively.openContextMenu($('body')[0], evt);
      //   return false;
      // }, false);
    }

    doc.addEventListener('click', function(evt){lively.hideContextMenu(evt)}, false);
    doc.addEventListener('keydown', function(evt){lively.keys.handle(evt)}, false);
  }

  static initializeHalos() {
    if ($('lively-halo').size() === 0) {
        $('<lively-halo>')
            .attr('data-lively4-donotpersist', 'all')
            .appendTo($('body'));
    }
    lively.components.loadUnresolved();
  }
  
  static initializeSearch() {
    if ($('lively-search-widget').size() === 0) {
      $('<lively-search-widget>')
          .attr('data-lively4-donotpersist', 'all')
          .appendTo($('body'));
    }
    lively.components.loadUnresolved();
  }

   static unload() {
      lively.notify("unloading Lively is not supported yet! Please reload page....");
  }

  static updateTemplate(html) {
    var tagName = components.reloadComponent(html);
    if (!tagName) return;

    _.each($(tagName), function(oldInstance) {
      if (oldInstance.__ingoreUpdates) return;

      // if (oldInstance.isMinimized && oldInstance.isMinimized()) return // ignore minimized windows
      // if (oldInstance.isMaximized && oldInstance.isMaximized()) return // ignore isMaximized windows

      var owner = oldInstance.parentElement;
      var newInstance = document.createElement(tagName);

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
        newInstance.style.top = oldInstance.style.top
        newInstance.style.left = oldInstance.style.left
      }

      // Migrate "that" pointer
      if (window.that == oldInstance) {
        window.that = newInstance
      }

      if (newInstance.livelyMigrate) {
        newInstance.livelyMigrate(oldInstance) // give instances a chance to take over old state...
      }
    });
  }

  static showPoint(point) {
    var comp = document.createElement("div")
    comp.style['pointer-events'] = "none";
    comp.style.width = "5px";
    comp.style.height = "5px";
    comp.style.padding = "1px";
    comp.style.backgroundColor = 'rgba(255,0,0,0.5)';
    comp.isMetaNode = true;
    document.body.appendChild(comp);
    lively.setPosition(comp, point);
    comp.setAttribute("data-is-meta", "true");

    setTimeout( () => $(comp).remove(), 3000);
    // ea.getBoundingClientRect
  }

  static showSource(object, evt) {
    if (object instanceof HTMLElement) {
        var comp  = document.createElement("lively-container");
        lively.components.openInWindow(comp).then((container) => {
          comp.editFile(lively4url +"/templates/" + object.localName + ".html")
        })
    } else {
      lively.notify("Could not show source for: " + object)
    }
  }

  static async showClassSource(object, evt) {
    // object = that
    if (object instanceof HTMLElement) {
      let templateFile = lively4url +"/templates/" + object.localName + ".html",
        source = await fetch(templateFile).then( r => r.text());
        template = $.parseHTML(source).find( ea => ea.tagName == "TEMPLATE"),
        className = template.getAttribute('data-class'),
        baseName = this.templateClassNameToTemplateName(className)
        moduleURL = lively4url +"/templates/" + baseName + ".js";
      lively.openBrowser(moduleURL, true, className);
    } else {
      lively.notify("Could not show source for: " + object)
    }
  }


  static showElement(elem, timeout) {
    if (!elem || !elem.getBoundingClientRect) return 
    var comp = document.createElement("div")
    var bounds = elem.getBoundingClientRect()
    var pos = lively.pt(
      bounds.left +  $(document).scrollLeft(),
      bounds.top +  $(document).scrollTop())

    comp.style.width = bounds.width +"px"
    comp.style.height = bounds.height +"px"
    comp.style['pointer-events'] = "none"
    // comp.style.height = "0px"
    comp.style["z-index"] = 1000;
    comp.style.border = "1px solid red";
    comp.isMetaNode = true;
    document.body.appendChild(comp)
    lively.setPosition(comp, pos);
    comp.setAttribute("data-is-meta", "true")

    comp.innerHTML = "<pre data-is-meta='true' style='position: relative; top: -8px; width: 200px; background: rgba(255,255,255,0.8); color: red; font-size: 8pt'>" +
        elem.tagName +": " + elem.id + "\n" +
        elem.getAttribute("class") +"\n"

      + "</pre>"

    setTimeout( () => $(comp).remove(), timeout || 3000)
    return comp
  }

  static allProperties(obj, result) {
    result = result || {};
    Object.getOwnPropertyNames(obj).forEach( name => {result[name] = obj.constructor.name})
    if (obj.__proto__) {
      lively.allProperties(obj.__proto__, result);
    }
    return result
  }
  
  static templateClassNameToTemplateName(className) {
    return className.replace(/[A-Z]/g, ea => "-" + ea.toLowerCase()).replace(/^-/,"")
  }

  static async registerTemplate() {
    var template = document.currentScript.ownerDocument.querySelector('template');
    var clone = document.importNode(template.content, true);
    var proto;
    var className = template.getAttribute("data-class")
    if (className) {
      // className = "LivelyFooBar"
      baseName = this.templateClassNameToTemplateName(className)
      var module= await System.import(lively4url +'/templates/' + baseName +".js");
      proto =  Object.create(module.prototype || module.default.prototype)
    }
    lively.components.register(template.id, clone, proto);
  }

  static get eventListeners() {
    if (!window.livelyEventListeners) {
      window.livelyEventListeners = []
    }
    return window.livelyEventListeners
  }

  static set eventListeners(list) {
      window.livelyEventListeners = list
  }

  // Registration and deregistration of eventlisteners for run-time programming...
  static addEventListener(domain, target, type, listener, options) {
    this.eventListeners.push(
      {target: target, type: type, listener: listener, domain: domain, options: options})
    target.addEventListener(type, listener, options)
  }

  static removeEventListener(domain, target, type, listener) {
    this.eventListeners = this.eventListeners.filter(ea => {
      if ((!target      || (ea.target   === target))
          && (!type     || (ea.type     ==  type))
          && (!listener || (ea.listener === listener))
          && (!domain   || (ea.domain   ==  domain))) {
        // actually removing the event listener
        // console.log("removeEventListener", ea.target, ea.type, ea.listener)
        ea.target.removeEventListener(ea.type, ea.listener, ea.options)
        return false
      } else {
        return true
      }
    })
  }

  static openSearchWidget(text) {
    // index based search is not useful at the moment
    if (true) {
      this.openComponentInWindow("lively-search", evt).then( comp => {
         comp.searchFile(text)
      })
    } else {
      var comp = document.getElementsByTagName("lively-search-widget")[0]
      if (comp.isVisible && text == comp.query) {
        comp.isVisible = false;
      } else {
        comp.isVisible = true
        comp.search(text, true)
      }
    }
  }
  
  static hideSearchWidget() {
    var comp = document.getElementsByTagName("lively-search-widget")[0]
    comp.hide();
  }

  static openHelpWindow(text) {
    this.openComponentInWindow("lively-help").then(comp => {
      comp.parentElement.style.width = "850px";
      comp.parentElement.style.height = "600px";
      comp.getHelp(text);
    })
  }

  static openComponentInWindow(name, pos, extent) {
    var lastWindow = _.first(lively.array(document.body.querySelectorAll("lively-window")))

    var comp  = document.createElement(name);
    return lively.components.openInWindow(comp).then((w) => {
      if (extent) {
        w.style.width = extent.x
        w.style.height = extent.y
      }
      if (lastWindow) {
        var lastPos = lively.getPosition(lastWindow)
        var windowWidth = comp.parentElement.getBoundingClientRect().width
        if (lastPos !== undefined && windowWidth !== undefined) {
          if (lastPos.x > windowWidth) {
            lively.setPosition(comp.parentElement, lastPos.subPt(pt(windowWidth + 25, 0)))
          } else {
            lively.setPosition(comp.parentElement, lastPos.addPt(pt(25,25)))
          }
        }      
      }
      if (pos) 
        lively.setPosition(w, pos);
      
      if (comp.windowTitle) w.setAttribute("title", "" + comp.windowTitle);
      
      return comp;
    });
  }
  
  // lively.openBrowser("https://lively4/etc/mounts", true, "Github")
  static async openBrowser(url, edit, pattern, replaceExisting) {
    var editorComp;
    var containerPromise
    if (replaceExisting) {
      editorComp = _.detect(document.querySelectorAll("lively-container"), 
        ea => ea.isSearchBrowser)
    } 
 
    var lastWindow = _.first(lively.array(document.body.querySelectorAll("lively-window"))
      .filter(  ea => ea.childNodes[0].isSearchBrowser))
      
    containerPromise = editorComp ? Promise.resolve(editorComp) :
      lively.openComponentInWindow("lively-container");

    return containerPromise.then(comp => {
      editorComp = comp;
      comp.parentElement.style.width = "850px"
      comp.parentElement.style.height = "600px"
      
      if (lastWindow) {
        lively.setPosition(comp.parentElement, 
          lively.getPosition(lastWindow).addPt(pt(25,25)))
      }

      if (edit) comp.setAttribute("mode", "edit");
      if (pattern) {
        comp.isSearchBrowser = true
        comp.hideNavbar()
      }
      return comp.followPath(url)
    }).then(() => {
      if (edit && pattern) {
        editorComp.realAceEditor().then( editor => editor.find(pattern))
      }
    })
  }
}

if (window.lively && window.lively.name != "Lively") {
  Object.assign(Lively, window.lively) // copy objects from lively.modules
}


if (!window.lively || window.lively.name != "Lively") {
  window.lively = Lively
  console.log("loaded lively intializer");
  // only load once... not during development
  Lively.loaded();
} else {
  window.lively = Lively
}

console.log("loaded lively");
