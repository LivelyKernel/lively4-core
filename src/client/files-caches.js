import Files from "./files.js"

self.lively4fetchLog = self.lively4fetchLog || []

import {uniq} from "utils"

export async function updateCachedFilesList() {
  var list = self.lively4fetchLog.filter(ea => ea.method == "GET")
              .filter(ea => ea.url.match(lively4url))
              .filter(ea => !ea.url.match("lively4bundle.zip")) 
              .map(ea => ea.url.replace(lively4url + "/",""))
              ::uniq().sort()
 
  await fetch(lively4url + "/.lively4bootfilelist", {
    method: "PUT",
    body: list.join("\n")
    //JSON.stringify(list).replace(/",/g,'",\n') // just a bit pretty print
  })
  return list
}

export async function purgeTranspiledFiles() {
  var transpiledFiles = await Files.walkDir(lively4url + "/.transpiled/")
  var log = ""
  for(var eaURL of transpiledFiles) {
    log += await fetch(eaURL, {method: "DELETE"})
  }
  // should we make it live?
  return transpiledFiles.map(ea => ea.replace(lively4url + "/.transpiled/", ""))
}


export async function invalidateTranspiledFiles() {
  var files = await fetch(lively4url + "/", {
    method: "OPTIONS",
    headers: {
      filelist: true
    }
  }).then(r => r.json())
  
  var log = ""
  var map = new Map() // make file lookup faster
  for(let file of files.contents) {
    let path = file.name.replace(/^\.\//, "")
    if (path.match(/^\.transpiled\//)) {
      map.set(path, file)
    }
  }
  for(let file of files.contents) {
    var path = file.name.replace(/^\.\//,"")
    if (path.match(/\.js$/)) {
      var transpiledPath = ".transpiled/" + path.replace(/\//g,"_")
      var transpiled = map.get(transpiledPath)
      if (transpiled) {
        if (file.modified > transpiled.modified) {
          var jsURL = lively4url + "/" + transpiledPath
          var mapURL = lively4url + "/" + transpiledPath + ".map.json"
          log += "delete " + jsURL + "\n"
          log += "delete " + mapURL + "\n"
          fetch(jsURL, {method: "DELETE"})
          fetch(mapURL, {method: "DELETE"})
        } else {
          // log += `ignore ${transpiled.name} ${file.modified}\n` // < ${transpiled.modified}
        }
      } else {
        // log += `not found ` + transpiledPath +"\n"
      }
      
    }
  }
  return log
}



// updateCachedFilesList()


if (!navigator.serviceWorker) {
  console.warn("[files]... could not register message handler with no-existing service worker")
} else {
  lively.removeEventListener("files", navigator.serviceWorker)
  lively.addEventListener("files", navigator.serviceWorker, "message", async (evt) => {
    try {
      if(evt.data.name == 'swx:fech:request') {
        var map = Files.cachedFileMap()
        console.log("[files] fetch request: " + evt.data.method + " "+ evt.data.url)
        self.lively4fetchLog.push({
          time: performance.now(),
          method: evt.data.method,
          url: evt.data.url
        }) 
      }

    } catch(err) {
      console.error("[files] error during swx message handling...", err)
    }
  });
}
