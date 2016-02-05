/*global require, Worker, URL, webkitURL, Blob, BlobBuilder, process, require*/

/*
 * A platform-independent worker interface that will spawn new processes per
 * worker (if the platform you use it on supports it).
 */
;(function(exports) {
"use strict";

var isNodejs = typeof module !== 'undefined' && module.require;

// ignore-in-doc
// Code in worker setup is evaluated in the context of workers, it will get to
// workers in a stringified form(!).
var WorkerSetup = {

  loadDependenciesBrowser: function loadDependenciesBrowser(options) {
    importScripts.apply(self, options.scriptsToLoad || []);
  },

  loadDependenciesNodejs: function loadDependenciesNodejs(options) {
    var lv = global.lively || (global.lively = {});
    lv.lang = require(require("path").join(options.libLocation, "index"));
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // yoshiki and robert, 05/08/13: Inserted code that sets up the lively context
  // and globals of Lively and other required objects:
  initBrowserGlobals: function initBrowserGlobals(options) {
    remoteWorker.send = function(msg) { postMessage(msg); };
    var Global = self.Global = self;
    Global.window = Global;
    Global.console = Global.console || (function() {
      var c = {};
      ['log', 'error', 'warn'].forEach(function(name) {
        c[name] = function(/*args*/) {
          var string = arguments[0];
          for (var i = 1; i < arguments.length; i++)
            string = string.replace('%s', arguments[i]);
          remoteWorker.send({
            type: name,
            message: ['[', name.toUpperCase(), '] ', string].join('')
          });
        };
      });
      return c;
    })();
  },

  initOnMessageHandler: function initOnMessageHandler(options) {
    if (remoteWorker.on) remoteWorker.on('message', onMessage);
    else remoteWorker.onmessage = onMessage;

    function onMessage(msg) {
      msg = msg.data.data ? msg.data : msg;
      if (remoteWorker.messenger) remoteWorker.messenger.onMessage(msg);
      else if (msg.action == "close") {
        remoteWorker.send({type: "closed", workerReady: false});
        remoteWorker.close();
        return;
      }
    }
  },

  initWorkerInterface: function initWorkerInterface(options) {
    remoteWorker.callStringifiedFunction = function(stringifiedFunc, args, thenDo) {
      // ignore-in-doc
      // runs stringified function and passing args. stringifiedFunc might
      // be asynchronous if it takes an addaitional argument. In this case a
      // callback to call when the work is done is passed, otherwise thenDo
      // will be called immediatelly after creating and calling the function

      var func;
      try { func = eval('(' + stringifiedFunc + ')'); } catch (e) {
        thenDo(new Error("Cannot create function from string: " + e.stack || e));
        return;
      }

      // ignore-in-doc
      // when it takes one more arg then we assume that this is the callback
      // to be called by the run func when it considers to be done
      var usesCallback = func.length === args.length + 1;
      var whenDone = lively.lang.fun.once(function(err, result) {
        remoteWorker.isBusy = false; thenDo(err, result); })
      remoteWorker.isBusy = true;

      if (usesCallback) args.push(whenDone);

      try { var result = func.apply(remoteWorker, args.concat([whenDone])); } catch (e) {
        whenDone(e, null); return;
      }

      if (!usesCallback) whenDone(null, result);
    }

    remoteWorker.httpRequest = function (options) {
      if (!options.url) {
        console.log("Error, httpRequest needs url");
        return;
      }
      var req = new XMLHttpRequest(),
          method = options.method || 'GET';
      function handleStateChange() {
        if (req.readyState === 4) {
          // req.status
          options.done && options.done(req);
        }
      }
      req.onreadystatechange = handleStateChange;
      req.open(method, options.url);
      req.send();
    }

    remoteWorker.terminateIfNotBusyIn = function(ms) {
      setTimeout(function() {
        if (remoteWorker.isBusy) { remoteWorker.terminateIfNotBusyIn(ms); return; }
        remoteWorker.send({type: "closed", workerReady: false});
        remoteWorker.close();
      }, ms);
    }
  },

  // ignore-in-doc
  // setting up the worker messenger interface, this is how the worker
  // should be communicated with
  initWorkerMessenger: function initWorkerMessenger(options) {
    if (!options.useMessenger) return null;
    if (!lively.lang.messenger)
      throw new Error("worker.create requires messenger.js to be loaded!")
    if (!lively.lang.events)
      throw new Error("worker.create requires events.js to be loaded!")

    return remoteWorker.messenger = lively.lang.messenger.create({
      services: {

        remoteEval: function(msg, messenger) {
          var result;
          try { result = eval(msg.data.expr); } catch (e) {
            result = e.stack || e; }
          messenger.answer(msg, {result: String(result)});
        },

        run: function(msg, messenger) {
          var funcString = msg.data.func,
              args = msg.data.args;
          if (!funcString) { messenger.answer(msg, {error: 'no funcString'}); return; }
          remoteWorker.callStringifiedFunction(funcString, args, function(err, result) {
            messenger.answer(msg, {error: err ? String(err) : null, result: result});
          });
        },

        close: function(msg, messenger) {
          messenger.answer(msg, {status: "OK"});
          remoteWorker.send({type: "closed", workerReady: false});
          remoteWorker.close();
        }
      },

      isOnline: function() { return true; },
      send: function(msg, whenSend) { remoteWorker.send(msg); whenSend(); },
      listen: function(whenListening) { whenListening(); },
      close: function(whenClosed) { remoteWorker.send({type: "closed", workerReady: false}); remoteWorker.close(); }

    });
  }

}

var BrowserWorker = {

  create: function(options) {
    // ignore-in-doc
    // this function instantiates a browser worker object. We provide a
    // messenger-based interface to the pure Worker. Please use create to get an
    // improved interface to a worker

    options = options || {};

    // ignore-in-doc
    // figure out where the other lang libs can be loaded from
    if (!options.libLocation && !options.scriptsToLoad) {
      var workerScript = document.querySelector("script[src$=\"worker.js\"]");
      if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
      options.libLocation = workerScript.src.replace(/worker.js$/, '');
    }

    var workerSetupCode = String(workerSetupFunction).replace("__FUNCTIONDECLARATIONS__", [
      WorkerSetup.initBrowserGlobals,
      WorkerSetup.loadDependenciesBrowser,
      WorkerSetup.initOnMessageHandler,
      WorkerSetup.initWorkerInterface,
      WorkerSetup.initWorkerMessenger
    ].join('\n'));
    var workerCode = '(' + workerSetupCode + ')();';
    var worker = new Worker(makeDataURI(workerCode));
    init(options, worker);
    return worker;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    // ignore-in-doc
    // This code is triggered in the UI process directly after the
    // creation of the worker and sends the setup message to the worker
    // for initializing it.
    function init(options, worker) {
      exports.events.makeEmitter(worker);

      if (!options.scriptsToLoad) {
        options.scriptsToLoad = [
          'base.js',
          'events.js',
          'object.js',
          'collection.js',
          'function.js',
          'string.js',
          'number.js',
          'date.js',
          'messenger.js',
          'worker.js'].map(function(ea) {
            return options.libLocation + ea; });
      }

      var workerOptions = Object.keys(options).reduce(function(opts, key) {
        if (typeof options[key] !== 'function') opts[key] = options[key];
        return opts;
      }, {});

      worker.onmessage = function(evt) {
        if (evt.data.workerReady !== undefined) {
          worker.ready = !!evt.data.workerReady;
          if (worker.ready) worker.emit("ready");
          else worker.emit("close");
        } else worker.emit('message', evt.data);
      }

      worker.errors = [];
      worker.onerror = function(evt) {
        console.error(evt);
        worker.errors.push(evt);
        worker.emit("error", evt)
      }

      worker.postMessage({action: 'setup', options: workerOptions});
    }

    // ignore-in-doc
    // This code is run inside the worker and bootstraps the messenger
    // interface. It also installs a console.log method since since this is not
    // available by default.
    function workerSetupFunction() {
      var remoteWorker = self;
      remoteWorker.onmessage = function(evt) {
        if (evt.data.action !== "setup") {
          throw new Error("expected setup to be first message but got " + JSON.stringify(evt.data))
        }
        var options = evt.data.options || {};
        initBrowserGlobals(options);
        loadDependenciesBrowser(options);
        initOnMessageHandler(options);
        initWorkerInterface(options);
        initWorkerMessenger(options);
        postMessage({workerReady: true});
      }
      __FUNCTIONDECLARATIONS__
    }

    function makeDataURI(codeToInclude) {
      // ignore-in-doc
      // see http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
      var blob;
      try {
        blob = new Blob([codeToInclude], {type : "text/javascript"});
      } catch (e) { /* ignore-in-doc Backwards-compatibility*/
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(codeToInclude);
        blob = blob.getBlob();
      }
      var urlInterface = typeof webkitURL !== 'undefined' ? webkitURL : URL;
      return urlInterface.createObjectURL(blob);
    }

  }

}

var NodejsWorker = {

  debug: false,
  initCodeFileCreated: false,

  create: function(options) {
    options = options || {};

    // ignore-in-doc
    // figure out where the other lang libs can be loaded from
    // if (!options.libLocation && !options.scriptsToLoad) {
    //   var workerScript = document.querySelector("script[src$=\"worker.js\"]");
    //   if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
    //   options.libLocation = workerScript.src.replace(/worker.js$/, '');
    // }

    var workerProc;
    var worker = exports.events.makeEmitter({
      ready: false,
      errors: [],

      postMessage: function(msg) {
        if (!workerProc) {
          worker.emit("error", new Error('nodejs worker process not yet created'));
          return;
        }
        if (!worker.ready) {
          worker.emit("error", new Error('nodejs worker process not ready or already closed'));
          return;
        }
        workerProc.send(msg);
      }
    });

    NodejsWorker.startWorker(options, function(err, _workerProc) {
      if (err) { worker.ready = false; worker.emit("error", err); return; }

      workerProc = _workerProc;

      workerProc.on('message', function(m) {
        NodejsWorker.debug && console.log('[WORKER PARENT] got message:', m);
        worker.emit("message", m);
      });

      workerProc.on('close', function() {
        console.log("[WORKER PARENT] worker closed");
        worker.emit("close");
      });

      workerProc.on('error', function(err) {
        console.log("[WORKER PARENT] error ", err);
        worker.errors.push(err);
        worker.emit("error", err);
      });

      worker.ready = true;
      worker.emit("ready");
    });

    return worker;
  },

  // this code is run in the context of the worker process
  workerSetupFunction: function workerSetupFunction() {
    var remoteWorker = process;
    var debug = true;
    var close = false;

    debug && console.log("[WORKER] Starting init");
    // ignore-in-doc
    // process.on('message', function(m) {
    //   debug && console.log('[WORKER] got message:', m);
    //   if (m.action === 'ping') process.send({action: 'pong', data: m});
    //   else if (m.action === 'close') close = true;
    //   else if (m.action === 'setup') setup(m.data);
    //   else console.error('[WORKER] unknown message: ', m);
    // });

    remoteWorker.on("message", function(msg) {
      if (msg.action !== "setup") {
        throw new Error("expected setup to be first message but got " + JSON.stringify(msg.data))
      }
      remoteWorker.removeAllListeners("message");
      var options = msg.data.options || {};
      debug && console.log("[WORKER] running setup with options", options);
      loadDependenciesNodejs(options);
      initOnMessageHandler(options);
      initWorkerInterface(options);
      initWorkerMessenger(options);
      remoteWorker.send({workerReady: true});
    })
    __FUNCTIONDECLARATIONS__
  },

  ensureInitCodeFile: function(options, initCode, thenDo) {
    var path = require("path");
    var os = require("os");
    var fs = require("fs");

    var workerTmpDir = path.join(os.tmpDir(), 'lively-nodejs-workers/');
    var fn = path.join(workerTmpDir, 'nodejs-worker-init.js');

    if (!NodejsWorker.initCodeFileCreated) NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
    else fs.exists(fn, function(exists) {
      if (exists) thenDo(null, fn);
      else NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
    });
  },

  createWorkerCodeFile: function(options, fileName, initCode, thenDo) {
    var path = require("path");
    var fs = require("fs");
    var exec = require("child_process").exec;

    exec("mkdir -p " + path.dirname(fileName), function(code, out, err) {
      if (code) {
        thenDo(new Error(["[WORKER PARENT] Could not create worker temp dir:", out, err].join('\n')))
        return;
      }
      fs.writeFile(fileName, initCode, function(err) {
        NodejsWorker.debug && console.log('worker code file %s created', fileName);
        NodejsWorker.initCodeFileCreated = true;
        thenDo(err, fileName); });
    });
  },

  startWorker: function(options, thenDo) {
    var util = require("util");
    var fork = require("child_process").fork;

    var workerSetupCode = String(NodejsWorker.workerSetupFunction).replace("__FUNCTIONDECLARATIONS__", [
      WorkerSetup.loadDependenciesNodejs,
      WorkerSetup.initOnMessageHandler,
      WorkerSetup.initWorkerInterface,
      WorkerSetup.initWorkerMessenger
    ].join('\n'));

    var initCode = util.format("(%s)();\n", workerSetupCode);
    NodejsWorker.ensureInitCodeFile(options, initCode, function(err, codeFileName) {
      if (err) return thenDo(err);
      var worker = fork(codeFileName, {});
      NodejsWorker.debug && console.log('worker forked');
      worker.on('message', function(m) {
        if (m.action === 'pong') console.log("[WORKER pong] ", m);
        else if (m.action === 'log') console.log("[Message from WORKER] ", m.data);
      });
      worker.once('message', function(m) {
        NodejsWorker.debug && console.log('worker setup done');
        thenDo(null, worker, m);
      });
      worker.on('close', function() {
        NodejsWorker.debug && console.log("[WORKER PARENT] worker closed");
      });
      worker.send({action: "setup", data: {options: options}});
      global.WORKER = worker;
    });
  }

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// the worker interface, usable both in browser and node.js contexts
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
Worker objects allow to fork processes in both Web and node.js JavaScript
environments. They provide this mechanism using web workers in the browser and
node.js child processes in node.js. The interface is unified for all platforms.
 */
var worker = exports.worker = {

  fork: function(options, workerFunc, thenDo) {
    // Fork automatically starts a worker and calls `workerFunc`. `workerFunc`
    // gets as a last paramter a callback, that, when invoked with an error and
    // result object, ends the worker execution.
    //
    // Options are the same as in `create` except for an `args` property that
    // can be an array of objects. These objects will be passed to `workerFunc`
    // as arguments.
    //
    // Note: `workerFunc` will not be able to capture outside variables (create a
    // closure).
    //
    // Example:
    // // When running this inside a browser: Note how the UI does not block.
    // worker.fork({args: [40]},
    //   function(n, thenDo) {
    //     function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
    //     thenDo(null, fib(n));
    //   },
    //   function(err, result) { show(err ? err.stack : result); })

    if (!thenDo) { thenDo = workerFunc; workerFunc = options; options = null; }
    options = options || {};
    var args = options.args || [];
    var w = worker.create(options);
    w.run.apply(w, [workerFunc].concat(args).concat(thenDo));
    return w;
  },

  create: function(options) {
    // Explicitly creates a first-class worker. Options:
    // ```js
    // {
    //   workerId: STRING, // optional, id for worker, will be auto assigned if not provided
    //   libLocation: STRING, // optional, path to where the lively.lang lib is located. Worker will try to find it automatically if not provided.
    //   scriptsToLoad: ARRAY // optional, list of path/urls to load. Overwrites `libLocation`
    // }
    // ```
    //
    // Example:
    // // this is just a helper function
    // function resultHandler(err, result) { alert(err ? String(err) : result); }
    //
    // // 1. Create the worker
    // var worker = lively.lang.worker.create({libLocation: baseURL});
    //
    // // 2. You can evaluate arbitrary JS code
    // worker.eval("1+2", function(err, result) { show(err ? String(err) : result); });
    //
    // // 3. Arbitrary functions can be called inside the worker context.
    // //    Note: functions shouldn't be closures / capture local state!) and passing
    // //    in arguments!
    // worker.run(
    //   function(a, b, thenDo) { setTimeout(function() { thenDo(null, a+b); }, 300); },
    //   19, 4, resultHandler);
    //
    // // 4. You can also install your own messenger services...
    // worker.run(
    //   function(thenDo) {
    //     self.messenger.addServices({
    //       foo: function(msg, messenger) { messenger.answer(msg, "bar!"); }
    //     });
    //     thenDo(null, "Service installed!");
    //   }, resultHandler);
    //
    // // ... and call them via the messenger interface
    // worker.sendTo("worker", "foo", {}, resultHandler);
    //
    // // 5. afterwards: shut it down
    // worker.close(function(err) { err && show(String(err)); alertOK("worker shutdown"); })

    options = options || {};
    options.useMessenger = true;

    if (!exports.messenger)
      throw new Error("worker.create requires messenger.js to be loaded!")
    if (!exports.events)
      throw new Error("worker.create requires events.js to be loaded!")
    if (!exports.obj)
      throw new Error("worker.create requires object.js to be loaded!")

    var workerId = options.workerId || exports.string.newUUID();

    var messenger = exports.messenger.create({
      sendTimeout: 5000,

      send: function(msg, whenSend) {
        messenger.worker.postMessage(msg);
        whenSend();
      },

      listen: function(whenListening) {
        var w = messenger.worker = isNodejs ? NodejsWorker.create(options) : BrowserWorker.create(options);
        w.on("message", function(msg) { messenger.onMessage(msg); });
        w.on('ready', function() { NodejsWorker.debug && console.log("WORKER READY!!!"); });
        w.on('close', function() { NodejsWorker.debug && console.log("WORKER CLOSED...!!!") ;});
        w.once('ready', whenListening);
      },

      close: function(whenClosed) {
        if (!messenger.worker.ready) return whenClosed(null);
        return messenger.sendTo(workerId, 'close', {}, function(err, answer) {
          err = err || answer.data.error;
          err && console.error("Error in worker messenger close: " + err.stack || err);
          if (err) whenClosed(err);
          else {
            var closed = false;
            messenger.worker.once('close', function() { closed = true; });
            exports.fun.waitFor(1000, function() { return !!closed; }, whenClosed);
          }
        });
      },

      isOnline: function() { return messenger.worker && messenger.worker.ready; }

    });

    exports.obj.extend(messenger, {

      eval: function(code, thenDo) {
        messenger.sendTo(workerId, "remoteEval", {expr: code}, function(err, answer) {
          thenDo(err, answer ? answer.data.result : null);
        });
      },

      run: function(/*runFunc, arg1, ... argN, thenDo*/) {
        var args = Array.prototype.slice.call(arguments),
            workerFunc = args.shift(),
            thenDo = args.pop();
        if (typeof workerFunc !== "function") throw new Error("run: no function that should run in worker passed");
        if (typeof thenDo !== "function") throw new Error("run: no callback passed");

        return messenger.sendTo(workerId, 'run',  {func: String(workerFunc), args: args}, function(err, answer) {
          thenDo(err || answer.data.error, answer ? answer.data.result : null);
        });
      }

    });

    messenger.listen();

    return messenger;
  }
}

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
