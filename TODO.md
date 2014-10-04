# array

## forEachShowingProgress

describe expected interface of progress bar

# numbers

## Number.prototype

randomSmallerInteger removed
roundTo moved to num
detent moved to num
toDegrees moved to num
toRadians moved to num

<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

# date

- add license for time format

## Date

ensureTimeStamp removed

<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

# functions

- add license for debounce / throttle

## Function.prototype -> fun
curry, delay, wrap, getOriginal

## Function -> fun
fromString

## Functions

left out:

Functions:

```
notYetImplemented: function() {
 throw new Error('Not yet implemented');
}

//     forkInWorker: function(workerFunc, options) {
//         options = options || {};
//         var worker = lively.Worker.createInPool(null, Config.get('lively.Worker.idleTimeOfPoolWorker'));
//         worker.onMessage = function(evt) {
//             switch (evt.data.type) {
//                 case 'log': case 'error': case 'warn':
//                     console[evt.data.type]("[WORKER] %s", evt.data.message);
//                     break;
//                 case 'runResponse':
//                     options.whenDone && options.whenDone(evt.data.error, evt.data.result);
//                     break;
//                 case 'evalResponse':
//                     console.log("[WORKER evalResponse] %s", evt.data.value);
//                     break;
//                 default:
//                     console.log("[WORKER unknown message] %s", evt.data.type || evt.data);
//             }
//         }
//         worker.basicRun({
//             func: workerFunc,
//             args: options.args || [],
//             useWhenDone: true
//         });
//         return worker;
//     },
```

Function.prototype:

```
delay: function(func) {
    var __method = func,
        args = Array.prototype.slice.call(arguments),
        timeout = args.shift() * 1000;
    return setTimeout(function delayed() {
      return __method.apply(__method, args);
    }, timeout);
  }


// Object.extend(Function.prototype, {
//     argumentNames: function() {
//         if(this.superclass)
//             return [];
//         var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].
//                 replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').
//                 replace(/\s+/g, '').split(',');

//         return names.length == 1 && !names[0] ? [] : names;
//     },

//     qualifiedMethodName: function() {
//         var objString = "";
//         if (this.declaredClass) {
//             objString += this.declaredClass + '.';
//         } else if (this.declaredObject) {
//             objString += this.declaredObject + '>>';
//         }
//         return objString + (this.methodName || this.name || "anonymous");
//     },

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

//     unbind: function() {
//         // for serializing functions
//         return Function.fromString(this.toString());
//     },

//     asScript: function(optVarMapping) {
//         return lively.Closure.fromFunction(this, optVarMapping).recreateFunc();
//     },
//     asScriptOf: function(obj, optName, optMapping) {
//         var name = optName || this.name;
//         if (!name) {
//             throw Error("Function that wants to be a script needs a name: " + this);
//         }
//         var proto = Object.getPrototypeOf(obj),
//             mapping = {"this": obj};
//         if (optMapping) mapping = Object.merge([mapping, optMapping]);
//         if (proto && proto[name]) {
//             var superFunc = function() {
//                 try {
//                     // FIXME super is supposed to be static
//                     return Object.getPrototypeOf(obj)[name].apply(obj, arguments);
//                 } catch (e) {
//                     if ($world)
//                         $world.logError(e, 'Error in $super call')
//                     else
//                         alert('Error in $super call: ' + e + '\n' + e.stack);
//                     return null;
//                 }
//             };
//             mapping["$super"] = lively.Closure.fromFunction(superFunc, {
//                 "obj": obj,
//                 name: name
//             }).recreateFunc();
//         }
//         return this.asScript(mapping).addToObject(obj, name);
//     },

//     addToObject: function(obj, name) {
//         this.name = name;

//         var methodConnections = obj.attributeConnections ?
//             obj.attributeConnections.filter(function(con) { return con.getSourceAttrName() === 'update'; }) : [];

//         methodConnections.invoke('disconnect');
//         obj[name] = this;

//         this.declaredObject = Objects.safeToString(obj);
//         // suppport for tracing
//         if (lively.Tracing && lively.Tracing.stackTracingEnabled) {
//             lively.Tracing.instrumentMethod(obj, name, {
//                 declaredObject: Objects.safeToString(obj)
//             });
//         }

//         methodConnections.invoke('connect');

//         return this;
//     },

//     binds: function(varMapping) {
//         // convenience function
//         return lively.Closure.fromFunction(this, varMapping || {}).recreateFunc()
//     },

//     setProperty: function(name, value) {
//         this[name] = value;
//         if (this.hasLivelyClosure) this.livelyClosure.funcProperties[name] = value
//     },

//     getVarMapping: function() {
//         if (this.hasLivelyClosure) return this.livelyClosure.varMapping;
//         if (this.isWrapper) return this.originalFunction.varMapping;
//         if (this.varMapping) return this.varMapping;
//         return {}
//     }

```
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

# strings

## breaking changes

removed String.prototype.asString
removed String.prototype.size

<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

# objects

## breaking changes

### removals

- `JSON.prettyPrint`
- `Object.inspect`
- `asScriptOf`

### semantics

- obj.values only enumerates own properties

### firefox fix

// if (this.window && window.navigator && window.navigator.userAgent.match(/Firefox|Minefield/)) {
//     // fixing the bug:	"var property is not a function" bug in Firefox
//     Object.extend(Object, {
//         values: function(object) {
//             var values = [];
//             for (var property in object)
//                 if (object.hasOwnProperty(property))
//                     values.push(object[property]);
//             return values;
//         }
//     })
// };

# PropertyPath

serializeExpr
type

# worker

- create got new arg `options`
- options.libPath, options.scriptsToLoad
- removed init stuff: initGlobals and

```
{
  locationDirectory: JSLoader.currentDir(),
  bootstrapFiles: bootstrapFiles,
  codeBase: lively.Config.codeBase,
  rootPath: lively.Config.rootPath,
  nodeJSURL: lively.Config.nodeJSURL,
  location: (function() {
    var loc = {};
    ["hash","host","hostname","href","origin","pathname","port","protocol","search"].forEach(function(name) {
      loc[name] = lively.Config.location[name]; });
    return loc;
  })()
}
```


