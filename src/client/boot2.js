/**
 * boot.js -- loads lively in any page that inserts throug a script tag
 *
 **/
 
/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */
 
if (window.lively && window.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
 
  console.group("BOOT")
  
  // for finding the baseURL...
  var script = document.currentScript
  var scriptURL = script.src;
  window.lively4url = scriptURL.replace("/src/client/boot2.js","")
  
  var loadContainer = script.getAttribute("data-container") // some simple configuration 
  console.log("lively4url: " + lively4url);
  
   
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
    return loadJavaScriptThroughDOM("systemjs", lively4url + "/src/external/systemjs/system.js");
  }).then( () => {
    SystemJS.config({
      // baseURL: lively4url + '/',
      meta: {
        "*.js": { 
          babelOptions: {
            stage2: false,
            stage3: false
            // stage0: true,
            // stage1: true
          }
        }
      },
      map: {
        'plugin-babel': './src/external/babel/plugin-babel.js',
        'systemjs-plugin-babel': './src/external/babel/plugin-babel.js',
        'systemjs-babel-build': './src/external/babel/systemjs-babel-browser.js',
        'kernel': lively4url + '/src/client/legacy-kernel.js'
      },
      transpiler: 'plugin-babel' }
    )
    
    System.import(lively4url + "/src/client/load2.js").then((load) => {
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
}
