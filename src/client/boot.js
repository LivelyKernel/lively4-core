/**
 * boot.js -- loads lively in any page that inserts through a script tag
 *
 **/

/* global lively4performance */
/* eslint no-console: off */

/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */


// #BUG the browser cache API blocks (promises does not resolve) sometimes?
// #BUG the performance, in our alternative to use IndexedDB can quickly degrate when DB gets to big...
// window.localStorage["livel4systemjscache"] = false
window.lively4plugincache = window.localStorage["livel4systemjscache"] == "true";

async function invalidateFileCaches()  {
  try {
    if (!window.caches) {
      console.warn("window.caches not defined")
      return
    }
    var url = lively4url + "/"
    if (self.lively && lively.fileIndexWorker) {
      this.fileIndexWorker.postMessage({message: "updateDirectory", url})
    }
    var offlineFirstCache = await caches.open("offlineFirstCache")
    var json = await Promise.race([
      new Promise(r => {
        setTimeout(() => r(false), 5000) // give the server 5secs ... might be an old one or somthing, anyway keep going!
      })
      ,fetch(url, {
        method: "OPTIONS",
        headers: {
          filelist  : true
        }
      }).then(async resp => {
        if (resp.status != 200) {
          console.log("PROBLEM invalidateFileCaches " + resp.status)
          return false
        } else {
          try {
            var text = await resp.text()
            return JSON.parse(text)
          } catch(e) {
            console.log("could not parse: " + text)
            return undefined
          }
        }
      })
    ])
  } catch(e) {
    console.log("PROBLEM invalidateFileCaches " + e)
    return
  }

  if (!json) {
    console.log('[boot] invalidateFileCaches: could not invalidate flash... should we clean it all?')
    return
  }
  var list = json.contents

  for(let ea of list) {
    if (!ea.name) continue;
    var fileURL = url + ea.name.replace(/^.\//,"")
    var cached  = await offlineFirstCache.match(fileURL)

    if (cached) {
      var cachedModified = cached.headers.get("modified")
      if (ea.modified > cachedModified) {
        console.log("invalidate cache " + fileURL + `${ea.modified} > ${cachedModified}`)
        offlineFirstCache.delete(fileURL) // we could start loading it again?
      } else {
        // console.log("keep " + ea.modified)
      }
    }
  }
}

window.lively4invalidateFileCaches = invalidateFileCaches


if (window.lively && window.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
  (function() {
    // early feedback due to long loading time
    let livelyBooting = document.createElement('div');
    Object.assign(livelyBooting.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

      zIndex: '10000',

      backgroundColor: 'white',
      border: 'black 1px solid',
      padding: '5px',
      boxShadow: '0px 0px 3px 0px rgba(40, 40, 40,0.66)'
    });
    livelyBooting.innerHTML = `<img alt="Lively 4" style="display:block; margin:auto;" src="media/lively4_logo_smooth_100.png" />
<span style="font-size: large;font-family:arial">Booting:</span>
<div style="font-family:arial" id="lively-booting-message"></div>`;
    document.body.appendChild(livelyBooting);

    function groupedMessage(part, numberOfSteps, message) {
      console.group(`${part}/${numberOfSteps}: ${message}.`);

      let messageDiv = document.body.querySelector('#lively-booting-message');
      if(messageDiv) {
        messageDiv.innerHTML = `<span>${part}</span>/<span>${numberOfSteps}</span>: <span>${message}.</span>`;
      }
    }

    function groupedMessageEnd() {
      console.groupEnd();
    }

    console.group("BOOT");

    // for finding the baseURL...
    var script = document.currentScript;
    var scriptURL = script.src;

    window.lively4url = scriptURL.replace("/src/client/boot.js","");

    // some performance logging
    window.lively4performance = {start: performance.now()}
    try {
      Object.defineProperty(window, 'lively4stamp', {
        get: function() {
          if (!window.lively4performance) return;
          var newLast = performance.now()
          var t = (newLast - (lively4performance.last || lively4performance.start)) / 1000
          lively4performance.last = newLast
          return (t.toFixed(3) + "s ")
        }
      })
    } catch(e) {
      console.error(e)
    }

    var loadContainer = script.getAttribute("data-container"); // some simple configuration

    console.log("lively4url: " + lively4url);

    // BEGIN COPIED HERE BECAUSE resuse through libs does not work yet
    var loadJavaScriptThroughDOM = function(name, src, force) {
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
    // END COPIED

    groupedMessage(1, 4, 'Setup SystemJS');
    Promise.resolve().then(() => {
      return loadJavaScriptThroughDOM("systemjs", lively4url + "/src/external/systemjs/system.src.js");
    }).then(() => {
      return loadJavaScriptThroughDOM("systemjs-config", lively4url + "/src/systemjs-config.js");
    }).then(async () => {
      groupedMessageEnd();
      try {
        var livelyloaded = new Promise(async livelyloadedResolve => {
          groupedMessage(1, 4, 'Invalidate Caches');
          await invalidateFileCaches()
          groupedMessageEnd();

          groupedMessage(2, 4, 'Wait for Service Worker');
          const { whenLoaded } = await System.import(lively4url + "/src/client/load.js");
          await new Promise(whenLoaded);
          groupedMessageEnd();

          groupedMessage(3, 4, 'Look for uninitialized instances of Web Compoments');
          await lively.components.loadUnresolved();
          groupedMessageEnd();

          groupedMessage(4, 4, 'Initialize Document');
          await lively.initializeDocument(document, window.lively4chrome, loadContainer);
          groupedMessageEnd();

          console.log("Finally loaded!");

          document.dispatchEvent(new Event("livelyloaded"));

          livelyloadedResolve(true);
        })

        await livelyloaded
      } catch(err) {
        console.error("Lively Loading failed");
        console.error(err);
        alert("load Lively4 failed:" + err);
      } finally {
        console.groupEnd(); // BOOT
        livelyBooting.remove();
      }
    });
  })();
}
