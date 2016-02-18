// Oh, yes! Our own Module! Where we can play... and polute and everything!

'use strict';

import * as scripts from './script-manager.js'
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';
import * as components from './morphic/component-loader.js';
import * as jquery from '../external/jquery.js';


export { scripts }
export { messaging }
export { preferences } 
export { persistence } 
export { components } 

var worldmenu


export function pt(x,y) {
    return {x: x, y: y}
}

export function setPosition(obj, point) {
    obj.style.position = "absolute"
    obj.style.left = ""+  point.x + "px"
    obj.style.top = "" + point.y + "px"    
}

export function openContextMenu(container, evt) {
    console.log("open context menu")
    if (worldmenu) {
        $(worldmenu).remove()
        worldmenu = null 
    }
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

// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
    var nativeLog = console.log
    console.log = function() {
        nativeLog.apply(console, arguments)
        log.apply(undefined, arguments)
    }
    console.log.isWrapped = true
}


console.log("loaded lively")