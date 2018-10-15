import {proceed, layer} from "src/client/ContextJS/src/contextjs.js";
import * as cop  from "src/client/ContextJS/src/contextjs.js";
import * as Layers  from "src/client/ContextJS/src/Layers.js";
import lively from "src/client/lively.js";


export default class ScopedScripts {

  static load() {
    this.openPromises = []
    this.documentRoot = lively4url;
    this.documentLocation = window.location;
  }

  static layers(url, optBody) {
    this.documentRoot = url.toString().replace(/[^/]*$/,"");
    this.documentLocation = new URL(url);
    this.documentBody = optBody || document.body;
    return [this.ImportLayer, this.DocumentLayer, this.LocalLayer, this.PropagateLayerActicationLayer];
  }
}

/*
 * Captures the layer activation on Promise definition and replays it when resolving the promise
 */
// #TODO it seems, we cannot layer "then" because it will sometimes result in an maximum stack size exeception
layer(window, "PropagateLayerActicationLayer").refineClass(Promise, {
	then(onresolve, onerror) {
    // return cop.proceed(onresolve, onerror)
    var layers = Layers.currentLayers();
    // console.log("Promise.then ... ");
		var newResolve = function() {
      var args = arguments;
      // console.log("replay layers..." + layers);
      return cop.withLayers(layers, () => onresolve.apply(window, args));
		};
		var newError = function() {
      var args = arguments;
      return cop.withLayers(layers, () => onerror.apply(window, args));
		};
		return cop.proceed(onresolve ? newResolve : undefined, onerror ? newError : undefined);
	}
}).refineObject(lively, {
  loadJavaScriptThroughDOM(name, url, force) {
    var globalLayers = Layers.currentLayers();
    globalLayers.forEach( ea => {
      // console.log("Layer enable: " + ea)
      ea.beGlobal();
    });
    return cop.proceed(name, url, force).then( (result) => {
      globalLayers.forEach( ea => {
        // console.log("Layer disable: " + ea)
        ea.beNotGlobal();
      });
      return result;
    }, (error) => {
      globalLayers.forEach( ea => ea.beNotGlobal());
      return error;
    });
  }
});


layer(window, "ImportLayer").refineObject(System, {
	import(name, parentName, parentAddress) {
    // console.log("System.import " + name +', ' + parentName + ", " + parentAddress)
		name = name.replace(/^.\//, ScopedScripts.documentRoot);
		// lively.notify("import "+ name + ", " + parentName +","+ parentAddress)
		return cop.proceed(name, parentName, parentAddress);
	}
});

layer(ScopedScripts, "LocalLayer").refineObject(lively, {
	get location() {
    // lively.notify("get location");
		return new URL(ScopedScripts.documentLocation);
	},
	set location(url) {
    // lively.notify("get location");
		return cop.proceed(url)
	}
});


layer(window, "DocumentLayer").refineObject(document, {
  get body() {
    return ScopedScripts.documentBody
  },

	write(a) {
    console.log("document.write " + a);
    // console.log("BEGIN")
    var div = document.createElement("div");
    div.innerHTML = a;
    div.childNodes.forEach( ea => {
      // console.log("append child: " + ea);
      var myPromise = new Promise((resolve, reject) => {
        if (ea.tagName == "SCRIPT") {
          var s = document.createElement("script");
          var src = ea.getAttribute("src")
          if (!src.match(/^(https?\:\/\/)|(\/\/)/) )
            src = src.replace(/^/, ScopedScripts.documentRoot);
          s.src = src

          console.log("old src... ", ea)
          // s.async = false;
          ea = s;
          ea.addEventListener("load", () => {
            resolve();
          });
          ea.addEventListener("error", () => {
            reject();
          });
        }
      });
      ScopedScripts.openPromises.push(myPromise);
      ScopedScripts.documentBody.appendChild(ea); // #TODO instanctiate layers
    });
  },
  createElement(name) {
    // console.log("document.createElement " + name);
    return cop.proceed.apply(this, arguments);
  }
});


/* Workspace
ScopedScripts.documentLocation = "https://lively-kernel.org/lively4/lively4-jens/demos/example.html"
ScopedScripts.LocalLayer.beGlobal()
ScopedScripts.ImportLayer
*/

ScopedScripts.load();
