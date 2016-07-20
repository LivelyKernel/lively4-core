'use strict'

var isNode = (typeof window === 'undefined');

var path, slash, child_process;

var requireHack = require;

if (isNode) {
  path = requireHack("path");
  slash = requireHack("slash");
  child_process = requireHack("child_process");
}

function send(receiver, message) {
  if (isNode) {
    receiver.send(message);
  } else {
    receiver.postMessage(message);
  }
}

function createProcess(script, cwd) {
  if (isNode) {
    let p = child_process.fork(path.join(process.cwd(), script), {
      cwd: toAbsPath(cwd),
      // pipe stdout/stderr into this process
      silent: true
    });

    // handle stdout of child
    p.stdout.on("data", (data) => {
      process.stdout.write(`[Indexing] (${cwd}) ${data}`);
    });

    // handle stderr of child
    p.stderr.on("data", (data) => {
      process.stderr.write(`[Indexing] (${cwd}) ${data}`);
    });

    return p;
  }

  // in Browser:
  return new Worker(script);
}

// Object that holds workers for server subdirectories,
// e.g. '/lively4-core'
var workers = {};
var indexStatus = {};

var promiseCallbacks = {};
var workerReadyPromise;
// rootFolder is an absolute directory to where the server serves,
// e.g. where the lively4-core folder is found
var rootFolder = null;
var idxFileName = "index.l4idx";

var curMsgId = 0;


// *** Exported methods ***

export function setRootFolder(filepath) {
  // becomes e.g. "C:/felix/bla" on Windows
  if (isNode) {
    rootFolder = slash(path.resolve(filepath));
  } else {
    rootFolder = filepath;
  }
}

export function startWorker(subdir) {
  return new Promise((resolve, reject) => {
    if (!rootFolder) {
      throw new Error("startWorker: no root folder set");
    }

    if (workers[subdir]) {
      console.log("[Indexing] Worker already exists");
      resolve();
      return;
    }

    console.log("[Indexing] Starting new worker for " + subdir);
    try {
      let script = isNode ? "lunr-node-search-worker.js" : "../lively4-server/src/lunr-es6-search-worker-wrapper.js";
      workers[subdir] = createProcess(script, subdir);
    } catch (err) {
      console.log("[Indexing] Error starting new worker for " + subdir + ": " + err);
      reject(err);
      return;
    }

    let messageHandler = function(m) {
      // web workers hide the sent message behind the data key
      if (!isNode) {
        m = m.data;
      }
      switch (m.type) {
        case "worker-ready":
          resolve();
          break;
        case "search-response":
          handleSearchResponse(m.msgId, m.message);
          break;
        case "init-response":
          handleInitResponse(m.msgId, m.message, subdir);
          break;
        case "index-status-response":
          handleIndexStatusResponse(m.msgId, m.message, subdir);
          break;
        case "error":
          console.log("[Indexing] Error (" + subdir + "): " + m.message);
          break;
        default:
          console.log("[Indexing] Unknown message:", m);
      }
    }

    if (isNode) {
      workers[subdir].on("message", messageHandler);
    } else {
      workers[subdir].onmessage = messageHandler;
    }
  });
}

function stopWorker(subdir) {
  console.log("stop", subdir);
  send(workers[subdir], {
    type: "stop"
  });

  delete workers[subdir];
  delete indexStatus[subdir];
}

export function createIndex(subdir, options) {
  return startWorker(subdir).then(() => {
    new Promise((resolve, reject) => {
      if (!rootFolder) {
        console.log("[Indexing] Cannot create index, no root folder set");
        reject("Error: no root folder set");
        return;
      }

      if (indexStatus[subdir] === "ready") {
        console.log("[Indexing] Index already exists");
        resolve();
        return;
      }

      if (indexStatus[subdir] === "indexing") {
        reject();
        return;
      }

      var msgId = getNextMsgId();
      promiseCallbacks[msgId] = {
        resolve: resolve,
        reject: reject
      };

      send(workers[subdir], {
        type: "init",
        msgId: msgId,
        options: options
      });

      indexStatus[subdir] = "indexing";
    });
  });
}

export function setup(options) {
  return new Promise((resolve, reject) => {

    let fetchStatus =  () => {
      createIndex(options.path, options).then( () => {
        resolve();
        clearInterval(interval);
      }, () => {
        console.log("[Indexing] Waiting for index: " + options.name)
      });
    };

    fetchStatus();
    let interval = setInterval(fetchStatus, 5000);
  });
}

export function search(subdir, query) {
  if (!workers[subdir]) {
    console.log("[Indexing] Cannot search, no index created for " + subdir);
    return Promise.reject();
  }

  var msgId = getNextMsgId();
  promiseCallbacks[msgId] = {};

  var p = new Promise((resolve, reject) => {
    promiseCallbacks[msgId].resolve = resolve;
    promiseCallbacks[msgId].reject = reject;
  });

  send(workers[subdir], {
    type: "search",
    msgId: msgId,
    query: query
  });

  return p;
}

