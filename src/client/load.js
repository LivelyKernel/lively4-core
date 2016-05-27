/* Load Lively */


var loadCallbacks = []
export function whenLoaded(cb) {
    loadCallbacks.push(cb)
}


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
          


if ('serviceWorker' in navigator) {
  console.log("LOAD Lively4: boot lively4 service worker")
  // var root = ("" + window.location).replace(/[^\/]*$/,'../')
  var root = "" + lively4url + "/";
  var serviceworkerReady = false

  var onReady = function() {
    serviceworkerReady = true;
    // Lively has all the dependencies
    if (window.location.host == "livelykernel.github.io") {
      // #Experiment #Jens
      // window.lively4url = "https://lively4/"
    }
    // var tmpLively = {}
    // window.lively = tmpLively
    
    Promise.resolve("")
      // .then( function() {
      //   return loadJavaScriptThroughDOM("livelyAST",  
      //     lively4url + "/../lively.ast/dist/lively.ast.js")})
      // .then( function() {
      //   return loadJavaScriptThroughDOM("livelyVM",  
      //     lively4url + "/../lively.vm/dist/lively.vm_no-deps.js") })
      // .then( function() {
      //   return loadJavaScriptThroughDOM("livelyModules",  
      //     lively4url + "/../lively.modules/dist/lively.modules_no-deps.js") })
      .then( function() {
        return loadJavaScriptThroughDOM("livelyModules",  
          lively4url + "/../lively.modules/dist/lively.modules-with-lively.vm.js")})
      .then( function(){
        console.log("lively.modules loaded... now try to load lively4")
        System.import(lively4url + "/src/client/lively.js")
        // .then(function(module){
        //   return lively.loadJavaScriptThroughDOM("livelyModules", 
        //     lively4url + "/src/external/lively.modules.js").then( function(module){
        //       console.log("loaded lively.modules") 
        //     })  
        // })
        .then(function(module) {
            debugger
           console.log("How are we?")
        
          
            lively.initializeHalos();
            lively.components.loadUnresolved();
            console.log("running on load callbacks:");
            loadCallbacks.forEach(function(cb){
                try {
                   cb()
                } catch(e) {
                    console.log("Error running on load callback: "  + cb + " error: " + e)
                }
            });
            
            if (!window.__karma__) {
              window.onbeforeunload = function(e) {
                return 'Do you really want to leave this page?';
              };
            }
            console.log("lively loaded");
        })
        
        console.log("loaded lively.modules") 
      })
   
   
      
      // })  
  }

  if (navigator.serviceWorker.controller) {
    console.log("Use existing service worker")
    // we don't have to do anything here... the service worker is already there
    onReady()
  } else {

    navigator.serviceWorker.register(root + 'swx-loader.js', {
        // navigator.serviceWorker.register('../../serviceworker-loader.js', {
        // scope: root + "draft/"
        scope: root
    }).then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        // so now we have to reload!


        console.log("ok... lets WAIT WAIT WAIT!!!!")
        // console.log("Lively4 ServiceWorker installed! Reboot needed! ;-)")
        // window.location = window.location

    }).catch(function(err) {
        // registration failed
        console.log('ServiceWorker registration failed: ', err);
    });
    navigator.serviceWorker.ready.then(onReady)
  }



  var fs = new Promise(function(resolve, reject) {
      navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 10, function(grantedQuota) {
          self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject)
      }, reject)
  })

  navigator.serviceWorker.addEventListener("message", (event) => {
    var reject = function(err) {
        event.ports[0].postMessage({error: err})
    }

    switch(event.data.name) {
      case 'swx:readFile':
          fs.then((fs) => {
              fs.root.getFile(event.data.file, undefined, function(fileEntry) {
                  fileEntry.file(function(file) {
                      var reader = new FileReader()

                      reader.onloadend = function(e) {
                          console.log('[LFS] read complete', e)
                          event.ports[0].postMessage({content: reader.result})
                      }

                      reader.readAsText(file)
                  })
              }, reject)
          }).catch(reject)

          break
        case 'swx:writeFile':
          fs.then((fs) => {
              fs.root.getFile(event.data.file, {create: true, exclusive: false}, function(file) {
                  file.createWriter(function (writer) {
                      writer.onwriteend = function(e) {
                          console.log("[LFS] write complete", e)

                          event.ports[0].postMessage({
                              content: event.data.content
                          })
                      }

                      writer.onerror = reject
                      writer.write(new Blob([event.data.content], {type: 'text/plain'}))
                  }, reject)
              }, reject)
          }).catch(reject)

          break
    }
  })
}

document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

