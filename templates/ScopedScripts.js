import {proceed, create as layer}  from "src/external/ContextJS.js"
import * as cop  from "src/external/ContextJS.js"
import lively from "src/client/lively.js"


export default class ScopedScripts {

  static load() {
    this.documentRoot = lively4url; 
    this.documentLocation = window.location;   
  }
  
 static layers(url) {
   this.documentRoot = url.toString().replace(/[^/]*$/,"");
   this.documentLocation = new URL(url); 
   return [this.ImportLayer, this.LocalLayer];
 } 
}

layer(ScopedScripts, "ImportLayer").refineObject(System, {
	import(name, parentName, parentAddress) {
		name = name.replace(/^.\//, ScopedScripts.documentRoot);
		// lively.notify("import "+ name + ", " + parentName +","+ parentAddress)
		return cop.proceed(name, parentName, parentAddress);
	}
});

layer(ScopedScripts, "LocalLayer").refineObject(lively, {
	get location() {
	  lively.notify("get location");
		return new URL(ScopedScripts.documentLocation);
	}
});


/* Workspace
ScopedScripts.documentLocation = "https://lively-kernel.org/lively4/lively4-jens/demos/example.html"
ScopedScripts.LocalLayer.beGlobal()
ScopedScripts.ImportLayer
*/

ScopedScripts.load()