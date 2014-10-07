/*global clearTimeout, setTimeout*/

;(function(exports) {
"use strict";

var fun = exports.fun = {

  // -=-=-=-=-=-=-=-=-
  // static functions
  // -=-=-=-=-=-=-=-=-
  get Empty() { return function() {}; },
  get K() { return function(arg) { return arg; }; },
  get Null() { return function() { return null; }; },
  get False() { return function() { return false; }; },
  get True() { return function() { return true; }; },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-
  all: function(object) {
    var a = [];
    for (var name in object) {
      if (!object.__lookupGetter__(name)
       && typeof object[name] === 'function') a.push(name);
    }
    return a;
  },

  own: function(object) {
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
    if (f.superclass) return []; // it's a class...
    var names = f.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  },

  qualifiedMethodName: function(f) {
    var objString = "";
    if (f.declaredClass) {
      objString += f.declaredClass + '>>';
    } else if (f.declaredObject) {
      objString += f.declaredObject + '.';
    }
    return objString + (f.methodName || f.displayNameName || f.name || "anonymous");
  },

  // -=-=-=-
  // timing
  // -=-=-=-
  timeToRun: function(func) {
    var startTime = Date.now();
    func();
    return Date.now() - startTime;
  },

  timeToRunN: function(func, n, arg0, arg1, arg2) {
    var startTime = Date.now();
    for (var i = 0; i < n; i++) func(arg0, arg1, arg2);
    return (Date.now() - startTime) / n;
  },

  delay: function(/*args*/) {
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
    // exec func at most once every wait ms even when called more often
    // useful to calm down eagerly running updaters and such
    /* Example:
        var i = 0;
        x = fun.throttle(function() { show(++i + '-' + Date.now()) }, 500);
        Array.range(0,100).forEach(function(n) { x() });
    */
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
    // Execute func after wait milliseconds elapsed since invocation.
    // E.g. to exec something after receiving an input stream
    // with immediate truthy exec immediately but when called before
    // wait ms are done nothing happens. E.g. to not exec a user invoked
    // action twice accidentally
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
    // see comment in debounceNamed
    var store = fun._throttledByName || (fun._throttledByName = {});
    if (store[name]) return store[name];
    function throttleNamedWrapper() {
      // cleaning up
      fun.debounceNamed(name, wait, function() { delete store[name]; })();
      func.apply(this, arguments);
    }
    return store[name] = fun.throttle(throttleNamedWrapper, wait);
  },

  debounceNamed: function(name, wait, func, immediate) {
    // debounce is based on the identity of the function called. When you call the
    // identical method using debounce, multiple calls that happen between the first
    // invocation and wait time will only cause execution once. However, wrapping a
    // function with debounce and then storing (to be able to call the exact same
    // function again) it is a repeating task and unpractical when using anonymous
    // methods. debounceNamed() automatically maps function to ids and removes the
    // need for this housekeeping code.
    var store = fun._debouncedByName || (fun._debouncedByName = {});
    if (store[name]) return store[name];
    function debounceNamedWrapper() {
      // cleaning up
      delete store[name];
      func.apply(this, arguments);
    }
    return store[name] = fun.debounce(wait, debounceNamedWrapper, immediate);
  },

  createQueue: function(id, workerFunc) {
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
    // function does the houskeeping to start the long running computation
    // just once and returns an object that allows to schedule callbacks
    // once the workerFunc is done
    // this is how it works:
    // if id does not exist, workerFunc is called, otherwise ignored.
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

  composeAsync: function(/*functions*/) {
    // composes functions: fun.composeAsync(f,g,h)(arg1, arg2) =
    //   f(arg1, arg2, thenDo1) -> thenDo1(err, fResult)
    // -> g(fResult, thenDo2) -> thenDo2(err, gResult) ->
    // -> h(fResult, thenDo3) -> thenDo2(err, hResult)
    // Example:
    // fun.composeAsync(
    //   function(a,b, thenDo) { thenDo(null, a+b); },
    //  function(x, thenDo) { thenDo(x*4); })(3,2, function(err, result) { alert(result); });

    var toArray = Array.prototype.slice,
        functions = toArray.call(arguments),
        endCallback, intermediateResult;

    return functions.reverse().reduce(function(prevFunc, func) {
      var nextActivated = false;
      return function() {
        var args = toArray.call(arguments);
        if (!endCallback) endCallback = args.length === 0 ? function() {} : args.pop();

        function next(/*err and args*/) {
          nextActivated = true;
          var args = toArray.call(arguments),
              err = args.shift();
          if (err) endCallback && endCallback(err);
          else prevFunc.apply(null, args);
        }

        try {
          func.apply(this, args.concat([next]));
        } catch (e) {
          console.error('composeAsync: ', e.stack || e);
          !nextActivated && endCallback && endCallback(e);
        }
      }
    }, function() {
      endCallback.apply(
        null,
        [null].concat(toArray.call(arguments)));
    });
  },

  compose: function(/*functions*/) {
    // composes functions: fun.compose(f,g,h)(arg1, arg2) = h(g(f(arg1, arg2)))
    // Example:
    //   fun.compose(function(a,b) {return a+b}, function(x) {return x*4})(3,2)

    var functions = Array.prototype.slice.call(arguments);
    return functions.reverse().reduce(
      function(prevFunc, func) {
        return function() {
          return prevFunc(func.apply(this, arguments));
        }
      }, function(x) { return x; });
  },

  flip: function(f) {
    // swaps the first two args
    // fun.flip(function(a, b, c) { return a + b + c; })(' World', 'Hello', '!')
    return function flipped(/*args*/) {
      var args = Array.prototype.slice.call(arguments),
        flippedArgs = [args[1], args[0]].concat(args.slice(2));
      return f.apply(null, flippedArgs);
    }
  },

  waitFor: function(timeoutMs, waitTesterFunc, thenDo) {
    // wait for waitTesterFunc to return true, then run thenDo, passing
    // failure/timout err as first parameter. A timout occurs after
    // timeoutMs. During the wait period waitTesterFunc might be called
    // multiple times
    var start = Date.now();
    (function test() {
      if (waitTesterFunc()) return thenDo();
      var duration = Date.now() - start,
          timeLeft = timeoutMs - duration;
      if (timeLeft <= 0) return thenDo(new Error('timeout'));
      var timeStep = timeLeft < 50 ? timeLeft : 50;
      setTimeout(test, timeStep);
    })();
  },

  waitForAll: function(options, funcs, thenDo) {
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

  curry: function(/*func and curry args*/) {
    if (arguments.length <= 1) return arguments[0];
    var args = Array.prototype.slice.call(arguments),
        func = args.shift();
    function wrappedFunc() {
      return func.apply(func, args.concat(Array.prototype.slice.call(arguments)));
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = func;
    return wrappedFunc;
  },

  wrap: function(func, wrapper) {
    var __method = func;
    var wrappedFunc = function wrapped() {
      var wrapperArgs = wrapper.isWrapper ?
        Array.prototype.slice.call(arguments) :
        [__method.bind(func)].concat(Array.prototype.slice.call(arguments));
      return wrapper.apply(func, wrapperArgs);
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = __method;
    return wrappedFunc;
  },

  getOriginal: function(func) {
    // get the original 'unwrapped' function, traversing as many wrappers as necessary.
    while (func.originalFunction) func = func.originalFunction;
    return func;
  },

  once: function(func) {
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

  // -=-=-=-=-
  // creation
  // -=-=-=-=-
  fromString: function(funcOrString) {
    return eval('(' + funcOrString.toString() + ')')
  },

  asScript: function(f, optVarMapping) {
    return Closure.fromFunction(f, optVarMapping).recreateFunc();
  },

  asScriptOf: function(f, obj, optName, optMapping) {
    var name = optName || f.name;
    if (!name) {
      throw Error("Function that wants to be a script needs a name: " + this);
    }
    var proto = Object.getPrototypeOf(obj),
        mapping = {"this": obj};
    if (optMapping) mapping = Object.merge([mapping, optMapping]);
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
    return fun.addToObject(fun.asScript(f,mapping), obj, name);
  },

  // -=-=-=-=-=-=-=-=-
  // closure related
  // -=-=-=-=-=-=-=-=-
  addToObject: function(f, obj, name) {
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

    return this;
  },

  binds: function(f, varMapping) {
    // convenience function
    return Closure.fromFunction(f, varMapping || {}).recreateFunc();
  },

  setLocalVarValue: function(f, name, value) {
    if (f.hasLivelyClosure) f.livelyClosure.funcProperties[name] = value;
  },

  getVarMapping: function(f) {
    if (f.hasLivelyClosure) return f.livelyClosure.varMapping;
    if (f.isWrapper) return f.originalFunction.varMapping;
    if (f.varMapping) return f.varMapping;
    return {};
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-
  // class related enumeration
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-
  //     functionNames: function(filter) {
  //         var functionNames = [];
  
  //         for (var name in this.prototype) {
  //             try {
  //                 if ((this.prototype[name] instanceof Function) && (!filter || filter(name))) {
  //                     functionNames.push(name);
  //                 }
  //             } catch (er) {
  //                 // FF can throw an exception here ...
  //             }
  //         }
  
  //         return functionNames;
  //     },
  
  //     withAllFunctionNames: function(callback) {
  //         for (var name in this.prototype) {
  //             try {
  //                 var value = this.prototype[name];
  //                 if (value instanceof Function) callback(name, value, this);
  //             } catch (er) {
  //                 // FF can throw an exception here ...
  //             }
  //         }
  //     },
  
  //     localFunctionNames: function() {
  //         var sup = this.superclass || ((this === Object) ? null : Object);
  
  //         try {
  //             var superNames = (sup == null) ? [] : sup.functionNames();
  //         } catch (e) {
  //             var superNames = [];
  //         }
  //         var result = [];
  
  //         this.withAllFunctionNames(function(name, value, target) {
  //             if (!superNames.include(name) || target.prototype[name] !== sup.prototype[name]) result.push(name);
  //         });
  //         return result;
  //     },

// -=-=-=-=-=-=-=-=-=-=-
// tracing and logging
// -=-=-=-=-=-=-=-=-=-=-

//     logErrors: function(prefix) {
//         if (Config.ignoreAdvice) return this;

//         var advice = function logErrorsAdvice(proceed /*,args*/ ) {
//                 var args = Array.from(arguments);
//                 args.shift();
//                 try {
//                     return proceed.apply(this, args);
//                 } catch (er) {
//                     if (Global.lively && lively.morphic && lively.morphic.World && lively.morphic.World.current()) {
//                         lively.morphic.World.current().logError(er)
//                         throw er;
//                     }

//                     if (prefix) console.warn("ERROR: %s.%s(%s): err: %s %s", this, prefix, args, er, er.stack || "");
//                     else console.warn("ERROR: %s %s", er, er.stack || "");
//                     logStack();
//                     if (Global.printObject) console.warn("details: " + printObject(er));
//                     // lively.lang.Execution.showStack();
//                     throw er;
//                 }
//             }

//         advice.methodName = "$logErrorsAdvice";
//         var result = this.wrap(advice);
//         result.originalFunction = this;
//         result.methodName = "$logErrorsWrapper";
//         return result;
//     },

//     logCompletion: function(module) {
//         if (Config.ignoreAdvice) return this;

//         var advice = function logCompletionAdvice(proceed) {
//                 var args = Array.from(arguments);
//                 args.shift();
//                 try {
//                     var result = proceed.apply(this, args);
//                 } catch (er) {
//                     console.warn('failed to load ' + module + ': ' + er);
//                     lively.lang.Execution.showStack();
//                     throw er;
//                 }
//                 console.log('completed ' + module);
//                 return result;
//             }

//         advice.methodName = "$logCompletionAdvice::" + module;

//         var result = this.wrap(advice);
//         result.methodName = "$logCompletionWrapper::" + module;
//         result.originalFunction = this;
//         return result;
//     },

//     logCalls: function(isUrgent) {
//         if (Config.ignoreAdvice) return this;

//         var original = this,
//             advice = function logCallsAdvice(proceed) {
//                 var args = Array.from(arguments);
//                 args.shift(), result = proceed.apply(this, args);
//                 if (isUrgent) {
//                     console.warn('%s(%s) -> %s', original.qualifiedMethodName(), args, result);
//                 } else {
//                     console.log('%s(%s) -> %s', original.qualifiedMethodName(), args, result);
//                 }
//                 return result;
//             }

//         advice.methodName = "$logCallsAdvice::" + this.qualifiedMethodName();

//         var result = this.wrap(advice);
//         result.originalFunction = this;
//         result.methodName = "$logCallsWrapper::" + this.qualifiedMethodName();
//         return result;
//     },

//     traceCalls: function(stack) {
//         var advice = function traceCallsAdvice(proceed) {
//                 var args = Array.from(arguments);
//                 args.shift();
//                 stack.push(args);
//                 var result = proceed.apply(this, args);
//                 stack.pop();
//                 return result;
//             };
//         return this.wrap(advice);
//     },

//     webkitStack: function() {
//         // this won't work in every browser
//         try {
//             throw new Error()
//         } catch (e) {
//             // remove "Error" and this function from stack, rewrite it nicely
//             var trace = Strings.lines(e.stack).slice(2).invoke('replace', /^\s*at\s*([^\s]+).*/, '$1').join('\n');
//             return trace;
//         }
//     },

};


function Closure() {
  // represents a function and its bound values
  this.initialize.apply(this, arguments);
}

exports.Closure = Closure;

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

Closure.prototype.setFuncSource = function(src) { this.source = src };

Closure.prototype.getFuncSource = function() { return this.source || String(this.originalFunc); }

Closure.prototype.hasFuncSource = function() { return this.source && true }

Closure.prototype.getFunc = function() { return this.originalFunc || this.recreateFunc(); }

Closure.prototype.getFuncProperties = function() {
  // a function may have state attached
  if (!this.funcProperties) this.funcProperties = {};
  return this.funcProperties;
}

Closure.prototype.setFuncProperties = function(obj) {
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

Closure.prototype.lookup = function(name) { return this.varMapping[name]; }

Closure.prototype.parameterNames = function(methodString) {
  var parameterRegex = /function\s*\(([^\)]*)\)/,
      regexResult = parameterRegex.exec(methodString);
  if (!regexResult || !regexResult[1]) return [];
  var parameterString = regexResult[1];
  if (parameterString.length == 0) return [];
  var parameters = parameterString.split(',').map(function(str) {
    return Strings.removeSurroundingWhitespaces(str);
  }, this);
  return parameters;
}

Closure.prototype.firstParameter = function(src) {
  return this.parameterNames(src)[0] || null;
}

// -=-=-=-=-=-=-=-=-=-
// function creation
// -=-=-=-=-=-=-=-=-=-
Closure.prototype.recreateFunc = function() {
  return this.recreateFuncFromSource(this.getFuncSource(), this.originalFunc);
}

Closure.prototype.recreateFuncFromSource = function(funcSource, optFunc) {
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

  // FIXME!!!
  if (typeof lively !== 'undefined' && lively.Config.get('loadRewrittenCode')) {
      module('lively.ast.Rewriting').load(true);
      var namespace = '[runtime]';
      if (optFunc && optFunc.sourceModule)
        namespace = new URL(optFunc.sourceModule.findUri()).relativePathFrom(URL.root);
      var fnAst = lively.ast.acorn.parse(src),
          rewrittenAst = lively.ast.Rewriting.rewrite(fnAst, lively.ast.Rewriting.getCurrentASTRegistry(), namespace),
          retVal = rewrittenAst.body[0].block.body.last();

      // FIXME: replace last ExpressionStatement with ReturnStatement
      retVal.type = 'ReturnStatement';
      retVal.argument = retVal.expression;
      delete retVal.expression;

      src = '(function() { ' + escodegen.generate(rewrittenAst) + '}).bind(this)();';
  }

  try {
    var func = eval(src) || this.couldNotCreateFunc(src);
    this.addFuncProperties(func);
    this.originalFunc = func;
    if (typeof lively !== 'undefined' && lively.Config.get('loadRewrittenCode')) {
      func._cachedAst.source = funcSource;
      // FIXME: adjust start and end of FunctionExpression (because of brackets)
      func._cachedAst.start++;
      func._cachedAst.end--;
    }
    return func;
  } catch (e) {
      console.error('Cannot create function ' + e + ' src: ' + src);
      throw new Error('Cannot create function ' + e + ' src: ' + src);
  }
}

Closure.prototype.addFuncProperties = function(func) {
  var props = this.getFuncProperties();
  for (var name in props) {
    if (props.hasOwnProperty(name)) func[name] = props[name];
  }
  this.addClosureInformation(func);
}

Closure.prototype.couldNotCreateFunc = function(src) {
  var msg = 'Could not recreate closure from source: \n' + src;
  console.error(msg);
  // alert(msg);
  return function() { throw new Error(msg); };
}

// -=-=-=-=-=-
// conversion
// -=-=-=-=-=-
Closure.prototype.asFunction = function() { return this.recreateFunc(); }

// -=-=-=-=-=-=-=-=-=-=-=-
// function modification
// -=-=-=-=-=-=-=-=-=-=-=-
Closure.prototype.addClosureInformation = function(f) {
  f.hasLivelyClosure = true;
  f.livelyClosure = this;
  return f;
}

Closure.fromFunction = function(func, varMapping) {
  return new Closure(func, varMapping || {});
}

Closure.fromSource = function(source, varMapping) {
  return new Closure(null, varMapping || {}, source);
}

})(typeof jsext !== 'undefined' ? jsext : require('./base').jsext);


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// notYetImplemented: function() {
// throw new Error('Not yet implemented');
// }

//     unbind: function() {
//         // for serializing functions
//         return Function.fromString(this.toString());
//     },

