'use strict';
import * as scripts from './script-manager.js'
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';
import files from './files.js';
import html from './html.js';
import paths from './paths.js';


import keys from './keys.js';
import focalStorage from '../external/focalStorage.js';
import * as components from './morphic/component-loader.js';

import * as jquery from '../external/jquery.js';

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
  "focalStorage"]

// #LiveProgramming #Syntax #ES6Modules #Experiment #Jens
// By structuring our modules differently, we still can act as es6 module to the outside but develop at runtime
// #IDEA: I refactored from "static module and function style" to "dynamic object" style
var lively = class Lively {
  static loaded() {
      // guard againsst wrapping twice and ending in endless recursion
      if (!console.log.isWrapped) {
          var nativeLog = console.log
          console.log = function() {
              nativeLog.apply(console, arguments)
              lively.log.apply(undefined, arguments)
          }
          console.log.isWrapped = true
          console.log.nativeLog = nativeLog // #TODO use generic Wrapper mechanism here
      }
      exportmodules.forEach(name => lively[name] = eval(name)) // oh... this seems uglier than expected
  }

  static array(anyList){
    return Array.prototype.slice.call(anyList)
  }

  static openWorkspace(string, pos) {
    var name = "juicy-ace-editor"
    var comp  = document.createElement(name)
    lively.components.openInWindow(comp).then((container) => {
      pos = pos || lively.pt(100,100)
      lively.setPosition(container,pos)
    }).then( () => {
      comp.editor.focus();
    })
  }

  static boundEval(str, ctx) {
    var interactiveEval = function(text) { return eval(text) };
    var transpiledSource = babel.transform(str).code
    // #TODO alt: babel.run
    // #TODO context does not seem to work!
    return interactiveEval.call(ctx, transpiledSource);
  }

  static pt(x,y) {
    return {x: x, y: y}
  }

  static setPosition(obj, point) {
      obj.style.position = "absolute"
      obj.style.left = ""+  point.x + "px"
      obj.style.top = "" + point.y + "px"
  }

  static openFile(url) {
    if (url.hostname == "lively4"){
      var container  = $('lively-container')[0];
      if (container) {
        container.followPath(url.pathname)
      } else {
        console.log("fall back on editor: "+ url)
        editFile(url)
      }
    } else {
      editFile(url)
    }
  }

  static editFile(url) {
    var editor  = document.createElement("lively-editor")
    lively.components.openInWindow(editor).then((container) => {
        lively.setPosition(container, lively.pt(100, 100))
        editor.setURL(url)
        editor.loadFile()
    })
  }

  static getContextMenu() {
    // lazy module loading
    return new Promise(function(resolve){
      if (lively.contextmenu) resolve(lively.contextmenu)
      else System.import(preferences.getBaseURL() + "/src/client/contextmenu.js")
        .then( module => {lively.contextmenu = module.default})
        .then( () => resolve(lively.contextmenu))
    })
  }

  static hideContextMenu() {
    this.getContextMenu().then(m => m.hide())
  }

  static openContextMenu(container, evt) {
    console.log("open context menu")
    this.getContextMenu().then(m => m.openIn(container, evt))
  }

  static log(/* varargs */) {
      var args = arguments
      $('lively-console').each(function() {
        try{
          if (this.log) this.log.apply(this, args)
        }catch(e) {
          // ignore...
        }
      })
  }

  static notify(title, text, timout) {
    console.log("NOTE: " + title  + " (" + text + ")")
    var notification = new Notification(title || "", {
      icon: 'https://www.lively-kernel.org/media/livelylogo-small.png',
      body: text || "",
    });
    setTimeout(() => notification.close(), timout || 3000);
    // notification.onclick = cb
  }

  static initializeDocument(doc, loadedAsExtension) {
    console.log("Lively4 initializeDocument")
    if (loadedAsExtension) {
      doc.addEventListener('contextmenu', function(evt) {
          if (evt.ctrlKey) {
            evt.preventDefault();
            lively.openContextMenu($('body')[0], evt)
            return false;
          }
      }, false);
      alert("Lively4 extension loaded!\n" +
        "  CTRL+LeftClick  ... open halo\n" +
        "  CTRL+RightClick ... open menu")
    } else {
      doc.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
        lively.openContextMenu($('body')[0], evt)
        return false;
      }, false);
    }


    doc.addEventListener('click', function(evt){lively.hideContextMenu(evt)}, false);
    doc.addEventListener('keyup', function(evt){lively.keys.handle(evt)}, false);
  }

  static initializeHalos() {
    if ($('lively-halos').size() == 0) {
        $('<lively-halos>')
            .attr('data-lively4-donotpersist', 'all')
            .appendTo($('body'));
    }
    lively.components.loadUnresolved();
  }
}

export default lively
lively.loaded()
console.log("loaded lively")
