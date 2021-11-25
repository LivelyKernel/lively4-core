/*MD
# boot 
loads lively in any page that inserts through a script tag
MD*/

/* eslint no-console: off */

/*
 * HELPER
 */

// var logpattern = /(lively4-jens)|(lively4-markus)|(localhost:9005)/ 
var logpattern = /thisisnologpattern/ //nothing to log at the moment
var eventId = 0 // fallback
var eventCounter = 0
var eventStarts = new Map();

/* START Browser compatibiliy */


/* ENDE Browser compatibiliy */

function timestamp(day) {
  function pad(num, size) {
      num = num.toString();
      while (num.length < size) num = "0" + num;
      return num;
  }
  return `${day.getFullYear()}-${pad(day.getMonth() + 1,2)}-${pad(day.getDate(),2)}T${pad(day.getUTCHours(), 2)}:${pad(day.getUTCMinutes(),2)}:${pad(day.getUTCSeconds(),2)}.${pad(day.getUTCMilliseconds(),3)}Z`
}

window.lively4timestamp = timestamp

function log(eventId, ...attr) { 
  if (!self.location.href.match(logpattern)) return;
  var start =  eventStarts.get(eventId)
  if (!start) {
    start = performance.now()
    eventStarts.set(eventId, start)
  }
  var time = (performance.now() - start).toFixed(2) 
  console.log("[lively4] ", eventId, timestamp(new Date()) ," " + time + "ms ",   ...attr)
}
window.lively4log = log

// BEGIN COPIED from 'utils'
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}
// END COPIED

async function loadJavaScript(name, src, force) {
  var code = await fetch(src).then(r => r.text())
  eval(code)
}

self.lively4currentbootid = "" + new Date()
self.lively4bootlogData = []
self.lively4bootlog = function add(url, date=Date.now(), mode="load", time=0, parentURL) {
  self.lively4bootlogData.push({
    url, date, mode, time, parentURL, bootid: self.lively4currentbootid
  })
}

if (!(localStorage["logLivelyBoot"] == "true")) {
  self.lively4bootlog = function() {
    // do nothing
  }
}

/*
 * CACHES
 */
