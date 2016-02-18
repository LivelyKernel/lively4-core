/*global clearTimeout, setTimeout*/

/*
 * Abstractions around first class functions like augmenting and inspecting
 * functions as well as to control function calls like dealing with asynchronous
 * control flows.
 */

;(function(exports) {
"use strict";

// show-in-doc
var fun = exports.fun = {

  // -=-=-=-=-=-=-=-=-
  // static functions
  // -=-=-=-=-=-=-=-=-

  get Empty() { /*`function() {}`*/ return function() {}; },
  get K() { /*`function(arg) { return arg; }`*/ return function(arg) { return arg; }; },
  get Null() { /*`function() { return null; }`*/ return function() { return null; }; },
  get False() { /*`function() { return false; }`*/ return function() { return false; }; },
  get True() { /*`function() { return true; }`*/ return function() { return true; }; },
  get notYetImplemented() { return function() { throw new Error('Not yet implemented'); }; },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-
  all: function(object) {
    // Returns all property names of `object` that reference a function.
    // Example:
    // var obj = {foo: 23, bar: function() { return 42; }};
    // fun.all(obj) // => ["bar"]
    var a = [];
    for (var name in object) {
      if (!object.__lookupGetter__(name)
       && typeof object[name] === 'function') a.push(name);
    }
    return a;
  },

  own: function(object) {
    // Returns all local (non-prototype) property names of `object` that
    // reference a function.
    // Example:
    // var obj1 = {foo: 23, bar: function() { return 42; }};
    // var obj2 = {baz: function() { return 43; }};
    // obj2.__proto__ = obj1
    // fun.own(obj2) // => ["baz"]
    // /*vs.*/ fun.all(obj2) // => ["baz","bar"]
    var a = [];
    for (var name in object) {
      if (!object.__lookupGetter__(name)
       && object.hasOwnProperty(name)
       && typeof object[name] === 'function') a.push(name);
    }
    return a;
  },

  // -=-=-=-=-=-
  // inspection
  // -=-=-=-=-=-

  argumentNames: function(f) {
    // Example:
    // fun.argumentNames(function(arg1, arg2) {}) // => ["arg1","arg2"]
    // fun.argumentNames(function(/*var args*/) {}) // => []
    if (f.superclass) return []; // it's a class...
    var src = f.toString(), names = "",
        arrowMatch = src.match(/(?:\(([^\)]*)\)|([^\(\)-+!]+))\s*=>/);
    if (arrowMatch) names = arrowMatch[1] || arrowMatch[2] || "";
    else {
      var headerMatch = src.match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
      console.log(headerMatch);
      if (headerMatch && headerMatch[1]) names = headerMatch[1];
    }
    return names.replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
                .replace(/\s+/g, '').split(',')
                .map(function(ea) { return ea.trim(); })
                .filter(function(name) { return !!name; });
  },

  qualifiedMethodName: function(f) {
    // ignore-in-doc
    var objString = "";
    if (f.declaredClass) {
      objString += f.declaredClass + '>>';
    } else if (f.declaredObject) {
      objString += f.declaredObject + '.';
    }
    return objString + (f.methodName || f.displayName || f.name || "anonymous");
  },

  extractBody: function(func) {
    // Returns the body of func as string, removing outer function code and
    // superflous indent. Useful when you have to stringify code but not want
    // to construct strings by hand.
    // Example:
    // fun.extractBody(function(arg) {
    //   var x = 34;
    //   alert(2 + arg);
    // }) => "var x = 34;\nalert(2 + arg);"
    var codeString = String(func)
        .replace(/^function[^\{]+\{\s*/, '')
        .replace(/\}$/, '')
        .trim();
    var indent = codeString.split(/\n|\r/)
        .map(function(line) { var m = line.match(/^\s*/); return m && m[0]; })
        .filter(function(ea) { return !!ea; })
        .reduce(function(indent, ea) { return ea.length < indent.length ? ea : indent; });
    return codeString.replace(new RegExp("^" + indent, 'gm'), '');
  },

  // -=-=-=-
  // timing
  // -=-=-=-

  timeToRun: function(func) {
    // returns synchronous runtime of calling `func` in ms
    // Example:
    // fun.timeToRun(function() { new WebResource("http://google.de").beSync().get() });
    // // => 278 (or something else...)
    var startTime = Date.now();
    func();
    return Date.now() - startTime;
  },

  timeToRunN: function(func, n) {
    // Like `timeToRun` but calls function `n` times instead of once. Returns
    // the average runtime of a call in ms.
    var startTime = Date.now();
    for (var i = 0; i < n; i++) func();
    return (Date.now() - startTime) / n;
  },

  delay: function(func, timeout/*, arg1...argN*/) {
    // Delays calling `func` for `timeout` seconds(!).
    // Example:
    // (function() { alert("Run in the future!"); }).delay(1);
    var args = Array.prototype.slice.call(arguments),
        __method = args.shift(),
        timeout = args.shift() * 1000;
    return setTimeout(function delayed() {
      return __method.apply(__method, args);
    }, timeout);
  },

  // these last two methods are Underscore.js 1.3.3 and are slightly adapted
  // Underscore.js license:
  // (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  // Underscore is distributed under the MIT license.

  throttle: function(func, wait) {
    // Exec func at most once every wait ms even when called more often
    // useful to calm down eagerly running updaters and such.
    // Example:
    // var i = 0;
    // var throttled = fun.throttle(function() { alert(++i + '-' + Date.now()) }, 500);
    // Array.range(0,100).forEach(function(n) { throttled() });
    var context, args, timeout, throttling, more, result,
        whenDone = fun.debounce(wait, function() { more = throttling = false; });
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  },

  debounce: function(wait, func, immediate) {
    // Call `func` after `wait` milliseconds elapsed since the last invocation.
    // Unlike `throttle` an invocation will restart the wait period. This is
    // useful if you have a stream of events that you want to wait for to finish
    // and run a subsequent function afterwards. When you pass arguments to the
    // debounced functions then the arguments from the last call will be use for
    // the invocation.
    //
    // With `immediate` set to true, immediately call `func` but when called again during `wait` before
    // wait ms are done nothing happens. E.g. to not exec a user invoked
    // action twice accidentally.
    // Example:
    // var start = Date.now();
    // var f = fun.debounce(200, function(arg1) {
    //   alert("running after " + (Date.now()-start) + "ms with arg " + arg1);
    // });
    // f("call1");
    // fun.delay(f.curry("call2"), 0.1);
    // fun.delay(f.curry("call3"), 0.15);
    // // => Will eventually output: "running after 352ms with arg call3"
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttleNamed: function(name, wait, func) {
    // Like `throttle` but remembers the throttled function once created and
    // repeated calls to `throttleNamed` with the identical name will use the same
    // throttled function. This allows to throttle functions in a central place
    // that might be called various times in different contexts without having to
    // manually store the throttled function.
    var store = fun._throttledByName || (fun._throttledByName = {});
    if (store[name]) return store[name];
    function throttleNamedWrapper() {
      // ignore-in-doc, cleaning up
      fun.debounceNamed(name, wait, function() { delete store[name]; })();
      func.apply(this, arguments);
    }
    return store[name] = fun.throttle(throttleNamedWrapper, wait);
  },

  debounceNamed: function(name, wait, func, immediate) {
    // Like `debounce` but remembers the debounced function once created and
    // repeated calls to `debounceNamed` with the identical name will use the same
    // debounced function. This allows to debounce functions in a central place
    // that might be called various times in different contexts without having to
    // manually store the debounced function.
    var store = fun._debouncedByName || (fun._debouncedByName = {});
    if (store[name]) return store[name];
    function debounceNamedWrapper() {
      // ignore-in-doc, cleaning up
      delete store[name];
      func.apply(this, arguments);
    }
    return store[name] = fun.debounce(wait, debounceNamedWrapper, immediate);
  },

  createQueue: function(id, workerFunc) {
    // A simple queue with an attached asynchronous `workerFunc` to process
    // queued tasks. Calling `createQueue` will return an object with the
    // following interface:
    // ```js
    // {
    //   push: function(task) {/**/},
    //   pushAll: function(tasks) {/**/},
    //   handleError: function(err) {}, // Overwrite to handle errors
    //   dran: function() {}, // Overwrite to react when the queue empties
    // }
    // Example:
    // var sum = 0;
    // var q = fun.createQueue("example-queue", function(arg, thenDo) { sum += arg; thenDo(); });
    // q.pushAll([1,2,3]);
    // queues will be remembered by their name
    // fun.createQueue("example-queue").push(4);
    // sum // => 6

    var store = fun._queues || (fun._queues = {});

    var queue = store[id] || (store[id] = {
        _workerActive: false,
        worker: workerFunc, tasks: [],
        drain: null, // can be overwritten by a function
        push: function(task) {
          queue.tasks.push(task);
          queue.activateWorker();
        },
        pushAll: function(tasks) {
          tasks.forEach(function(ea) { queue.tasks.push(ea); });
          queue.activateWorker();
        },
        pushNoActivate: function(task) {
          queue.tasks.push(task);
        },
        handleError: function(err) {
          // can be overwritten
          err && console.error('Error in queue: ' + err);
        },
        activateWorker: function() {
          function callback(err) { queue.handleError(err); queue.activateWorker(); }
          var tasks = queue.tasks, active = queue._workerActive;
          if (tasks.length === 0) {
            if (active) {
              queue._workerActive = false;
              if (typeof queue.drain === 'function') queue.drain();
            }
            delete store[id];
          } else {
            if (!active) queue._workerActive = true;
            try {
              queue.worker(tasks.shift(), callback);
            } catch(err) { callback(err); }
          }
        }
    });

    return queue;
  },

  workerWithCallbackQueue: function(id, workerFunc, optTimeout) {
    // This functions helps when you have a long running computation that
    // multiple call sites (independent from each other) depend on. This
    // function does the housekeeping to start the long running computation
    // just once and returns an object that allows to schedule callbacks
    // once the workerFunc is done.
    // Example:
    // var worker = fun.workerWithCallbackQueue("example",
    //   function slowFunction(thenDo) {
    //     var theAnswer = 42;
    //     setTimeout(function() { thenDo(null, theAnswer); });
    //   });
    // // all "call sites" depend on `slowFunction` but don't have to know about
    // // each other
    // worker.whenDone(function callsite1(err, theAnswer) { alert("callback1: " + theAnswer); })
    // worker.whenDone(function callsite2(err, theAnswer) { alert("callback2: " + theAnswer); })
    // fun.workerWithCallbackQueue("example").whenDone(function callsite3(err, theAnswer) { alert("callback3: " + theAnswer); })
    // // => Will eventually show: callback1: 42, callback2: 42 and callback3: 42


    // ignore-in-doc
    // This is how it works:
    // If `id` does not exist, workerFunc is called, otherwise ignored.
    // workerFunc is expected to call thenDoFunc with arguments: error, arg1, ..., argN
    // if called subsequently before workerFunc is done, the other thenDoFunc
    // will "pile up" and called with the same arguments as the first
    // thenDoFunc once workerFunc is done
    var store = fun._queueUntilCallbacks || (fun._queueUntilCallbacks = {}),
        queueCallbacks = store[id],
        isRunning = !!queueCallbacks;

    if (isRunning) return queueCallbacks;

    var callbacksRun = false, canceled = false;

    function cleanup() {
      if (timeoutProc) clearTimeout(timeoutProc);
      callbacksRun = true;
      delete store[id];
    }

    function runCallbacks(args) {
      if (callbacksRun) return;
      cleanup();
      queueCallbacks.callbacks.forEach(function(cb) {
        try { cb.apply(null, args); } catch (e) {
          console.error(
              "Error when invoking callbacks in queueUntil ["
            + id + "]:\n"
            + (String(e.stack || e)));
        }
      });
    }

    // timeout
    if (optTimeout) {
      var timeoutProc = setTimeout(function() {
        if (callbacksRun) return;
        runCallbacks([new Error("timeout")]);
      }, optTimeout);
    }

    // init the store
    queueCallbacks = store[id] = {
      callbacks: [],
      cancel: function() {
        canceled = true;
        cleanup();
      },
      whenDone: function(cb) {
        queueCallbacks.callbacks.push(cb);
        return queueCallbacks;
      }
    };

    // call worker, but delay so we can immediately return
    setTimeout(function() {
      if (canceled) return;
      try {
        workerFunc(function(/*args*/) { runCallbacks(arguments); });
      } catch (e) { runCallbacks([e]); }
    }, 0);

    return queueCallbacks;
  },

  _composeAsyncDefaultEndCallback: function _composeAsyncDefaultEndCallback(err, arg1/*err + args*/) {
    if (err) console.error("lively.lang.fun.composeAsync error", err);
  },

  composeAsync: function(/*functions*/) {
    // Composes functions that are asynchronous and expecting continuations to
    // be called in node.js callback style (error is first argument, real
    // arguments follow).
    // A call like `fun.composeAsync(f,g,h)(arg1, arg2)` has a flow of control like:
    //  `f(arg1, arg2, thenDo1)` -> `thenDo1(err, fResult)`
    // -> `g(fResult, thenDo2)` -> `thenDo2(err, gResult)` ->
    // -> `h(fResult, thenDo3)` -> `thenDo2(err, hResult)`
    // Example:
    // fun.composeAsync(
    //   function(a,b, thenDo) { thenDo(null, a+b); },
    //   function(x, thenDo) { thenDo(x*4); }
    //  )(3,2, function(err, result) { alert(result); });

    var toArray = Array.prototype.slice,
        functions = toArray.call(arguments),
        defaultEndCb = fun._composeAsyncDefaultEndCallback,
        endCallback = defaultEndCb,
        endSuccess, endFailure,
        endPromise = new Promise(function(resolve, reject) {
          endSuccess = resolve; endFailure = reject; });

    return functions.reverse().reduce(function(prevFunc, funcOrPromise, i) {

      var nextActivated = false;
      return function() {
        var args = toArray.call(arguments);

        // ignore-in-doc
        // the last arg needs to be function, discard all non-args
        // following it. This allows to have an optional callback func that can
        // even be `undefined`, e.g. when calling this func from a callsite
        // using var args;
        if (endCallback === defaultEndCb && i === functions.length-1/*first function*/) {
          while (args.length && typeof args[args.length-1] !== 'function') args.pop();
          if (typeof args[args.length-1] === 'function') endCallback = args.pop();
        }

        function next(/*err and args*/) {
          nextActivated = true;
          var args = toArray.call(arguments),
              err = args.shift();
          if (err) { endCallback(err); endFailure(err); }
          else prevFunc.apply(null, args);
        }

        if (typeof funcOrPromise === "function") {
          try {
            var result = funcOrPromise.apply(this, args.concat([next]));
            if (result && typeof result.then === "function" && typeof result.catch === "function") {
              result
                .then(function(value) { return next(null, value); })
                .catch(function(err) { return next(err); });
            }
          } catch (e) {
            console.error('composeAsync: ', e.stack || e);
            if (!nextActivated) { endCallback(e); endFailure(e); }
          }
        } else if (funcOrPromise && typeof funcOrPromise.then === "function" && typeof funcOrPromise.catch === "function") {
          funcOrPromise
            .then(function(value) { next(null, value); })
            .catch(function(err) { next(err); })
        } else {
          var err = new Error("Invalid argument to composeAsync: " + funcOrPromise);
          endCallback(err);
          endFailure(err);
        }

        return endPromise;
      }
    }, function() {
      var args = toArray.call(arguments);
      endCallback.apply(null, [null].concat(args));
      endSuccess(args[0]);
    });
  },

  compose: function(/*functions*/) {
    // Composes synchronousefunctions:
    // `fun.compose(f,g,h)(arg1, arg2)` = `h(g(f(arg1, arg2)))`
    // Example:
      // fun.compose(
      //   function(a,b) { return a+b; },
      //   function(x) {return x*4}
      // )(3,2) // => 20

    var functions = Array.prototype.slice.call(arguments);
    return functions.reverse().reduce(
      function(prevFunc, func) {
        return function() {
          return prevFunc(func.apply(this, arguments));
        }
      }, function(x) { return x; });
  },

  flip: function(f) {
    // Swaps the first two args
    // Example:
    // fun.flip(function(a, b, c) {
    //   return a + b + c; })(' World', 'Hello', '!') // => "Hello World!"
    return function flipped(/*args*/) {
      var args = Array.prototype.slice.call(arguments),
        flippedArgs = [args[1], args[0]].concat(args.slice(2));
      return f.apply(null, flippedArgs);
    }
  },

  withNull: function(func) {
    // returns a modified version of func that will have `null` always curried
    // as first arg. Usful e.g. to make a nodejs-style callback work with a
    // then-able:
    // Example:
    // promise.then(fun.withNull(cb)).catch(cb);
    func = func || function() {};
    return function(/*args*/) {
      var args = lively.lang.arr.from(arguments);
      func.apply(null, [null].concat(args))
    }
  },

  waitFor: function(timeoutMs, waitTesterFunc, thenDo) {
    // Wait for waitTesterFunc to return true, then run thenDo, passing
    // failure/timout err as first parameter. A timout occurs after
    // timeoutMs. During the wait period waitTesterFunc might be called
    // multiple times.
    var start = Date.now();
    var timeStep = 50;
    if (!thenDo) {
      thenDo = waitTesterFunc;
      waitTesterFunc = timeoutMs;
      timeoutMs = undefined;
    }
    (function test() {
      if (waitTesterFunc()) return thenDo();
      if (timeoutMs) {
        var duration = Date.now() - start,
            timeLeft = timeoutMs - duration;
        if (timeLeft <= 0) return thenDo(new Error('timeout'));
        if (timeLeft < timeStep) timeStep = timeLeft;
      }
      setTimeout(test, timeStep);
    })();
  },

  waitForAll: function(options, funcs, thenDo) {
    // Wait for multiple asynchronous functions. Once all have called the
    // continuation, call `thenDo`.
    // options can be: `{timeout: NUMBER}` (how long to wait in milliseconds).

    if (!thenDo) { thenDo = funcs; funcs = options; options = null; }
    options = options || {};

    var results = funcs.map(function() { return null; });
    if (!funcs.length) { thenDo(null, results); return; }

    var leftFuncs = Array.prototype.slice.call(funcs);

    funcs.forEach(function(f, i) {
      try {
        f(function(/*err and args*/) {
          var args = Array.prototype.slice.call(arguments);
          var err = args.shift();
          markAsDone(f, i, err, args);
        });
      } catch (e) { markAsDone(f, i, e, null); }
    });

    if (options.timeout) {
      setTimeout(function() {
        if (!leftFuncs.length) return;
        var missing = results
          .map(function(ea, i) { return ea === null && i; })
          .filter(function(ea) { return typeof ea === 'number'; })
          .join(', ');
        var err = new Error("waitForAll timed out, functions at " + missing + " not done");
        markAsDone(null, null, err, null);
      }, options.timeout);
    }

    function markAsDone(f, i, err, result) {
      if (!leftFuncs.length) return;

      var waitForAllErr = null;
      var fidx = leftFuncs.indexOf(f);
      (fidx > -1) && leftFuncs.splice(fidx, 1);
      if (err) {
        leftFuncs.length = 0;
        waitForAllErr = new Error("in waitForAll at"
          + (typeof i === 'number' ? " " + i : "")
          + ": \n" + (err.stack || String(err)));
      } else if (result) results[i] = result;
      if (!leftFuncs.length) setTimeout(function() {
        thenDo(waitForAllErr, results);
      }, 0);
    }
  },

  // -=-=-=-=-
  // wrapping
  // -=-=-=-=-

  curry: function(func, arg1, arg2, argN/*func and curry args*/) {
    // Return a version of `func` with args applied.
    // Example:
    // var add1 = (function(a, b) { return a + b; }).curry(1);
    // add1(3) // => 4

    if (arguments.length <= 1) return arguments[0];
    var args = Array.prototype.slice.call(arguments),
        func = args.shift();
    function wrappedFunc() {
      return func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = func;
    return wrappedFunc;
  },

  wrap: function(func, wrapper) {
    // A `wrapper` is another function that is being called with the arguments
    // of `func` and a proceed function that, when called, runs the originally
    // wrapped function.
    // Example:
    // function original(a, b) { return a+b }
    // var wrapped = fun.wrap(original, function logWrapper(proceed, a, b) {
    //   alert("original called with " + a + "and " + b);
    //   return proceed(a, b);
    // })
    // wrapped(3,4) // => 7 and a message will pop up
    var __method = func;
    var wrappedFunc = function wrapped() {
      var args = Array.prototype.slice.call(arguments);
      var wrapperArgs = wrapper.isWrapper ?
        args : [__method.bind(this)].concat(args);
      return wrapper.apply(this, wrapperArgs);
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = __method;
    return wrappedFunc;
  },

  getOriginal: function(func) {
    // Get the original function that was augmented by `wrap`. `getOriginal`
    // will traversed as many wrappers as necessary.
    while (func.originalFunction) func = func.originalFunction;
    return func;
  },

  wrapperChain: function(method) {
      // Function wrappers used for wrapping, cop, and other method
      // manipulations attach a property "originalFunction" to the wrapper. By
      // convention this property references the wrapped method like wrapper
      // -> cop wrapper -> real method.
      // tThis method gives access to the linked list starting with the outmost
      // wrapper.
      var result = [];
      do {
          result.push(method);
          method = method.originalFunction;
      } while (method);
      return result;
  },

  replaceMethodForOneCall: function(obj, methodName, replacement) {
    // Change an objects method for a single invocation.
    // Example:
    // var obj = {foo: function() { return "foo"}};
    // lively.lang.fun.replaceMethodForOneCall(obj, "foo", function() { return "bar"; });
    // obj.foo(); // => "bar"
    // obj.foo(); // => "foo"
    replacement.originalFunction = obj[methodName];
    var reinstall = obj.hasOwnProperty(methodName);
    obj[methodName] = function() {
      if (reinstall) obj[methodName] = replacement.originalFunction
      else delete obj[methodName];
      return replacement.apply(this, arguments);
    };
    return obj;
  },

  once: function(func) {
    // Ensure that `func` is only executed once. Multiple calls will not call
    // `func` again but will return the original result.
    if (!func) return undefined;
    if (typeof func !== 'function')
      throw new Error("fun.once() expecting a function");
    var invoked = false, result;
    return function() {
      if (invoked) return result;
      invoked = true;
      return result = func.apply(this, arguments);
    }
  },

  either: function(/*funcs*/) {
    // Accepts multiple functions and returns an array of wrapped
    // functions. Those wrapped functions ensure that only one of the original
    // function is run (the first on to be invoked).
    //
    // This is useful if you have multiple asynchronous choices of how the
    // control flow might continue but want to ensure that a continuation
    // is  only triggered once, like in a timeout situation:
    //
    // ```js
    // function outerFunction(callback) {
    //   function timeoutAction() { callback(new Error('timeout!')); }
    //   function otherAction() { callback(null, "All OK"); }
    //   setTimeout(timeoutAction, 200);
    //   doSomethingAsync(otherAction);
    // }
    // ```
    //
    // To ensure that `callback` only runs once you would normally have to write boilerplate like this:
    //
    // ```js
    // var ran = false;
    // function timeoutAction() { if (ran) return; ran = true; callback(new Error('timeout!')); }
    // function otherAction() { if (ran) return; ran = true; callback(null, "All OK"); }
    // ```
    //
    // Since this can get tedious an error prone, especially if more than two choices are involved, `either` can be used like this:
    // Example:
    // function outerFunction(callback) {
    //   var actions = fun.either(
    //     function() { callback(new Error('timeout!')); },
    //     function() { callback(null, "All OK"); });
    //   setTimeout(actions[0], 200);
    //   doSomethingAsync(actions[1]);
    // }
    var funcs = Array.prototype.slice.call(arguments), wasCalled = false;
    return funcs.map(function(func) {
      return function() {
        if (wasCalled) return undefined;
        wasCalled = true;
        return func.apply(this, arguments);
      }
    });
  },

  eitherNamed: function(name, func) {
    // Works like [`either`](#) but usage does not require to wrap all
    // functions at once:
    // Example:
    // var log = "", name = "either-example-" + Date.now();
    // function a() { log += "aRun"; };
    // function b() { log += "bRun"; };
    // function c() { log += "cRun"; };
    // setTimeout(fun.eitherNamed(name, a), 100);
    // setTimeout(fun.eitherNamed(name, b), 40);
    // setTimeout(fun.eitherNamed(name, c), 80);
    // setTimeout(function() { alert(log); /* => "bRun" */ }, 150);
    var funcs = Array.prototype.slice.call(arguments);
    var registry = fun._eitherNameRegistry || (fun._eitherNameRegistry = {});
    var name = funcs.shift();
    var eitherCall = registry[name] || (registry[name] = {wasCalled: false, callsLeft: 0});
    eitherCall.callsLeft++;
    return function() {
      eitherCall.callsLeft--;
      // cleanup the storage if all registered functions fired
      if (eitherCall.callsLeft <= 0) delete registry[name];
      if (eitherCall.wasCalled) return undefined;
      eitherCall.wasCalled = true;
      return func.apply(this, arguments);
    }
  },

  // -=-=-=-=-
  // creation
  // -=-=-=-=-
  evalJS: function(src) { return eval(src); },

  fromString: function(funcOrString) {
    // Example:
    // fun.fromString("function() { return 3; }")() // => 3
    return fun.evalJS('(' + funcOrString.toString() + ');');
  },

  asScript: function(func, optVarMapping) {
    // Lifts `func` to become a `Closure`, that is that free variables referenced
    // in `func` will be bound to the values of an object that can be passed in as
    // the second parameter. Keys of this object are mapped to the free variables.
    //
    // Please see [`Closure`](#) for a more detailed explanation and examples.
    return Closure.fromFunction(func, optVarMapping).recreateFunc();
  },

  asScriptOf: function(f, obj, optName, optMapping) {
    // Like `asScript` but makes `f` a method of `obj` as `optName` or the name
    // of the function.
    var name = optName || f.name;
    if (!name) {
      throw Error("Function that wants to be a script needs a name: " + this);
    }
    var proto = Object.getPrototypeOf(obj),
        mapping = {"this": obj};
    if (optMapping) mapping = exports.obj.merge([mapping, optMapping]);
    if (proto && proto[name]) {
      var superFunc = function() {
        try {
          // FIXME super is supposed to be static
          return Object.getPrototypeOf(obj)[name].apply(obj, arguments);
        } catch (e) {
          if (typeof $world !== undefined) $world.logError(e, 'Error in $super call')
          else alert('Error in $super call: ' + e + '\n' + e.stack);
          return null;
        }
      };
      mapping["$super"] = Closure.fromFunction(superFunc, {
        "obj": obj,
        name: name
      }).recreateFunc();
    }
    return fun.addToObject(fun.asScript(f, mapping), obj, name);
  },

  // -=-=-=-=-=-=-=-=-
  // closure related
  // -=-=-=-=-=-=-=-=-
  addToObject: function(f, obj, name) {
    // ignore-in-doc
    f.displayName = name;

    var methodConnections = obj.attributeConnections ?
      obj.attributeConnections.filter(function(con) {
        return con.getSourceAttrName() === 'update'; }) : [];

    if (methodConnections)
      methodConnections.forEach(function(ea) { ea.disconnect(); });

    obj[name] = f;

    if (typeof exports.obj) f.declaredObject = exports.obj.safeToString(obj);

    // suppport for tracing
    if (typeof lively !== "undefined" && exports.obj && lively.Tracing && lively.Tracing.stackTracingEnabled) {
      lively.Tracing.instrumentMethod(obj, name, {
        declaredObject: exports.obj.safeToString(obj)
      });
    }

    if (methodConnections)
      methodConnections.forEach(function(ea) { ea.connect(); });

    return f;
  },

  binds: function(f, varMapping) {
    // ignore-in-doc
    // convenience function
    return Closure.fromFunction(f, varMapping || {}).recreateFunc();
  },

  setLocalVarValue: function(f, name, value) {
    // ignore-in-doc
    if (f.hasLivelyClosure) f.livelyClosure.funcProperties[name] = value;
  },

  getVarMapping: function(f) {
    // ignore-in-doc
    if (f.hasLivelyClosure) return f.livelyClosure.varMapping;
    if (f.isWrapper) return f.originalFunction.varMapping;
    if (f.varMapping) return f.varMapping;
    return {};
  },

  setProperty: function(func, name, value) {
    func[name] = value;
    if (func.hasLivelyClosure) func.livelyClosure.funcProperties[name] = value;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // class-related functions
  // -=-=-=-=-=-=-=-=-=-=-=-=-
  functionNames: function(klass) {
    // Treats passed function as class (constructor).
    // Example:
    // var Klass1 = function() {}
    // Klass1.prototype.foo = function(a, b) { return a + b; };
    // Klass1.prototype.bar = function(a) { return this.foo(a, 3); };
    // Klass1.prototype.baz = 23;
    // fun.functionNames(Klass1); // => ["bar","foo"]

    var result = [], lookupObj = klass.prototype;
    while (lookupObj) {
      result = Object.keys(lookupObj).reduce(function(result, name) {
        if (typeof lookupObj[name] === 'function' && result.indexOf(name) === -1)
          result.push(name);
        return result;
      }, result);
      lookupObj = Object.getPrototypeOf(lookupObj);
    }
    return result;
  },

  localFunctionNames: function(func) {
    return Object.keys(func.prototype)
      .filter(function(name) { return typeof func.prototype[name] === 'function'; });
  },

  // -=-=-=-=-=-=-=-=-=-=-
  // tracing and logging
  // -=-=-=-=-=-=-=-=-=-=-

  logErrors: function(func, prefix) {
    var advice = function logErrorsAdvice(proceed /*,args*/ ) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        try {
          return proceed.apply(func, args);
        } catch (er) {
          if (typeof lively !== "undefined" && lively.morphic && lively.morphic.World && lively.morphic.World.current()) {
            lively.morphic.World.current().logError(er)
            throw er;
          }

          if (prefix) console.warn("ERROR: %s.%s(%s): err: %s %s", func, prefix, args, er, er.stack || "");
          else console.warn("ERROR: %s %s", er, er.stack || "");
          if (typeof logStack !== "undefined") logStack();
          if (typeof printObject !== "undefined") console.warn("details: " + printObject(er));
          throw er;
        }
      }

    advice.methodName = "$logErrorsAdvice";
    var result = fun.wrap(func, advice);
    result.originalFunction = func;
    result.methodName = "$logErrorsWrapper";
    return result;
  },

  logCompletion: function(func, module) {
    var advice = function logCompletionAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        try {
          var result = proceed.apply(func, args);
        } catch (er) {
          console.warn('failed to load ' + module + ': ' + er);
          if (typeof lively !== 'undefined' && lively.lang.Execution)
            lively.lang.Execution.showStack();
          throw er;
        }
        console.log('completed ' + module);
        return result;
      }

    advice.methodName = "$logCompletionAdvice::" + module;

    var result = fun.wrap(func, advice);
    result.methodName = "$logCompletionWrapper::" + module;
    result.originalFunction = func;
    return result;
  },

  logCalls: function(func, isUrgent) {
    var original = func,
      advice = function logCallsAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift(), result = proceed.apply(func, args);
        if (isUrgent) {
          console.warn('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
        } else {
          console.log('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
        }
        return result;
      }

    advice.methodName = "$logCallsAdvice::" + fun.qualifiedMethodName(func);

    var result = fun.wrap(func, advice);
    result.originalFunction = func;
    result.methodName = "$logCallsWrapper::" + fun.qualifiedMethodName(func);
    return result;
  },

  traceCalls: function(func, stack) {
    var advice = function traceCallsAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        stack.push(args);
        var result = proceed.apply(func, args);
        stack.pop();
        return result;
      };
    return fun.wrap(func, advice);
  },

  webkitStack: function() {
    // this won't work in every browser
    try {
      throw new Error()
    } catch (e) {
      // remove "Error" and this function from stack, rewrite it nicely
      return String(e.stack)
        .split(/\n/)
        .slice(2)
        .map(function(line) { return line.replace(/^\s*at\s*([^\s]+).*/, '$1'); })
        .join('\n');
    }
  }

};


function Closure() {
  // A `Closure` is a representation of a JavaScript function that controls what
  // values are bound to out-of-scope variables. By default JavaScript has no
  // reflection capabilities over closed values in functions. When needing to
  // serialize execution or when behavior should become part of the state of a
  // system it is often necessary to have first-class control over this language
  // aspect.
  //
  // Typically closures aren't created directly but with the help of [`asScriptOf`](#)
  //
  // Example:
  // function func(a) { return a + b; }
  // var closureFunc = Closure.fromFunction(func, {b: 3}).recreateFunc();
  // closureFunc(4) // => 7
  // var closure = closureFunc.livelyClosure // => {
  // //   varMapping: { b: 3 },
  // //   originalFunc: function func(a) {/*...*/}
  // // }
  // closure.lookup("b") // => 3
  // closure.getFuncSource() // => "function func(a) { return a + b; }"
  this.initialize.apply(this, arguments);
}

exports.Closure = Closure;

exports.obj.extend(Closure, {
  superclass: Object,
  type: 'Closure',
  categories: {}
});

Closure.prototype.isLivelyClosure = true;

// -=-=-=-=-=-=-=-
// serialization
// -=-=-=-=-=-=-=-
Closure.prototype.doNotSerialize = ['originalFunc'];

// -=-=-=-=-=-=-
// initializing
// -=-=-=-=-=-=-
Closure.prototype.initialize = function(func, varMapping, source, funcProperties) {
  this.originalFunc = func;
  this.varMapping = varMapping || {};
  this.source = source;
  this.setFuncProperties(func || funcProperties);
}

Closure.prototype.setFuncSource = function(src) { /*show-in-doc*/ this.source = src };

Closure.prototype.getFuncSource = function() { /*show-in-doc*/ return this.source || String(this.originalFunc); }

Closure.prototype.hasFuncSource = function() { /*show-in-doc*/ return this.source && true }

Closure.prototype.getFunc = function() { /*show-in-doc*/ return this.originalFunc || this.recreateFunc(); }

Closure.prototype.getFuncProperties = function() {
  // ignore-in-doc
  // a function may have state attached
  if (!this.funcProperties) this.funcProperties = {};
  return this.funcProperties;
}

Closure.prototype.setFuncProperties = function(obj) {
  // ignore-in-doc
  var props = this.getFuncProperties();
  for (var name in obj) {
    // The AST implementation assumes that Function objects are some
    // kind of value object. When their identity changes cached state
    // should not be carried over to new function instances. This is a
    // pretty intransparent way to invalidate attributes that are used
    // for caches.
    // @cschuster, can you please fix this by making invalidation more
    // explicit?
    if (obj.hasOwnProperty(name) && name != "_cachedAst") {
      props[name] = obj[name];
    }
  }
}

Closure.prototype.lookup = function(name) { /*show-in-doc*/ return this.varMapping[name]; }

Closure.prototype.parameterNames = function(methodString) {
  // ignore-in-doc
  var parameterRegex = /function\s*\(([^\)]*)\)/,
      regexResult = parameterRegex.exec(methodString);
  if (!regexResult || !regexResult[1]) return [];
  var parameterString = regexResult[1];
  if (parameterString.length == 0) return [];
  var parameters = parameterString.split(',').map(function(str) {
    return exports.string.removeSurroundingWhitespaces(str);
  }, this);
  return parameters;
}

Closure.prototype.firstParameter = function(src) {
  // ignore-in-doc
  return this.parameterNames(src)[0] || null;
}

// -=-=-=-=-=-=-=-=-=-
// function creation
// -=-=-=-=-=-=-=-=-=-
Closure.prototype.recreateFunc = function() {
  // Creates a real function object
  return this.recreateFuncFromSource(this.getFuncSource(), this.originalFunc);
}

Closure.prototype.recreateFuncFromSource = function(funcSource, optFunc) {
  // ignore-in-doc
  // what about objects that are copied by value, e.g. numbers?
  // when those are modified after the originalFunc we captured
  // varMapping then we will have divergent state
  var closureVars = [],
      thisFound = false,
      specificSuperHandling = this.firstParameter(funcSource) === '$super';
  for (var name in this.varMapping) {
    if (!this.varMapping.hasOwnProperty(name)) continue;
    if (name == 'this') {
      thisFound = true;
      continue;
    }
    closureVars.push(name + '=this.varMapping["' + name + '"]');
  }

  // ignore-in-doc
  // FIXME: problem with rewriting variables when _2 is rewritten by eval below
  // if (this.originalFunc && this.originalFunc.livelyDebuggingEnabled) {
  //     var scopeObject = this.originalFunc._cachedScopeObject,
  //   depth = -1,
  //   path = ''
  //     while (scopeObject && scopeObject != Global) {
  //   depth++;
  //   scopeObject = scopeObject[2]; // descend in scope
  //     }
  //     scopeObject = this.originalFunc._cachedScopeObject;
  //     var path = 'this.originalFunc._cachedScopeObject';
  //     for (var i = depth; i >= 0; i--) {
  //   closureVars.push('_' + depth + '=' + path + '[1]');
  //   closureVars.push('__' + depth + '=' + path);
  //   path += '[2]';
  //     }
  // }

  var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
  if (specificSuperHandling) src += '(function superWrapperForClosure() { return ';
  src += '(' + funcSource + ')';
  if (specificSuperHandling) src += '.apply(this, [$super.bind(this)].concat(Array.from(arguments))) })';

  // ignore-in-doc
  // FIXME!!!
  if (typeof lively !== 'undefined' && lively.Config && lively.Config.loadRewrittenCode) {
      module('lively.ast.Rewriting').load(true);
      var namespace = '[runtime]';
      if (optFunc && optFunc.sourceModule)
        namespace = new URL(optFunc.sourceModule.findUri()).relativePathFrom(URL.root);
      var fnAst = lively.ast.acorn.parse(src),
          rewrittenAst = lively.ast.Rewriting.rewrite(fnAst, lively.ast.Rewriting.getCurrentASTRegistry(), namespace),
          retVal = rewrittenAst.body[0].block.body.last();

      // ignore-in-doc
      // FIXME: replace last ExpressionStatement with ReturnStatement
      retVal.type = 'ReturnStatement';
      retVal.argument = retVal.expression;
      delete retVal.expression;

      src = '(function() { ' + escodegen.generate(rewrittenAst) + '}).bind(this)();';
  }

  try {
    var func = fun.evalJS.call(this, src) || this.couldNotCreateFunc(src);
    this.addFuncProperties(func);
    this.originalFunc = func;
    if (typeof lively !== 'undefined' && lively.Config && lively.Config.loadRewrittenCode) {
      func._cachedAst.source = funcSource;
      // FIXME: adjust start and end of FunctionExpression (because of brackets)
      func._cachedAst.start++;
      func._cachedAst.end--;
    }
    return func;
  } catch (e) {
      var msg = 'Cannot create function ' + e + ' src: ' + src;
      console.error(msg);
      throw new Error(msg);
  }
}

Closure.prototype.addFuncProperties = function(func) {
  // ignore-in-doc
  var props = this.getFuncProperties();
  for (var name in props) {
    if (props.hasOwnProperty(name)) func[name] = props[name];
  }
  this.addClosureInformation(func);
}

Closure.prototype.couldNotCreateFunc = function(src) {
  // ignore-in-doc
  var msg = 'Could not recreate closure from source: \n' + src;
  console.error(msg);
  return function() { throw new Error(msg); };
}

// -=-=-=-=-=-
// conversion
// -=-=-=-=-=-
Closure.prototype.asFunction = function() {
  /*ignore-in-doc*/
  return this.recreateFunc();
}

// -=-=-=-=-=-=-=-=-=-=-=-
// function modification
// -=-=-=-=-=-=-=-=-=-=-=-
Closure.prototype.addClosureInformation = function(f) {
  /*ignore-in-doc-in-doc*/
  f.hasLivelyClosure = true;
  f.livelyClosure = this;
  return f;
}

Closure.fromFunction = function(func, varMapping) {
  /*show-in-doc*/
  return new Closure(func, varMapping || {});
}

Closure.fromSource = function(source, varMapping) {
  /*show-in-doc*/
  return new Closure(null, varMapping || {}, source);
}

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
