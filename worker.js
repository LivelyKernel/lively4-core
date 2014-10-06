/*global jsext, require, Worker*/

/*** Usage ***

// this is just a helper function
function resultHandler(err, result) { show(err ? String(err) : result); }

// 1. Create the worker
var worker = jsext.worker.create({libURL: baseURL});

// 2. You can evaluate arbitrary JS code
worker.eval("1+2", function(err, result) { show(err ? String(err) : result); });

// 3. Arbitrary functions can be called inside the worker context.
//    Note: functions shouldn't be closures / capture local state!) and passing
//    in arguments!
worker.run(
  function(a, b, thenDo) { setTimeout(function() { thenDo(null, a+b); }, 300); },
  19, 4, resultHandler);

// 4. You can also install your own messenger services...
worker.run(
  function(thenDo) {
    self.messenger.addServices({
      foo: function(msg, messenger) { messenger.answer(msg, "bar!"); }
    });
    thenDo(null, "Service installed!");
  }, resultHandler);

// ... and call them via the messenger interface
worker.sendTo("worker", "foo", {}, resultHandler);

// 5. afterwards: shut it down
worker.close(function(err) { err && show(String(err)); alertOK("worker shutdown"); })

 */

;(function(exports) {
"use strict";

var worker = exports.worker = {

  isAvailable: typeof Worker !== 'undefined',

  _create: function(options) {
    // this function instantiates a browser worker object. We provide a
    // messenger-based interface to the pure Worker. Please use create to get an
    // improved interface to a worker

    options = options || {};

    // figure out where the other lang libs can be loaded from
    if (!options.libURL && !options.scriptsToLoad) {
      var workerScript = document.querySelector("script[src$=\"worker.js\"]");
      if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libURL: \"...\"}) to explicitly define the path!");
      options.libURL = workerScript.src.replace(/worker.js$/, '');
    }

    var workerCode = '(' + String(workerSetupCode) + ')();';
    var worker = new Worker(makeDataURI(workerCode));
    init(options, worker);
    return worker;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    // This code is triggered in the UI process directly after the
    // creation of the worker and sends the setup message to the worker
    // for initializing it.
    function init(options, worker) {
      if (!options.scriptsToLoad) {
        options.scriptsToLoad = [
          'base.js',
          'events.js',
          'collection.js',
          'function.js',
          'string.js',
          'number.js',
          'date.js',
          'object.js',
          'messenger.js',
          'worker.js'].map(function(ea) {
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
    }

    // This code is run inside the worker and bootstraps the messenger
    // interface. It also installs a console.log method since since this is not
    // available by default.
    function workerSetupCode() {
      self.onmessage = function(evt) {
        if (evt.data.command !== "setup") {
          throw new Error("expected setup to be first message!")
        }
        var options = evt.data.options || {};
        initGlobals(options);
        initWorkerInterface(options);
        initWorkerMessenger(options);
        postMessage({workerReady: true});
      }

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

      function initWorkerInterface(options) {

        self.onmessage = function(evt) {
          if (self.messenger) self.messenger.onMessage(evt.data);
          else if (evt.data.command == "close") {
            self.close();
            postMessage({type: "closed", workerReady: false});
            return;
          }
        }

        self.callStringifiedFunction = function(stringifiedFunc, args, thenDo) {
          // runs stringified function and passing args. stringifiedFunc might
          // be asynchronous if it takes an addaitional argument. In this case a
          // callback to call when the work is done is passed, otherwise thenDo
          // will be called immediatelly after creating and calling the function

          try { var func = eval('(' + stringifiedFunc + ')'); } catch (e) {
            thenDo(new Error("Cannot create function from string: " + e.stack || e));
            return;
          }

          // when it takes one more arg then we assume that this is the callback
          // to be called by the run func when it considers to be done
          var usesCallback = func.length === args.length + 1;
          var whenDone = jsext.fun.once(function(err, result) {
            self.isBusy = false; thenDo(err, result); })
          self.isBusy = true;

          if (usesCallback) args.push(whenDone);

          try { var result = func.apply(self, args.concat([whenDone])); } catch (e) {
            whenDone(e, null); return;
          }

          if (!usesCallback) whenDone(null, result);
        }

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
      }

      // setting up the worker messenger interface, this is how the worker
      // should be communicated with
      function initWorkerMessenger(options) {
        if (!options.useMessenger) return;
        if (!jsext.messenger)
          throw new Error("worker.create requires messenger.js to be loaded!")
        if (!jsext.events)
          throw new Error("worker.create requires events.js to be loaded!")

        return self.messenger = jsext.messenger.create({
          services: {

            remoteEval: function(msg, messenger) {
              try { var result = eval(msg.data.expr); } catch (e) {
                result = e.stack || e; }
              messenger.answer(msg, {result: String(result)});
            },

            run: function(msg, messenger) {
              var funcString = msg.data.func;
              var args = msg.data.args;
              if (!funcString) { messenger.answer(msg, {error: 'no funcString'}); return; }
              self.callStringifiedFunction(funcString, args, function(err, result) {
                messenger.answer(msg, {error: err ? String(err) : null, result: result});
              });
            },
            
            close: function(msg, messenger) {
              messenger.answer(msg, {status: "OK"});
              postMessage({type: "closed", workerReady: false});
              self.close(); 
            }
          },

          isOnline: function() { return true; },
          send: function(msg, whenSend) { postMessage(msg); whenSend(); },
          listen: function(messenger, whenListening) { whenListening(); },
          close: function(messenger, whenClosed) { postMessage({type: "closed", workerReady: false}); self.close(); }

        });
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

  fork: function(options, workerFunc, thenDo) {
    if (!thenDo) { thenDo = workerFunc; workerFunc = options; options = null; }
    options = options || {};
    var args = options.args || [];
    var w = worker.create(options);
    w.run.apply(w, [workerFunc].concat(args).concat(thenDo));
    return w;
  },

  create: function(options) {
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
      sendTimeout: 500,
      send: function(msg, whenSend) { messenger.worker.postMessage(msg); whenSend(); },
      listen: function(messenger, whenListening) {
        var w = messenger.worker = worker._create(options);
        exports.events.makeEmitter(w);
        worker.onReadyStateChange = function(evt) {
          var ready = !!evt.data.workerReady;
          if (ready) worker.emit("ready");
          else worker.emit("close");
        };
        w.onMessage = function(evt) {
          console.log("recevied %s", jsext.obj.inspect(evt));
          messenger.onMessage(evt.data); }
      },
      close: function(messenger, whenClosed) {
        if (!messenger.worker.ready) return whenClosed(null);
        return messenger.sendTo(workerId, 'close',  {}, function(err, answer) {
          err = err || answer.data.error;
          err && console.error("Error in worker messenger close: " + err.stack || err);
          whenClosed(err ? err : null);
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

})(typeof jsext !== 'undefined' ? jsext : require('./base').jsext);
