/**
 * boot.js -- loads lively in any page that inserts throug a script tag
 *
 **/
 
/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */

// for finding the baseURL...
var script = document.currentScript
var scriptURL = script.src;

var loadContainer = script.getAttribute("data-container")

console.group("BOOT")

 
// COPIED HERE BECAUSE resuse through libs does not work yet
function loadJavaScriptThroughDOM(name, src, force) {
  return new Promise(function (resolve) {
    var scriptNode = document.querySelector(name);
    if (scriptNode) {
      scriptNode.remove();
    }
    var script = document.createElement("script");
    script.id = name;
    script.charset = "utf-8";
    script.type = "text/javascript";
    script.setAttribute("data-lively4-donotpersist","all");
    if (force) {
      src += +"?" + Date.now();
    }
    script.src = src;
    script.onload = function () {
      resolve();
    };
    document.head.appendChild(script);
  });
}

Promise.resolve().then( () => {
  return loadJavaScriptThroughDOM("systemjs", "src/external/system.src.js");
}).then( () => {
  return loadJavaScriptThroughDOM("regenerator", "vendor/regenerator-runtime.js");
}).then( () => {
  var lively4yourself = /\/[^\/]*\.html/; // ADAPT THIS
    // some little reflection... help to find your inner self!
  window.lively4url = scriptURL.replace("/src/client/boot.js","")
  console.log("lively4url: " + lively4url);

  // configure babel
  System.paths.babel = lively4url + '/src/external/babel-browser.js';
  System.config({
    baseURL: lively4url + '/',
    transpiler: 'babel',
    babelOptions: { },
    map: {
      babel: lively4url + '/src/external/babel-browser.js',
      kernel: lively4url + '/src/client/legacy-kernel.js'
    }
  });
  
  System.import(lively4url + "/src/client/load.js").then((load) => {
    console.group("Lively1/3")
    console.log("Wait for service worker....");
    return new Promise((resolve, reject) => {
      load.whenLoaded(function(){
        resolve();
      });
    });
  }).then(() => {
    console.groupEnd();
    console.group("Lively2/3");
    console.log("Look for uninitialized instances of web compoments");
    return lively.components.loadUnresolved();
  }).then(function() {
    console.groupEnd();
    console.group("Lively3/3")
    console.log("Initialize document");
    return lively.initializeDocument(document, false, loadContainer);
  }).then(() => {
    console.groupEnd();
    console.log("Finally loaded!");
    console.groupEnd(); // BOOT
  }).catch(function(err) {
    console.log("Lively Loaging failed", err);
    alert("load Lively4 failed:" + err);
  });
});
