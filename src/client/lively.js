// Oh, yes! Our own Module! Where we can play... and polute and everything!

'use strict';

import * as scripts from './script-manager.js'
import * as messaging from './messaging.js';
import * as preferences from './preferences.js';
import * as persistence from './persistence.js';
import * as components from './morphic/component-loader.js';


export { scripts }
export { messaging }
export { preferences } 
export { persistence } 
export { components } 

export function openContextMenu(container) {
	System.import(preferences.getBaseURL() + "/src/client/contextmenu.js").then(function(contextmenu) {
		contextmenu.openIn(container)	
    })
}

console.log("loaded lively")