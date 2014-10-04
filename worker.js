/*global*/

;(function(exports) {
"use strict";

var worker = exports.worker = {

  idleTimeOfPoolWorker: 1000*10,

  isAvailable: typeof Worker !== 'undefined',

  pool: [],

  createInPool: function(options, customInitFunc) {
    options = options || {};
    var autoShutdownDelay = options.autoShutdownDelay;
    var w = worker.create(options, customInitFunc);
    if (autoShutdownDelay) {
      var shutdownCode =  "self.terminateIfNotBusyIn(" + autoShutdownDelay + ");";
      w.postMessage({command: 'eval', source: shutdownCode});
    }
    worker.pool.push(w);
    w.onReadyStateChange = function(evt) {
      if (!evt.data.workerReady)
        worker.pool = worker.pool.filter(function(ea) { return ea !== w; });
    };
    return w;
  },

  create: function(options, customInitFunc) {
    options = options || {};

    // figure out where the other lang libs can be loaded from
    if (!options.libURL && !options.scriptsToLoad) {
      var workerScript = document.querySelector("script[src$=\"worker.js\"]");
      if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libURL: \"...\"}) to explicitly define the path!");
      options.libURL = workerScript.src.replace(/worker.js$/, '');
    }

    var workerCode = '(' + String(workerSetupCode) + ')();';
    if (customInitFunc) {
      var code = '(' + String(customInitFunc) + ')();';
      workerCode += '\n' + code;
    }
    var worker = new Worker(makeDataURI(workerCode));
    init(options, worker);
    return worker;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    // This code is triggered in the UI process directly after the
    // creation of the worker and sends the setup message to the worker
    // for initializing it.
    function init(options, worker) {
      if (!options.scriptsToLoad) {
        options.scriptsToLoad = ["base.js",
          "object.js",
          "string.js",
          "function.js",
          "number.js",
          "collection.js",
          "date.js",
          "worker.js"].map(function(ea) {
            return options.libURL + ea; });
      }

      var workerOptions = Object.keys(options).reduce(function(opts, key) {
        if (typeof options[key] !== 'function') opts[key] = options[key];
        return opts;
      }, {});
      worker.postMessage({command: 'setup', options: workerOptions});

      worker.onmessage = function(evt) {
        // console.log(evt.data);
        if (evt.data.workerReady !== undefined) {
          worker.ready = !!evt.data.workerReady;
          if (worker.ready && worker.onReady) worker.onReady(evt);
          if (worker.onReadyStateChange) worker.onReadyStateChange(evt);
          return;
        }
        if (worker.onMessage) worker.onMessage(evt);
      }
      worker.errors = [];
      worker.onerror = function(evt) {
        console.error(evt);
        worker.errors.push(evt);
        if (worker.onError) worker.onError(evt);
      }
      worker.run = function(/*func, args*/) {
        var args = Array.prototype.slice.call(arguments),
            doFunc = args.shift(),
            code = '(' + doFunc + ').apply(self, evt.data.args);';
        this.basicRun({func: doFunc, args: args, useWhenDone: false});
      }
      worker.basicRun = function(options) {
        // options = {
        //   func: FUNCTION,
        //   args: ARRAY,  /*transported to worker and applied to func*/
        //   useWhenDone: BOOL
        /* If true, func receives a callback as first parameter that should be called
          with two arguments: (error, result) to indicate worker func is done. */
        var func = options.func,
            args = options.args,
            passInWhenDoneCallback = !!options.useWhenDone,
            codeTemplate = passInWhenDoneCallback ?
              'self.isBusy = true;\n'
            + 'function whenDone(err, result) { self.isBusy = false; postMessage({type: "runResponse", error: err, result: result}); }\n'
            + '(%s).apply(self, evt.data.args.concat([whenDone]));' :
              ';(%s).apply(self, evt.data.args);',
            code = codeTemplate.replace("%s", String(func));
        worker.postMessage({command: 'eval', silent: true, source: code, args: args || []});
      }
    }

    // This code is run inside the worker and initializes it. It installs
    // a console.log method since since this is not available by default.
    function workerSetupCode() {
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // yoshiki and robert, 05/08/13: Inserted code that sets up the lively context
      // and globals of Lively:
      function initGlobals(options) {
        // 1) establish required objects
        Global = this;
        Global.window = Global;
        Global.console = Global.console || (function() {
          var c = {};
          ['log', 'error', 'warn'].forEach(function(name) {
            c[name] = function(/*args*/) {
              var string = arguments[0];
              for (var i = 1; i < arguments.length; i++)
                string = string.replace('%s', arguments[i]);
              postMessage({
                type: name,
                message: ['[', name.toUpperCase(), '] ', string].join('')
              });
            };
          });
          return c;
        })();
        // 2) Load bootstrap files
        importScripts.apply(this, options.scriptsToLoad || []);
      }

      self.onmessage = function(evt) {
        if (evt.data.command == "eval") {
          var result;
          // console.log(evt.data.source);
          try { result = eval(evt.data.source); } catch (e) { result = e.stack || e; }
          if (!evt.data.silent) postMessage({type: "evalResponse", value: String(result)});
          return;
        } else if (evt.data.command == "close") {
          self.close();
          postMessage({type: "closed", workerReady: false});
          return;
        }
        if (evt.data.command !== "setup") return;
        var options = evt.data.options || {};
        initGlobals(options);
        self.httpRequest = function (options) {
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

        self.terminateIfNotBusyIn = function(ms) {
          setTimeout(function() {
            if (self.isBusy) { self.terminateIfNotBusyIn(ms); return; }
            self.postMessage({type: "closed", workerReady: false});
            self.close();
          }, ms);
        }

        postMessage({workerReady: true});
      }
    }

    function makeDataURI(codeToInclude) {
      // see http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
      var blob;
      try {
        blob = new Blob([codeToInclude]);
      } catch (e) { // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(codeToInclude);
        blob = blob.getBlob();
      }
      var urlInterface = typeof webkitURL !== 'undefined' ? webkitURL : URL;
      return urlInterface.createObjectURL(blob);
    }

  },

  fork: function(options, workerFunc) {
    if (!workerFunc) { workerFunc = options; options = null; }
    options = options || {};
    options.autoShutdownDelay = options.autoShutdownDelay || worker.idleTimeOfPoolWorker;
    var w = worker.createInPool(options);
    w.onMessage = function(evt) {
      switch (evt.data.type) {
        case 'log': case 'error': case 'warn':
          console[evt.data.type]("[WORKER] %s", evt.data.message);
          break;
        case 'runResponse':
          options.whenDone && options.whenDone(evt.data.error, evt.data.result);
          break;
        case 'evalResponse':
          console.log("[WORKER evalResponse] %s", evt.data.value);
          break;
        default:
          console.log("[WORKER unknown message] %s", evt.data.type || evt.data);
      }
    }
    w.basicRun({
      func: workerFunc,
      args: options.args || [],
      useWhenDone: true
    });
    return w;
  },

}


})(typeof jsext !== 'undefined' ? jsext : this);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// //////////////////////////////////////////////////////////
// // Simplyfying the usage of the browser's Worker object //
// //////////////////////////////////////////////////////////

// /*** Usage ***
// var worker = lively.Worker.create(function() {
//   // code inside this function is run in the worker context
//   // when the worker is created
//   setInterval(function() {
//     self.postMessage('Worker is still running...');
//   }, 1000);
//   self.postMessage("Init done!");
// });
// worker.onMessage = function(evt) { show(evt.data); }
// worker.postMessage({command: "eval", source: "3+4"}); // direct eval
// worker.run(function(a, b) { postMessage(a+b); }, 1, 2); // run with arguments
// (function() { worker.postMessage({command: "close"}); }).delay(5);
// */
