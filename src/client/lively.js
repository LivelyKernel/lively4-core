// Oh, yes! Our own Module! Where we can play... and polute and everything!

'use strict';

import * as scripts from './script-manager.js'
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';
import * as files from './files.js';
// import * as keys from './keys.js';
import keys from './keys.js';


import * as components from './morphic/component-loader.js';
import focalStorage from '../external/focalStorage.js';

import * as jquery from '../external/jquery.js';

var exportmodules = [
  "scripts",
  "messaging",
  "preferences",
  "persistence",
  "files",
  "keys",
  "components",
  "focalStorage"]


// #LiveProgramming #Syntax #ES6Modules #Experiment #Jens
// By structuring our modules differently, we still can act as es6 module to the outside but develop at runtime
// #IDEA: I refactored from "static module and function style" to "dynamic object" style
var lively = {
  worldmenu: null,

  array: function(anyList){
    return Array.prototype.slice.call(anyList)
  },

  openWorkspace: function (string, pos) {
    var name = "juicy-ace-editor"
    var comp  = document.createElement(name)
    lively.components.openInWindow(comp).then((container) => {
      pos = pos || lively.pt(100,100)
      lively.setPosition(container,pos)
    })
  },

  boundEval: function (str, ctx) {
    var interactiveEval = function(text) { return eval(text) };
    var transpiledSource = babel.transform(str).code
    // #TODO alt: babel.run
    // #TODO context does not seem to work!
    return interactiveEval.call(ctx, transpiledSource);
  },

  pt: function (x,y) {
    return {x: x, y: y}
  },

  setPosition: function (obj, point) {
      obj.style.position = "absolute"
      obj.style.left = ""+  point.x + "px"
      obj.style.top = "" + point.y + "px"
  },

  openFile: function (url) {
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
  },

  editFile: function (url) {
    var editor  = document.createElement("lively-editor")
    lively.components.openInWindow(editor).then((container) => {
        lively.setPosition(container, lively.pt(100, 100))
        editor.setURL(url)
        editor.loadFile()
    })
  },

  getContextMenu: function() {
    // lazy module loading
    return new Promise(function(resolve){
      if (lively.contextmenu) resolve(lively.contextmenu)
      else System.import(preferences.getBaseURL() + "/src/client/contextmenu.js")
        .then( module => {lively.contextmenu = module.default})
        .then( () => resolve(lively.contextmenu))
    })
  },
  hideContextMenu: function() {
    this.getContextMenu().then(m => m.hide())
  },

  openContextMenu: function (container, evt) {
    console.log("open context menu")
    this.getContextMenu().then(m => m.openIn(container, evt))
  },

  log: function (/* varargs */) {
      var args = arguments
      $('lively-console').each(function() {
        try{
          if (this.log) this.log.apply(this, args)
        }catch(e) {
          // ignore...
        }
      })
  },

  notify: function (title, text, timout) {
      var notification = new Notification(title || "", {
        icon: 'https://www.lively-kernel.org/media/livelylogo-small.png',
        body: text || "",
      });
      setTimeout(() => notification.close(), timout || 3000);
      // notification.onclick = cb
  }
}

exportmodules.forEach(name => lively[name] = eval(name)) // oh... this seems uglier than expected

export default lively

// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
    var nativeLog = console.log
    console.log = function() {
        nativeLog.apply(console, arguments)
        lively.log.apply(undefined, arguments)
    }
    console.log.isWrapped = true
}

console.log("loaded lively")