export function getStatus(subdir, options) {
  return startWorker(subdir).then(() => {
    if (indexStatus[subdir]) {
      return Promise.resolve(indexStatus[subdir]);
    }
    var msgId = getNextMsgId();
    promiseCallbacks[msgId] = {};

    var p = new Promise((resolve, reject) => {
      promiseCallbacks[msgId].resolve = resolve;
      promiseCallbacks[msgId].reject = reject;
    });

    send(workers[subdir], {
      type: "checkIndexFile",
      msgId: msgId,
      options: options
    });

    return p;
  });
}

export function find(pattern) {
  return search(this.path, pattern).then( (result) => {
    return result.map( (res) => {
      res.path = join(this.path, res.ref);
      res.type = "dropbox";
      return res;
    });
  });
}

function handleSearchResponse(msgId, result) {
  if (!promiseCallbacks[msgId]) {
    console.log(`[Indexing] No promise registered for ${msgId}`);
    return;
  }

  var resolve = promiseCallbacks[msgId].resolve;
  delete promiseCallbacks[msgId];

  resolve(result);
}

function handleInitResponse(msgId, result, subdir) {
  // Worker does not send a msgId, when it had to create the
  // requested index, because the msgId was already used to
  // signal that the index did not exist.
  if (!msgId) {
    // index has been created now,
    // so next call to createIndex will resolve immediately
    indexStatus[subdir] = "ready";
    return;
  }

  if (!promiseCallbacks[msgId]) {
    // this should never happen!
    console.log(`[Indexing] No promise registered for ${msgId}`);
    return;
  }

  var resolve = promiseCallbacks[msgId].resolve;
  var reject = promiseCallbacks[msgId].reject;
  delete promiseCallbacks[msgId];

  if (result === "ready") {
    // index was requested and just had to be loaded from disk
    indexStatus[subdir] = "ready";
    resolve();
  } else {
    // index was requested, does not exist and is being built now
    indexStatus[subdir] = "indexing";
    reject();
  }
}

function handleIndexStatusResponse(msgId, result, subdir) {
  if (!promiseCallbacks[msgId]) {
    // this should never happen!
    console.log(`[Indexing] No promise registered for ${msgId}`);
    return;
  }

  var resolve = promiseCallbacks[msgId].resolve;
  delete promiseCallbacks[msgId];

  resolve(result);

  if (result === "unavailable") {
    stopWorker(subdir);
  }
}

export function addFile(serverRelPath) {
  // e.g. serverRelPath == "/lively4-core/src/client/foo.js"
  serverRelPath = slash(serverRelPath);
  // find corresponding index
  var subdir = getIndexSubdir(serverRelPath);

  if (!subdir || !workers[subdir]) {
    console.log("[Indexing] Cannot add file, no index created for " + serverRelPath);
    return;
  }

  var absPath = toAbsPath(serverRelPath);
  send(workers[subdir], {
    type: "addFile",
    idxRelPath: toIdxRelPath(subdir, absPath)
  });
}

export function removeFile(serverRelPath) {
  // e.g. serverRelPath == "/lively4-core/src/client/foo.js"
  serverRelPath = slash(serverRelPath);
  // find corresponding index
  var subdir = getIndexSubdir(serverRelPath);
  if (!subdir) {
    // no index found for the serverRelPath, so dont remove it
    return;
  }
  if (!workers[subdir]) {
    console.log("[Indexing] Cannot remove file, no index created for " + subdir);
    return;
  }

  var absPath = toAbsPath(serverRelPath);
  send(workers[subdir], {
    type: "removeFile",
    idxRelPath: toIdxRelPath(subdir, absPath)
  });
}


// *** Helper methods ***

function getIndexSubdir(filepath) {
  return Object.keys(workers).find(function(subidx) {
    return filepath.indexOf(subidx + "/") == 0;
  });
}

function toAbsPath(serverRelPath) {
  return slash(path.join(rootFolder, serverRelPath));
}

function toIdxRelPath(subdir, absPath) {
  if (!rootFolder) {
    return;
  }

  // remove e.g. <rootFolder>/lively4-core/ (including the last slash, therefore + 1)
  return slash(absPath.slice(rootFolder.length + subdir.length + 1));
}

function getNextMsgId() {
  curMsgId++;
  return curMsgId;
}

function join(path1, path2) {
  if (path1[path1.length-1] != "/") {
    path1 += "/";
  }
  if (path2[0] == "/") {
    path2 = path2.slice(1, path2.length);
  }
  return path1 + path2;
}
