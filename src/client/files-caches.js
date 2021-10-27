import Files from "./files.js";

self.lively4fetchLog = self.lively4fetchLog || [];

import { uniq } from "utils";

// _.uniq(that.value.split("\n")).join("\n")
export async function updateCachedFilesList() {

  var oldlist = (await fetch(lively4url + "/.lively4bootfilelist").then(r => r.text())).split("\n");

  var newlist = Array.from(self.lively4fetchLog.filter(ea => ea.method == "GET")).map(ea => ea.url).filter(ea => ea.startsWith(lively4url)).filter(ea => !ea.match("lively4bundle.zip")).map(ea => ea.replace(lively4url + "/", ""));

  var list = newlist.concat(oldlist)::uniq().sort();

  await fetch(lively4url + "/.lively4bootfilelist", {
    method: "PUT",
    body: list.join("\n"
    //JSON.stringify(list).replace(/",/g,'",\n') // just a bit pretty print
    ) });
  return list;
}

export async function purgeTranspiledFiles() {
  var transpiledFiles = await Files.walkDir(lively4url + "/.transpiled/");
  var log = "";
  for (var eaURL of transpiledFiles) {
    log += await fetch(eaURL, { method: "DELETE" });
  }
  // should we make it live?
  return transpiledFiles.map(ea => ea.replace(lively4url + "/.transpiled/", ""));
}

function defaultFileList() {
  return fetch(lively4url + "/", {
    method: "OPTIONS",
    headers: {
      filelist: true
    }
  }).then(r => r.json());
}

export function deleteAssociatedTranspiledFiles(path) {
  deleteTranspiledFile(getTranspiledPath(path));
}

export function getTranspiledPath(path) {
  return ".transpiled/" + (path.substring(path.indexOf("src/"))).replace(/\//g, "_");
}

function deleteTranspiledFile(transpiledPath, log = undefined) {
  var jsURL = lively4url + "/" + transpiledPath;
  var mapURL = lively4url + "/" + transpiledPath + ".map.json";
  if(log) {
    log += "delete " + jsURL + "\n";
    log += "delete " + mapURL + "\n";
  }
  fetch(jsURL, { method: "DELETE" });
  fetch(mapURL, { method: "DELETE" });
}

export async function invalidateTranspiledFiles(files) {
  files = files || (await defaultFileList());

  var log = "";
  var map = new Map(); // make file lookup faster
  for (let file of files.contents) {
    let path = file.name.replace(/^\.\//, "");
    if (path.match(/^\.transpiled\//)) {
      map.set(path, file);
    }
  }
  for (let file of files.contents) {
    var path = file.name.replace(/^\.\//, "");
    if (path.match(/\.js$/)) {
      var transpiledPath = getTranspiledPath(path);
      var transpiled = map.get(transpiledPath);
      if (transpiled) {
        if (file.modified > transpiled.modified) {
          this.deleteTranspiledFile(transpiledPath, log);
        }
      }
    }
  }
  return log;
}

export async function invalidateOptionsFiles(files) {
  files = files || (await defaultFileList());

  var log = "";
  var map = new Map(); // make file lookup faster
  for (let file of files.contents) {
    let path = file.name.replace(/^\.\//, "");
    if (path.match(/^\.options\//)) {
      map.set(path, file);
    }
  }
  for (let file of files.contents) {
    var path = file.name.replace(/^\.\//, "");
    var optionsPath = ".options/" + path.replace(/\//g, "_");
    var opotionsFile = map.get(optionsPath);
    if (opotionsFile) {
      if (file.modified > opotionsFile.modified) {
        var optionsURL = lively4url + "/" + optionsPath;
        log += "delete " + optionsURL + "\n";
        fetch(optionsURL, { method: "DELETE" });
      }
    }
  }
  return log;
}

export async function ensureBootlistOptionsFiles() {
  var bootfiles = (await fetch(lively4url + "/" + ".lively4bootfilelist").then(r => r.text())).split("\n");
  for (var ea of bootfiles) {
    var optionsContents = await fetch(ea, {
      method: "OPTIONS"
    }).then(r => r.text());

    var optionsURL = lively4url + "/.options/" + ea.replace(/\//g, "_");
    await fetch(optionsURL, {
      method: "PUT",
      body: optionsContents,
      headers: {
        nocommit: true
      }
    });
    console.log("[files-caches] ensureBootlistOptionsFiles: updated " + ea);
  }
}

// updateCachedFilesList()


if (!navigator.serviceWorker) {
  console.warn("[files]... could not register message handler with no-existing service worker");
} else {
  lively.removeEventListener("files", navigator.serviceWorker);
  lively.addEventListener("files", navigator.serviceWorker, "message", async evt => {
    try {
      if (evt.data.name == 'swx:fech:request') {
        var map = Files.cachedFileMap();
        console.log("[files] fetch request: " + evt.data.method + " " + evt.data.url);
        self.lively4fetchLog.push({
          time: performance.now(),
          method: evt.data.method,
          url: evt.data.url
        });
      }
    } catch (err) {
      console.error("[files] error during swx message handling...", err);
    }
  });
}