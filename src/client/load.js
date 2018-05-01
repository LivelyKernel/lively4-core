/* Load Lively */

var loadCallbacks = [];
export function whenLoaded(cb) {
    loadCallbacks.push(cb);
}
var mybase = window.location.host  + window.location.pathname.replace(/\/[^\/]+$/,"");
var externalSite = ! lively4url.match(mybase); // I am not somewhere below lively4url

if (document.location.search.match("noserviceworker")) {
  externalSite=true
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
    script.setAttribute("data-lively4-donotpersist","all");

    if (force) {
      src += "?" + Date.now();
    }
    script.src = src;
    script.onload = function () {
      resolve();
    };
    document.head.appendChild(script);
  });
}

if ('serviceWorker' in navigator || window.lively4chrome) {
  console.log("LOAD Lively4: boot lively4 service worker");
  var root = "" + lively4url + "/";
  var serviceworkerReady = false;

  var onReady = function() {
    serviceworkerReady = true;
    // Lively has all the dependencies

    // Workaround because only one function can listen to serviceworker messages
    window.serviceWorkerMessageHandlers = {};
    window.navigator.serviceWorker.onmessage = function(event) {
      for (let key in window.serviceWorkerMessageHandlers) {
        window.serviceWorkerMessageHandlers[key](event);
      }
    }
    
    // Add listener for serviceWorker messages
    window.serviceWorkerMessageHandlers['networkNotifications'] = (event) => {
      const message = event.data;
      
      // Only handle notifications here
      if (message.type != 'notification') return;
      
      let messageColors = {
        'info': '',
        'warning': 'yellow',
        'error': 'red'
      };
      
      if('lively' in window) {
        lively.notify('ServiceWorker', message.data, 5, null, messageColors[message.command]);
      }
    }
    
    // Add listener for offline/online events
    // This is currently only used in the ServiceWorker, but the ServiceWorker does not get these events
    // So we register here and forward the events
    window.addEventListener('online', () => {
      navigator.serviceWorker.controller.postMessage({
        type: 'network',
        command: 'online'
      });
    });
    
    window.addEventListener('offline', () => {
      navigator.serviceWorker.controller.postMessage({
        type: 'network',
        command: 'offline'
      });
    });
    
    Promise.resolve("")
      // .then( function() {
      //   return loadJavaScriptThroughDOM("livelyModules",
      //     lively4url + "/src/external/lively.modules-with-lively.vm.js")})
      .then( function() {
        console.log("Load Lively4");
        return System.import("src/client/lively.js")})
      .then(function(module) {
       
        // disable search widget for now
        // if (!window.lively4chrome)
        //   lively.initializeSearch(); // disable search widget in chrome extension setting
        lively.components.loadUnresolved();
        console.log("running on load callbacks:");
        loadCallbacks.forEach(function(cb){
          try {
            cb();
          } catch(e) {
            console.log("Error running on load callback: "  + cb + " error: " + e);
          }
        });
        if (!window.__karma__ && navigator.userAgent.toLowerCase().indexOf('electron/') == -1) {
          window.onbeforeunload = function(e) {
            return 'Do you really want to leave this page?'; // gets overriden by Chrome native
          };
          
          window.onunload = function(e) {
            lively.onUnload && lively.onUnload()
          };
          
        }
        console.log("lively loaded");
      });
  };

  if (navigator.serviceWorker.controller || window.lively4chrome || externalSite) {
  
    console.log("NO Service worker during migration!!!")
  
  
    if (window.lively4chrome) {
      console.log("[Livley4] running without service worker");
    } else if (externalSite) {
      console.log("[Lively4] load from external site");
    } else {
      console.log("[Lively4] Use existing service worker");
    }
    // we don't have to do anything here... the service worker is already there
    onReady();
  } else {
    // the scope of the serviceworker can only be refined to something below it's root... so we have to install it as a file at the content's side. 
    navigator.serviceWorker.register(new URL('swx-loader.js', window.location)).then(function(registration) {
        console.log("SWX registration", registration)
        window.lively4swxregistration = registration; // for debugging
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        // so now we have to reload!
        console.log("ok... lets wait for the service worker.");
        // console.log("Lively4 ServiceWorker installed! Reboot needed! ;-)")
        // window.location = window.location
    }).catch(function(err) {
        // registration failed
        console.log('ServiceWorker registration failed: ', err);
    });
    navigator.serviceWorker.ready.then(onReady);
  }

  var fs = new Promise(function(resolve, reject) {
      navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 10, function(grantedQuota) {
          self.webkitRequestFileSystem(PERSISTENT, grantedQuota, resolve, reject);
      }, reject);
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    var reject = function(err) {
        event.ports[0].postMessage({error: err});
    };

    // support for service worker local filesytem
    switch(event.data.name) {
      case 'swx:readFile':
        fs.then((fs) => {
            fs.root.getFile(event.data.file, undefined, function(fileEntry) {
                fileEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        console.log('[LFS] read complete', e);
                        event.ports[0].postMessage({content: reader.result});
                    };
                    reader.readAsText(file);
                });
            }, reject);
        }).catch(reject);
        break
      case 'swx:writeFile':
        fs.then((fs) => {
            fs.root.getFile(event.data.file, {create: true, exclusive: false}, function(file) {
                file.createWriter(function (writer) {
                  writer.onwriteend = function(e) {
                      console.log("[LFS] write complete", e);
                      event.ports[0].postMessage({
                          content: event.data.content
                      });
                  };
                  writer.onerror = reject;
                  writer.write(new Blob([event.data.content], {type: 'text/plain'}));
                }, reject);
            }, reject);
        }).catch(reject);
        break
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});
