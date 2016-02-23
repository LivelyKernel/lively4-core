// Oh, yes! Our own Module! Where we can play... and polute and everything!

'use strict';

import * as scripts from './script-manager.js'
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';
import * as components from './morphic/component-loader.js';
import * as jquery from '../external/jquery.js';
import focalStorage from '../external/focalStorage.js';


export { scripts }
export { messaging }
export { preferences }
export { persistence }
export { components }
export { focalStorage }


var worldmenu

export function boundEval(str, ctx) {
  var interactiveEval = function(text) { return eval(text) };
  var transpiledSource = babel.transform(str).code
  // #TODO alt: babel.run
  // #TODO context does not seem to work!
  return interactiveEval.call(ctx, transpiledSource);
}

export function pt(x,y) {
    return {x: x, y: y}
}

export function setPosition(obj, point) {
    obj.style.position = "absolute"
    obj.style.left = ""+  point.x + "px"
    obj.style.top = "" + point.y + "px"
}

export function openFile(url) {
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

export function editFile(url) {
  var editor  = document.createElement("lively-editor")
  lively.components.openInWindow(editor).then((container) => {
      lively.setPosition(container, lively.pt(100, 100))
      editor.setURL(url)
      editor.loadFile()
  })
}

export function hideContextMenu() {
  if (worldmenu) {
    $(worldmenu).remove()
    worldmenu = null
  }
}

export function openContextMenu(container, evt) {
  console.log("open context menu")
  this.hideContextMenu()
	System.import(preferences.getBaseURL() + "/src/client/contextmenu.js").then(function(contextmenu) {
		 contextmenu.openIn(container, evt, (menu) => {
          worldmenu = menu
        })
    })
}

function log(/* varargs */) {
    var args = arguments
    $('lively-console').each(function() { this.log.apply(this, args)})
}

export function notify(title, text, timout) {
    var notification = new Notification(title || "", {
      icon: 'https://www.lively-kernel.org/media/livelylogo-small.png',
      body: text || "",
    });
    setTimeout(() => notification.close(), timout || 3000);
    // notification.onclick = cb
}


// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
    var nativeLog = console.log
    console.log = function() {
        nativeLog.apply(console, arguments)
        log.apply(undefined, arguments)
    }
    console.log.isWrapped = true
}

export function array(anyList){
  return Array.prototype.slice.call(anyList)
}


console.log("loaded lively")