self.lively4transpilationCache = {
  update(cacheKey, cache) {
    this.cache.set(cacheKey, cache)
    var cacheJSO = {
      url: cacheKey,
      input: cache.input,
      output: cache.output,
      map: JSON.stringify(cache.map),
    }

    if (!cacheKey.match(/^workspace/) && !self.__karma__) {
      console.log("[babel] update transpilation cache " + cacheKey) // from client to server :-) #Security anybody?
      let transpiledFileName =  cacheKey.replace(lively4url + "/","").replace(/\//g,"_")
      var transpileCacheURL = lively4url + "/.transpiled/" + transpiledFileName // flatten path
      
      // #TODO #Performance, do this only when in bundle... because the cache is only used in that case any way....
      
      if (!self.lively4transpilationCache.bundle.has(transpiledFileName)) {
        console.log("[lively4transpilationCache] ignore " + transpiledFileName)
        return
      }
      fetch(transpileCacheURL, {
        method: "PUT",
        headers: {
          nocommit: true, // .transpiled is in gitignore... and the server cannot handle it automaitcally
        },
        body: cacheJSO.output
      })

      fetch(transpileCacheURL + ".map.json", {
        method: "PUT",
        headers: {
          nocommit: true
        },
        body: cacheJSO.map
      })        
    }
  },
  cache: new Map(),
  bundle: new Set()
} 

if (self.localStorage) {
  if (!self.localStorage["lively4systemid"]) {
    self.localStorage["lively4systemid"] = "System" +  generateUUID()
  }  
  self.lively4systemid = self.localStorage["lively4systemid"]
}

self.lively4session = "Session" +  generateUUID()
self.lively4syncCache = new Map()
self.lively4optionsCache = new Map()
self.lively4fetchLog = []

async function invalidateFileCaches()  {
  var url = lively4url + "/"
  
  if (self.lively && lively.fileIndexWorker) {
    lively.fileIndexWorker.postMessage({message: "updateDirectory", url})
  }
  
  // we cannot guarantee anything... so we have to purge our caches...
  self.caches.delete("PoidCachesScheme") // #COP #Scattering belongs to #CachedRequest
  
  const FilesCaches = await System.import("src/client/files-caches.js")
  console.log("[boot] invalidateFileCaches:\n" + FilesCaches.invalidateTranspiledFiles())
  
}
self.lively4invalidateFileCaches = invalidateFileCaches

async function preloadFileCaches() {
  await loadJavaScript("JSZip", lively4url + "/src/external/jszip.js" )
  
  var start = performance.now()
  var preloadurl = lively4url + "/.lively4bundle.zip" + "?" + Date.now() // #TODO get hash / version of bundle before requesting it... and then cache it too... this takes 3000ms to load from lively-kernel.org from non HPI vs 1000ms localhost ... 
  var resp = await fetch(preloadurl)
  if (resp.status != "200") {
    console.warn("NO preload cache found in", preloadurl)
    return 
  }
  var contents = await resp.blob()

  var archive = await self.JSZip.loadAsync(contents)
  console.log("[boot] preloadFileCache fetched contents in  " + Math.round(performance.now() - start) + "ms")

  start = performance.now()
  for(let ea of Object.keys(archive.files)) {
    if (ea.match(/\.transpiled\//) || ea.match(/\.options\//)) continue;
    
    let file = archive.file(ea);
    if (file) {
      let modified = file.date.toISOString().replace(/T/, " ").replace(/\..*/, ""),
        url = lively4url + "/" + ea,
        content = await file.async("string"),
        mimeType = " text/plain"
      if (url.match(/\.js$/)) mimeType = "application/javascript"
      if (url.match(/\.css$/)) mimeType = "text/css"
      if (url.match(/\.html$/)) mimeType = "text/html"
      
      let optionsPath = ".options/" + ea.replace(/\//g,"_"), 
        optionsFile = archive.file(optionsPath)
      if (optionsFile) {
        let optionsContent = await optionsFile.async("string")
        try {
          var options = JSON.parse(optionsContent)
        } catch(e) {
          console.warn("[boot] preloadFileCaches: Could not parse OPTIONS", optionsPath, optionsContent)
        }
        self.lively4optionsCache.set(url, new Response(optionsContent, {
          headers: {
            "content-type": "application/json"
          }
        }))
      }
      var headers =  {
          "content-type": mimeType,
          modified: modified
        }
      if (options) {
        headers.fileversion = options.version
      }
          
      var response = new Response(content, {
        headers: headers
      })
      self.lively4syncCache.set(url, response)
      
      
      
      if (ea.match(/.js$/)) {
        let transpiledFileName = ea.replace(/\//g,"_")
        let transpiledPath = ".transpiled/" + transpiledFileName,
            transpiledFile = archive.file(transpiledPath),
            mapFile = archive.file(transpiledPath + ".map.json");
        self.lively4transpilationCache.bundle.add(transpiledFileName)
        
        if (transpiledFile) { 
          // console.log("[boot] preloadFileCache initialize transpiled javascript: " + ea)
          try {
            var transpiledCode = await transpiledFile.async("string")
            if (mapFile) {
              var map = JSON.parse(await mapFile.async("string"))
            }
            self.lively4transpilationCache.cache.set(url, {
              input: content, 
              output: transpiledCode,
              map: map,
              modified: modified
            })
          } catch(e) {
            console.error("[boot] error in loading transpiled code: " + ea, e)
          }
        }
      }
    }
  } 
  console.log("[boot] preloadFileCache updated caches in  " + Math.round(performance.now() - start) + "ms")
}

self.lively4fetchHandlers = []
function instrumentFetch() {
  if (!self.originalFetch) self.originalFetch = self.fetch
  self.fetch = async function(request, options, ...rest) {
    var eventId = eventCounter++;
    if (request) {
      log(eventId, "fetch " + (request.method || "GET") + " " +  (request.url || request).toString())
    }
    
    var result = await new Promise(resolve => {
      try {

        if (self.lively4fetchHandlers) {
          // FIRST go through our list of handlers... everybody can change the options... 
          for(let handler of self.lively4fetchHandlers) {
            let newOptions = handler.options && handler.options(request, options, eventId)
            options = newOptions || options      
          }
          // go through our list of handlers... the first one who handles it wins
          for(let handler of self.lively4fetchHandlers) {
            let handled = handler.handle && handler.handle(request, options, eventId)
            if (handled) return resolve(handled.result);        
          }
        }
      } catch(e) {
        console.error(`FETCH ERROR during rques: ${request} falling back because of`, e)
      }
      return resolve(self.originalFetch.apply(self, [request, options, ...rest]))
    })
    if (self.lively4fetchHandlers) {
      // anybody insterested when it finished
      for(var handler of self.lively4fetchHandlers) {
        handler.finsihed && await handler.finsihed(request, options)
      }
    }
    log(eventId, "finished fetch ", request)
    return result
  }  
}

function livelyFilesServerURL(url) {
  if (self.lively && lively.files) {
    return lively.files.serverURL(url)
  }
  return url.match(lively4url); // fall back to basic behavior at boot time...
}

function installCachingFetch() {
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isCachingFetch);
  self.lively4fetchHandlers.push({
    isCachingFetch: true,
    options(request, options) {
      var url = (request.url || request).toString()
      if (livelyFilesServerURL(url)) {
        if (!options) {
          options = {
            method: "GET"
          }
        }
        options.headers = new Headers(options.headers)
        options.headers.set("lively-fetch", true)
        if (options.headers.get("fileversion") || options.headers.get("forediting")) {
          options.headers.set('pragma', 'no-cache')
          options.headers.set('cache-control', 'no-cache')
        }
        return options
      }
    },
    handle(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      
      if (url.match(lively4url)) {
        self.lively4fetchLog.push({
          time: performance.now(),
          method: method,
          url: url
        }) 
        if (!self.lively4syncCache) return
        if (method == "GET") {
          if (options && options.headers && options.headers.get && 
              (options.headers.get("fileversion") || options.headers.get("forediting"))) {
            // console.log("[boot filecache] don't cache versions request:  " + request.url)
            return // don't cache versions request...
          }
          
          let match = self.lively4syncCache.get(url)
          if (match) {
            // console.log("[boot] SYNC CACHED " + url)
            return {
              result: Promise.resolve(match.clone())
            }          
          } else {
            // console.log("[boot] SYNC MISSED " + url)
          }          
        } else if (method == "PUT") {
          // clear cache for PUT
          // so next GET will get the new content
          self.lively4syncCache.set(url, null) 
          
          // #TODO we could further store the PUT already locally? 
          // PRO: offline support
          // CONTRA: not sure if the file reached the server....
          
          // and don't further handle it... so that it will be saved on the server
        } else if (method == "OPTIONS") {
          // console.log("[fetch cache] OPTIONS " + url)
          if (options && options.headers && options.headers.get("showversions")) {
            // console.log("[fetch cache] OPTION don't cache versions...")
            return // don't cache versions request...
          }

          let match = self.lively4optionsCache.get(url)
          if (match) {
            // console.log("[boot] SYNC OPTIONS CACHED " + url)
            return {
              result: Promise.resolve(match.clone())
            }          
          } else {
            // console.log("[boot] SYNC OPTIONS MISSED " + url)
          }      
        } else {
          // do nothing
        }
      }
    },
    finished(request, options) {
      // console.log("[boot] FINISHED fetch " + request.toString()) 
    }
  })
}


/*
 * MAIN BOOT FUNCTION: load Lively4 and get it going....
 */
async function intializeLively() {
  if(self.lively && self.lively4url) {
    return console.log("CANCEL BOOT Lively4, because it is already loaded")
  }
  // for finding the baseURL...
  var script = document.currentScript;
  var scriptURL = script.src;
  self.lively4url = scriptURL.replace("/src/client/boot.js","");

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
  livelyBooting.innerHTML = `<img alt="Lively 4" style="display:block; margin:auto;" src="${lively4url}/media/lively4_logo_smooth_100.png" />
<span style="font-size: large;font-family:arial">Booting:</span>
<div style="font-family:arial" id="lively-booting-message"></div>`;
  document.body.appendChild(livelyBooting);


  self.lively4bootGroupedMessages = []
  var lastMessage

  var estimatedSteps = 11;
  var stepCounter = 0;

  function groupedMessage( message, inc=true) {
    if (inc) stepCounter++;
    var part = stepCounter
    
    var numberOfSteps = estimatedSteps
    lastMessage =  {part, message, begin: performance.now()}

    console.group(`${part}/${numberOfSteps}: ${message}.`);

    let messageDiv = document.body.querySelector('#lively-booting-message');
    if(messageDiv) {
      messageDiv.innerHTML = `<span>${part}</span>/<span>${numberOfSteps}</span>: <span>${message}.</span>`;
    }
  }

  function groupedMessageEnd() {
    console.groupEnd();
    if (lastMessage) {
      lastMessage.end = performance.now()
      self.lively4bootGroupedMessages.push(lastMessage)
    }
  }

  console.group("BOOT");

  // some performance logging
  self.lively4performance = {start: performance.now()}
  try {
    Object.defineProperty(window, 'lively4stamp', {
      get: function() {
        if (!self.lively4performance) return;
        var newLast = performance.now()
        var t = (newLast - (self.lively4performance.last || self.lively4performance.start)) / 1000
        self.lively4performance.last = newLast
        return (t.toFixed(3) + "s ")
      }
    })
  } catch(e) {
    console.error(e)
  }

  var loadContainer = script.getAttribute("data-container"); // some simple configuration

  console.log("lively4url: " + lively4url);

  // first things first
  instrumentFetch()
  installCachingFetch()

  groupedMessage('Preload Files');
    await preloadFileCaches()
    // we could wait, or not... if we load transpiled things... waiting is better
  groupedMessageEnd();

  groupedMessage('Setup SystemJS');
    await loadJavaScript("systemjs", lively4url + "/src/external/systemjs/system.src.js");
    await loadJavaScript("systemjs-config", lively4url + "/src/systemjs-config.js");
  groupedMessageEnd();

  try {  
    groupedMessage('Initialize SystemJS');
      await System.import(lively4url + "/src/client/preload.js");
    groupedMessageEnd();

    groupedMessage('Setup fetch proxy');
      await System.import(lively4url + "/src/client/fetch.js").then(mod => {
        return mod.installFetchHandlers()                                                   
      })
    groupedMessageEnd();

    groupedMessage('Wait on service worker (in load.js)');
      await (await System.import(lively4url + "/src/client/load-swx.js")).whenLoaded; // wait on service worker
    groupedMessageEnd();

    groupedMessage('Load Base System (lively.js)');
      await System.import("src/client/lively.js")

      // from load.js
      // lively.components.loadUnresolved(document.body, true, "load.js", true)

      // Customize.... #TODO where should it go?
      if (!self.__karma__ && navigator.userAgent.toLowerCase().indexOf('electron/') == -1) {
        self.onbeforeunload = function() {
          return 'Do you really want to leave this page?'; // gets overriden by Chrome native
        };
        self.onunload = function() {
          lively.onUnload && lively.onUnload()
        };
      }          
    groupedMessageEnd();

    groupedMessage('Load Standard Library');
      await System.import("lang");
      await System.import("lang-ext");
      await System.import("lang-zone");
    groupedMessageEnd();

    /**
     * #GS
     * Optional Pre-Loading of GS Web Components, if found
     */
    groupedMessage('Preload GS Visual Editor');
    {
      async function setupPaperJS() {
        const paperJSURL = lively4url + '/src/external/paper-core.js';
        await lively.loadJavaScriptThroughDOM("paper-core.js", paperJSURL);
        const canvas = document.createElement('canvas')
        paper.setup(canvas);
      }

      // define global function to preload gs web components
      self.__preloadGSVisualEditor__ = async function __preloadGSVisualEditor__() {
        await setupPaperJS()
        
        const tagNames = [
          'gs-visual-editor',
          'gs-visual-editor-canvas',
          'gs-visual-editor-node',
          'gs-visual-editor-edge',
          'gs-visual-editor-port',
          'gs-visual-editor-add-node-menu',
          'gs-visual-editor-lasso-selection',
          'gs-visual-editor-rectangle-selection',
        ];

        const loadingPromises = tagNames.map(tagName => {
          const tag = document.createElement(tagName);
          tag.style.display = 'none';
          tag.setAttribute('for-preload', 'true');
          document.body.append(tag);
          function removeTag(arg) {
            tag.remove();
            return arg;
          }
          return lively.components.ensureLoadByName(tagName, undefined, tag).then(removeTag, removeTag);
        });
        return Promise.all(loadingPromises);
      };

      // only actually call the function, if we have a template path set up
      const templatePaths = lively.components.getTemplatePaths();
      if (templatePaths.some(path => path.includes('gs/components'))) {
        await self.__preloadGSVisualEditor__();
      }
    }
    groupedMessageEnd();

    groupedMessage('Initialize Document (in lively.js)' );
      await lively.initializeDocument(document, self.lively4chrome, loadContainer);
    groupedMessageEnd();

    groupedMessage('Look for uninitialized instances of Web Compoments');
      await lively.components.loadUnresolved(document.body, true, "boot.js", true)
    groupedMessageEnd();

    // wait on all components to intialize their content.... e.g. the container loading a file
    var componentWithContent = Array.from(lively.allElements(document.body))
        .filter(ea => ea.livelyContentLoaded && ea.livelyContentLoaded.then)  
    window.lively4debugBootComponentWithContent = componentWithContent
    
    
    groupedMessage(`Wait on <b>${componentWithContent.length} components</b> with content: ` +
                   componentWithContent.map(ea => `${ea.localName}`).join(", "));
    
    
    await Promise.all(componentWithContent.map(ea => ea.livelyContentLoaded))
    groupedMessageEnd();

    console.log("Finally loaded!");
    if (self.lively4bootGroupedMessages) {
      var str =  self.lively4bootGroupedMessages.map(ea => {
        return ea.part + " "  + Math.round(ea.end - ea.begin) + "ms "+ ea.message
      }).join("\n")
      console.log("BOOT", str)
    }

    if (self.lively4bootlogData) {
      System.import("src/client/bootlog.js").then(m => {
        m.default.current().addLogs(self.lively4bootlogData)
      }).then(() => console.log("saved bootlog"))            
    }
    document.dispatchEvent(new Event("livelyloaded"));
  } finally {
    console.groupEnd(); // BOOT
    livelyBooting.remove();
  }
}

intializeLively()
