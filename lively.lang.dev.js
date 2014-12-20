/*global window, process, global*/

;(function(Global) {

  var globalInterfaceSpec = [
    {action: "installMethods", target: "Array",              sources: ["arr"],    methods: ["from","genN","range","withN"]},
    {action: "installMethods", target: "Array.prototype",    sources: ["arr"],    methods: ["all","any","batchify","clear","clone","collect","compact","delimWith","detect","doAndContinue","each","equals","filterByKey","findAll","first","flatten","forEachShowingProgress","grep","groupBy","groupByKey","histogram","include","inject","intersect","invoke","last","mapAsync", "mapAsyncSeries", "mask","max","min","mutableCompact","nestedDelay","partition","pluck","pushAll","pushAllAt","pushAt","pushIfNotIncluded","reMatches","reject","rejectByKey","remove","removeAt","replaceAt","rotate","shuffle","size","sortBy","sortByKey","sum","swap","toArray","toTuples","union","uniq","uniqBy","without","withoutAll","zip"], alias: [["select", "filter"],["find","detect"]]},
    {action: "installMethods", target: "Date",               sources: ["date"],   methods: [/*"parse"*/]},
    {action: "installMethods", target: "Date.prototype",     sources: ["date"],   methods: ["equals","format","relativeTo"]},
    {action: "installMethods", target: "Function",           sources: ["fun"],    methods: ["fromString"]},
    {action: "installMethods", target: "Function.prototype", sources: ["fun"],    methods: [/*"addProperties",*/"addToObject","argumentNames","asScript","asScriptOf","binds","curry","delay","functionNames","localFunctionNames","getOriginal","getVarMapping","logCalls","logCompletion","logErrors","qualifiedMethodName","setProperty","traceCalls","wrap"]},
    {action: "installMethods", target: "Number",             sources: ["num"],    methods: []},
    {action: "installMethods", target: "Number.prototype",   sources: ["num"],    methods: ["detent","randomSmallerInteger","roundTo","toDegrees","toRadians"]},
    {action: "installMethods", target: "Object",             sources: ["obj"],    methods: ["addScript","clone","deepCopy","extend","inherit","isArray","isBoolean","isElement","isEmpty","isFunction","isNumber","isObject","isRegExp","isString","isUndefined","merge","mergePropertyInHierarchy","values","valuesInPropertyHierarchy"]},
    {action: "installMethods", target: "Object.prototype",   sources: ["obj"],    methods: []},
    {action: "installMethods", target: "String.prototype",   sources: ["string"], methods: ["camelize","capitalize","digitValue","empty","endsWith","hashCode","include","pad","regExpEscape","startsWith","startsWithVowel","succ","times","toArray","toQueryParams","truncate"]},
    {action: "installMethods", target: "Function.prototype", sources: ["class"],  methods: ["create","addMethods","isSubclassOf","superclasses","categoryNameFor","remove"], alias: [["subclass", "create"]]},

    {action: "installObject", target: "Numbers",                source: "num",        methods: ["average","between","convertLength","humanReadableByteSize","median","normalRandom","parseLength","random","sort"]},
    {action: "installObject", target: "Properties",             source: "properties", methods: ["all","allOwnPropertiesOrFunctions","allProperties","any","forEachOwn","hash","nameFor","own","ownValues","values"]},
    {action: "installObject", target: "Strings",                source: "string",     methods: ["camelCaseString","createDataURI","diff","format","formatFromArray","indent","lineIndexComputer","lines","md5","newUUID","nonEmptyLines","pad","paragraphs","peekLeft","peekRight","print","printNested","printTable","printTree","quote","reMatches","removeSurroundingWhitespaces","stringMatch","tableize","tokens","unescapeCharacterEntities","withDecimalPrecision"]},
    {action: "installObject", target: "Objects",                source: "obj",        methods: ["asObject", "equals","inspect","isMutableType","safeToString","shortPrintStringOf","typeStringOf"]},
    {action: "installObject", target: "Functions",              source: "fun",        methods: ["all","compose","composeAsync","createQueue","debounce","debounceNamed","either","extractBody","flip","notYetImplemented","once","own","throttle","throttleNamed","timeToRun","timeToRunN","waitFor","workerWithCallbackQueue","wrapperChain"]},
    {action: "installObject", target: "Grid",                   source: "grid"},
    {action: "installObject", target: "Interval",               source: "interval"},
    {action: "installObject", target: "lively.ArrayProjection", source: "arrayProjection"},
    {action: "installObject", target: "lively.Closure",         source: "Closure"},
    {action: "installObject", target: "lively.Grouping",        source: "Group"},
    {action: "installObject", target: "lively.PropertyPath",    source: "Path"},
    {action: "installObject", target: "lively.Worker",          source: "worker"},
    {action: "installObject", target: "lively.Class",           source: "classHelper"}
  ];

  var isNode = typeof process !== 'undefined'
            && process.versions && process.versions.node;

  var livelyLang = createLivelyLangObject();
  if (isNode) module.exports = livelyLang;
  else {
    livelyLang._prevLivelyGlobal = Global.lively;
    if (!Global.lively) Global.lively = {};
    if (!Global.lively.lang) Global.lively.lang = livelyLang;
    else {
      for (var name in livelyLang)
        Global.lively.lang[name] = livelyLang[name];
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function createLivelyLangObject() {
    return {
      chain: chain,
      noConflict: noConflict,
      installGlobals: installGlobals,
      uninstallGlobals: uninstallGlobals,
      globalInterfaceSpec: globalInterfaceSpec,
      deprecatedLivelyPatches: deprecatedLivelyPatches
    };
  }

  function chain(object) {
    if (!object) return object;

    var chained;
    if (Array.isArray(object)) return createChain(livelyLang.arr, object);
    if (object.constructor.name === "Date") return createChain(livelyLang.date, object);
    switch (typeof object) {
      case 'string': return createChain(livelyLang.string, object);
      case 'object': return createChain(livelyLang.obj, object);
      case 'function': return createChain(livelyLang.fun, object);
      case 'number': return createChain(livelyLang.num, object);
    }
    throw new Error("Chain for object " + object + " (" + object.constructor.name + ") no supported");
  }

  function createChain(interfaceObj, obj) {
    return Object.keys(interfaceObj).reduce(function(chained, methodName) {
      chained[methodName] = function(/*args*/) {
        var args = Array.prototype.slice.call(arguments),
            result = interfaceObj[methodName].apply(null, [obj].concat(args));
        return chain(result);
      }
      return chained;
    }, {value: function() { return obj; }});
  }

  function noConflict() {
    if (!isNode) {
      var keepLivelyNS = livelyLang._prevLivelyGlobal;
      if (!keepLivelyNS) delete Global.lively
      else delete Global.lively.lang
    }
    return livelyLang;
  }

  function installGlobals() {
    globalInterfaceSpec.forEach(function(ea) {
      if (ea.action === "installMethods") {
        var targetPath = livelyLang.Path(ea.target);
        if (!targetPath.isIn(Global)) targetPath.set(Global, {}, true);
        var sourcePath = livelyLang.Path(ea.sources[0]);
        ea.methods.forEach(function(name) {
          installProperty(
            sourcePath.concat([name]),
            targetPath.concat([name]));
        });
        if (ea.alias)
          ea.alias.forEach(function(mapping) {
            installProperty(
              sourcePath.concat([mapping[1]]),
              targetPath.concat([mapping[0]]));
          });

      } else if (ea.action === "installObject") {
        var targetPath = livelyLang.Path(ea.target);
        var source = livelyLang.Path(ea.source).get(livelyLang);
        targetPath.set(Global, source, true);

      } else throw new Error("Cannot deal with global setup action: " + ea.action);
    });
  }

  function installProperty(sourcePath, targetPath) {
    if (!sourcePath.isIn(livelyLang)) {
      var err = new Error("property not provided by lively.lang: " + sourcePath);
      console.error(err.stack || err);
      throw err;
    }

    var prop = sourcePath.get(livelyLang);
    if (typeof prop === "function" && targetPath.slice(-2, -1).toString() === "prototype") {
      var origFunc = prop;
      prop = function(/*this and args*/) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this);
        return origFunc.apply(null, args);
      };
      prop.toString = function() { return origFunc.toString(); };
    }
    targetPath.set(Global, prop, true);
  }

  function uninstallGlobals() {
    globalInterfaceSpec.forEach(function(ea) {
      if (ea.action === "installMethods") {
        var p = livelyLang.Path(ea.target)
        var target = p.get(Global);
        if (!target) return;
        ea.methods.forEach(function(name) { delete target[name]; });
        if (ea.alias)
          ea.alias.forEach(function(mapping) { delete target[mapping[0]]; });

      } else if (ea.action === "installObject") {
        var p = livelyLang.Path(ea.target);
        p.del(Global);

      } else throw new Error("Cannot deal with global setup action: " + ea.action);
    })
  }

  function deprecatedLivelyPatches() {
    livelyLang.installGlobals();

    Global.$A = Array.from;

    // We need to redefine Function.evalJS here b/c the original definition is
    // in a JS 'use strict' block. However, not all function sources we pass in
    // #evalJS from Lively adhere to the strictness rules. To allow those
    // functions for now we define the creator again outside of a strictness block.
    Function.evalJS = livelyLang.fun.evalJS = function(src) { return eval(src); }
    livelyLang.Path.type = livelyLang.PropertyPath;
    livelyLang.Path.prototype.serializeExpr = function () {
      // ignore-in-doc
      return 'lively.PropertyPath(' + livelyLang.obj.inspect(this.parts()) + ')';
    }

    livelyLang.Closure.type = "lively.Closure";
    livelyLang.fun.methodChain = livelyLang.fun.wrapperChain;

    if (typeof JSON !== "undefined") JSON.prettyPrint = function(jso) { return JSON.stringify(jso, null, 2); };

    Global.NativeArrayFunctions = livelyLang.arrNative;
  }

})(typeof window !== "undefined" ? window : global);
;/*global process, require*/

/*
 * A simple node.js-like cross-platform event emitter implementation.
 */
;(function(exports) {
"use strict";

var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// A simple node.js-like cross-platform event emitter implementation that can
// be used as a mixin. Emitters support the methods: `on(eventName, handlerFunc)`,
// `once(eventName, handlerFunc)`, `emit(eventName, eventData)`,
// `removeListener(eventName, handlerFunc)`, `removeAllListeners(eventName)`
// Example:
// var emitter = events.makeEmitter({});
// var log = [];
// emitter.on("test", function() { log.push("listener1"); });
// emitter.once("test", function() { log.push("listener2"); });
// emitter.emit("test");
// emitter.emit("test");
// log // => ["listener1","listener2","listener1"]
// emitter.removeAllListeners("test");
// emitter.emit("test");
// log // => is still ["listener1","listener2","listener1"]

var events = exports.events = {

  makeEmitter: isNode ? function(obj) {
    if (obj.on && obj.removeListener) return obj;
    var events = require("events");
    require("util")._extend(obj, events.EventEmitter.prototype);
    events.EventEmitter.call(obj);
    return obj;
  } : function(obj) {
    if (obj.on && obj.removeListener) return obj;

    obj.listeners = {};

    obj.on = function(type, handler) {
      if (!handler) return;
      if (!obj.listeners[type]) obj.listeners[type] = [];
      obj.listeners[type].push(handler);
    }

    obj.once = function(type, handler) {
      if (!handler) return;
      function onceHandler(/*ignore-in-docs args*/) {
        obj.removeListener(type, onceHandler);
        handler.apply(this, arguments);
      }
      obj.on(type, onceHandler);
    }

    obj.removeListener = function(type, handler) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = obj.listeners[type].filter(function(h) {
        return h !== handler; });
    }

    obj.removeAllListeners = function(type) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = [];
    }

    obj.emit = function(/*type and args*/) {
      var args = Array.prototype.slice.call(arguments);
      var type = args.shift();
      var handlers = obj.listeners[type];
      if (!handlers || !handlers.length) return;
      handlers.forEach(function(handler) {
        try { handler.apply(null, args) } catch (e) {
          console.error("Error in event handler: %s", e.stack || String(e));
        }
      });
    }

    return obj;
  }
};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global*/

/*
 * Utility functions that help to inspect, enumerate, and create JS objects
 */
;(function(exports) {
"use strict";

// -=-=-=-=-=-=-=-=-
// internal helper
// -=-=-=-=-=-=-=-=-

// serveral methods in lib/object.js are inspired or derived from
// Prototype JavaScript framework, version 1.6.0_rc1
// (c) 2005-2007 Sam Stephenson
// Prototype is freely distributable under the terms of an MIT-style license.
// For details, see the Prototype web site: http://www.prototypejs.org/

function print(object) {
  if (object && obj.isArray(object)) { return '[' + object.map(print) + ']'; }
  if (typeof object !== "string") { return String(object); }
  var result = String(object);
  result = result.replace(/\n/g, '\\n\\\n');
  result = result.replace(/(")/g, '\\$1');
  result = '\"' + result + '\"';
  return result;
}

function argumentNames(func) {
  if (func.superclass) return [];
  var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].
      replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').
      replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
}

function indent(str, indentString, depth) {
  if (!depth || depth <= 0) return str;
  while (depth > 0) { depth--; str = indentString + str; }
  return str;
}

// show-in-doc
var obj = exports.obj = {

  // -=-=-=-=-
  // testing
  // -=-=-=-=-


  isArray: function(obj) { /*show-in-doc*/ return obj && Array.isArray(obj); },

  isElement: function(object) { /*show-in-doc*/ return object && object.nodeType == 1; },

  isFunction: function(object) { /*show-in-doc*/ return object instanceof Function; },

  isBoolean: function(object) { /*show-in-doc*/ return typeof object == "boolean"; },

  isString: function(object) { /*show-in-doc*/ return typeof object == "string"; },

  isNumber: function(object) { /*show-in-doc*/ return typeof object == "number"; },

  isUndefined: function(object) { /*show-in-doc*/ return typeof object == "undefined"; },

  isRegExp: function(object) { /*show-in-doc*/ return object instanceof RegExp; },

  isObject: function(object) { /*show-in-doc*/ return typeof object == "object"; },

  isEmpty: function(object) {
    /*show-in-doc*/
    for (var key in object)
      if (object.hasOwnProperty(key)) return false;
    return true;
  },

  equals: function(a, b) {
    // Is object `a` structurally equivalent to object `b`? Deep comparison.
    if (!a && !b) return true;
    if (!a || !b) return false;
    switch (a.constructor) {
      case String:
      case Date:
      case Boolean:
      case Number: return a == b;
    };
    if (typeof a.isEqualNode === "function") return a.isEqualNode(b);
    if (typeof a.equals === "function") return a.equals(b);
    return cmp(a, b) && cmp(b, a);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function cmp(left, right) {
      for (var name in left) {
        if (typeof left[name] === "function") continue;
         if (!obj.equals(left[name], right[name])) return false;
      }
      return true;
    }
  },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-

  keys: Object.keys || function(object) {
    // like Object.keys
    var keys = [];
    for (var property in object) keys.push(property);
    return keys;
  },

  values: function(object) {
    // Example:
    // var obj1 = {x: 22}, obj2 = {x: 23, y: {z: 3}};
    // obj2.__proto__ = obj1;
    // obj.values(obj1) // => [22]
    // obj.values(obj2) // => [23,{z: 3}]
    return object ? Object.keys(object).map(function(k) { return object[k]; }) : [];
  },

  addScript: function (object, funcOrString, optName, optMapping) {
    var func = exports.fun.fromString(funcOrString);
    return exports.fun.asScriptOf(func, object, optName, optMapping);
  },

  // -=-=-=-=-
  // mutation
  // -=-=-=-=-
  extend: function(destination, source) {
    // Add all properties of `source` to `destination`.
    // Example:
    // var dest = {x: 22}, src = {x: 23, y: 24}
    // obj.extend(dest, src);
    // dest // => {x: 23,y: 24}

    var currentCategoryNames = null;
    for (var i = 1; i < arguments.length; i++) {
      if (typeof arguments[i] == "string") {
        var catName = arguments[i];
        if (!destination.categories) destination.categories = {};
        if (!destination.categories[catName]) destination.categories[catName] = [];
        currentCategoryNames = destination.categories[catName];
        continue;
      }

      var source = arguments[i];
      for (var property in source) {
          var getter = source.__lookupGetter__(property),
              setter = source.__lookupSetter__(property);
          if (getter) destination.__defineGetter__(property, getter);
          if (setter) destination.__defineSetter__(property, setter);
          if (getter || setter) continue;
          var sourceObj = source[property];
          destination[property] = sourceObj;
          if (currentCategoryNames) currentCategoryNames.push(property);
          if (typeof sourceObj === "function") {
            if ((!sourceObj.name || (sourceObj.name.length == 0)) && !sourceObj.displayName) sourceObj.displayName = property;
            // remember the module that contains the definition
            if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
              sourceObj.sourceModule = lively.Module.current();
          }
      }
    }

    return destination;
  },

  // -=-=-=-=-
  // clone
  // -=-=-=-=-

  clone: function(object) {
    // Shallow copy
    return Array.isArray(object) ?
      Array.prototype.slice.call(object) : exports.obj.extend({}, object);
  },

  extract: function(properties, object, mapFunc) {
    return properties.reduce(function(extracted, name) {
      if (object.hasOwnProperty(name)) {
        var val = mapFunc ? mapFunc(name, object[name]) : object[name];
        extracted[name] = val;
      }
      return extracted;
    }, {});
  },

  // -=-=-=-=-=-
  // inspection
  // -=-=-=-=-=-
  inspect: function inspect(object, options, depth) {
    // Prints a human-readable representation of `obj`. The printed
    // representation will be syntactically correct JavaScript but will not
    // necessarily evaluate to a structurally identical object. `inspect` is
    // meant to be used while interactivively exploring JavaScript programs and
    // state.
    //
    // `options` can be {printFunctionSource: BOOLEAN, escapeKeys: BOOLEAN, maxDepth: NUMBER}
    options = options || {};
    depth = depth || 0;
    if (!object) return print(object);

    // print function
    if (typeof object === 'function') {
      return options.printFunctionSource ? String(object) :
        'function' + (object.name ? ' ' + object.name : '')
        + '(' + argumentNames(object).join(',') + ') {/*...*/}';
    }

    // print "primitive"
    switch (object.constructor) {
      case String:
      case Boolean:
      case RegExp:
      case Number: return print(object);
    };

    if (typeof object.serializeExpr === 'function')
      return object.serializeExpr();

    var isArray = object && Array.isArray(object),
        openBr = isArray ? '[' : '{', closeBr = isArray ? ']' : '}';
    if (options.maxDepth && depth >= options.maxDepth)
      return openBr + '/*...*/' + closeBr;

    var printedProps = [];
    if (isArray) {
      printedProps = object.map(function(ea) { return inspect(ea, options, depth); });
    } else {
      printedProps = Object.keys(object)
        .sort(function(a, b) {
          var aIsFunc = typeof object[a] === 'function',
              bIsFunc = typeof object[b] === 'function';
          if (aIsFunc === bIsFunc) {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
          }
          return aIsFunc ? 1 : -1;
        })
        .map(function(key, i) {
          if (isArray) inspect(object[key], options, depth + 1);
          var printedVal = inspect(object[key], options, depth + 1);
          return options.escapeKeys ?
            Strings.print(key) : key + ": " + printedVal;
        });
    }

    if (printedProps.length === 0) { return openBr + closeBr; }

    var printedPropsJoined = printedProps.join(','),
        useNewLines = !isArray
          && (!options.minLengthForNewLine
          || printedPropsJoined.length >= options.minLengthForNewLine),
        ind = indent('', options.indent || '  ', depth),
        propIndent = indent('', options.indent || '  ', depth + 1),
        startBreak = useNewLines ? '\n' + propIndent: '',
        endBreak = useNewLines ? '\n' + ind : '';
    if (useNewLines) printedPropsJoined = printedProps.join(',' + startBreak);
    return openBr + startBreak + printedPropsJoined + endBreak + closeBr;
  },

  // -=-=-=-=-
  // merging
  // -=-=-=-=-
  merge: function(objs) {
    // `objs` can be a list of objects. The return value will be a new object,
    // containing all properties of all objects. If the same property exist in
    // multiple objects, the right-most property takes precedence.
    //
    // Like `extend` but will not mutate objects in `objs`.

    // if objs are arrays just concat them
    // if objs are real objs then merge propertdies
    if (arguments.length > 1) {
      return obj.merge(Array.prototype.slice.call(arguments));
    }

    if (Array.isArray(objs[0])) { // test for all?
      return Array.prototype.concat.apply([], objs);
    }

    return objs.reduce(function(merged, ea) {
      for (var name in ea)
        if (ea.hasOwnProperty(name))
            merged[name] = ea[name];
      return merged;
    }, {});
  },

  // -=-=-=-=-=-=-
  // inheritance
  // -=-=-=-=-=-=-
  inherit: function(obj) { return Object.create(obj); },

  valuesInPropertyHierarchy: function(obj, name) {
    // Lookup all properties named name in the proto hierarchy of obj.
    // Example:
    // var a = {foo: 3}, b = Object.create(a), c = Object.create(b);
    // c.foo = 4;
    // obj.valuesInPropertyHierarchy(c, "foo") // => [3,4]
    var result = [], lookupObj = obj;
    while (lookupObj) {
      if (lookupObj.hasOwnProperty(name)) result.unshift(lookupObj[name])
      lookupObj = Object.getPrototypeOf(lookupObj);
    }
    return result;
  },

  mergePropertyInHierarchy: function(obj, propName) {
    // like `merge` but automatically gets all definitions of the value in the
    // prototype chain and merges those.
    // Example:
    // var o1 = {x: {foo: 23}}, o2 = {x: {foo: 24, bar: 15}}, o3 = {x: {baz: "zork"}};
    // o2.__proto__ = o1; o3.__proto__ = o2;
    // obj.mergePropertyInHierarchy(o3, "x");
    // // => {bar: 15, baz: "zork",foo: 24}
    return this.merge(this.valuesInPropertyHierarchy(obj, propName));
  },

  deepCopy: function (object) {
    // Recursively traverses `object` and its properties to create a copy.
    if (!object || typeof object !== "object") return object;
    var result = Array.isArray(object) ? Array(object.length) : {};
    for (var key in object) {
      if (object.hasOwnProperty(key))
        result[key] = obj.deepCopy(object[key]);
    }
    return result;
  },

  // -=-=-=-=-=-=-=-=-
  // stringification
  // -=-=-=-=-=-=-=-=-
  typeStringOf: function(obj) {
    // ignore-in-doc
    if (obj === null) return "null";
    if (typeof obj === "undefined") return "undefined";
    return obj.constructor.name;
  },

  shortPrintStringOf: function(obj) {
    // ignore-in-doc
    // primitive values
    if (!this.isMutableType(obj)) return this.safeToString(obj);

    // constructed objects
    if (obj.constructor.name !== 'Object' && !Array.isArray(obj)) {
      if(obj.constructor.name)
        return obj.constructor.name ?
          obj.constructor.name :
          Object.prototype.toString.call(obj).split(" ")[1].split("]")[0];
    }

    // arrays or plain objects
    var typeString = "";

    function displayTypeAndLength(obj, collectionType, firstBracket, secondBracket) {
      if (obj.constructor.name === collectionType) {
        typeString += firstBracket;
        if (obj.length || Object.keys(obj).length) typeString += "...";
        typeString += secondBracket;
      }
    }
    displayTypeAndLength(obj, "Object", "{", "}");
    displayTypeAndLength(obj, "Array", "[", "]");
    return typeString;
  },

  isMutableType: function(obj) {
    // Is `obj` a value or mutable type?
    var immutableTypes = ["null", "undefined", "Boolean", "Number", "String"];
    return immutableTypes.indexOf(this.typeStringOf(obj)) === -1;
  },

  safeToString: function(obj) {
    // Like `toString` but catches errors.
    try {
      return (obj ? obj.toString() : String(obj)).replace('\n','');
    } catch (e) { return '<error printing object>'; }
  },

  asObject: function(obj) {
    switch (typeof obj) {
      case 'string':
        return new String(obj);
      case 'boolean':
        return new Boolean(obj);
      case 'number':
        return new Number(obj);
      default:
        return obj;
    }
  }
};

// ignore-in-doc
// -=-=-=-=-=-
// properties
// -=-=-=-=-=-
var properties = exports.properties = {

  all: function(object, predicate) {
    // ignore-in-doc
    var a = [];
    for (var name in object) {
      if ((object.__lookupGetter__(name) || typeof object[name] !== 'function')
        && (predicate ? predicate(name, object) : true))
        a.push(name);
    }
    return a;
  },

  allOwnPropertiesOrFunctions: function(obj, predicate) {
    // ignore-in-doc
    return Object.getOwnPropertyNames(obj).reduce(function(result, name) {
      if (predicate ? predicate(obj, name) : true) result.push(name);
      return result;
    }, []);
  },

  own: function(object) {
    // ignore-in-doc
    var a = [];
    for (var name in object) {
      if (object.hasOwnProperty(name) && (object.__lookupGetter__(name)
        || object[name] !== 'function'))
        a.push(name);
    }
    return a;
  },

  forEachOwn: function(object, func, context) {
    // ignore-in-doc
    var result = [];
    for (var name in object) {
      if (!object.hasOwnProperty(name)) continue;
      var value = object[name];
      if (value !== 'function') {
        result.push(func.call(context || this, name, value));
      }
    }
    return result;
  },

  nameFor: function(object, value) {
    // ignore-in-doc
    for (var name in object) {
      if (object[name] === value) return name;
    }
    return undefined;
  },

  values: function(obj) {
    // ignore-in-doc
    var values = [];
    for (var name in obj) values.push(obj[name]);
    return values;
  },

  ownValues: function(obj) {
    // ignore-in-doc
    var values = [];
    for (var name in obj) {
      if (obj.hasOwnProperty(name)) values.push(obj[name]);
    }
    return values;
  },

  any: function(obj, predicate) {
    // ignore-in-doc
    for (var name in obj) {
      if (predicate(obj, name)) return true;
    }
    return false;
  },

  allProperties: function(obj, predicate) {
    // ignore-in-doc
    var result = [];
    for (var name in obj) {
      if (predicate ? predicate(obj, name) : true)
        result.push(name);
    }
    return result;
  },

  hash: function(obj) {
    // ignore-in-doc
    // Using the property names of `obj` to generate a hash value.
    return Object.keys(obj).sort().join('').hashCode();
  }

};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-
// js object path accessor
// -=-=-=-=-=-=-=-=-=-=-=-=-=-

// A `Path` is an objectified chain of property names (kind of a "complex"
// getter and setter). Path objects can make access and writes into deeply nested
// structures more convenient. `Path` provide "safe" get and set operations and
// can be used for debugging by providing a hook that allows users to find out
// when get/set operations happen.
var Path = exports.Path = function Path(p, splitter) {
  if (p instanceof Path) return p;
  if (!(this instanceof Path)) return new Path(p, splitter);
  if (splitter) this.setSplitter(splitter);
  return this.fromPath(p);
}

obj.extend(Path, {
  superclass: Object,
  type: 'Path',
  categories: {}
});

obj.extend(Path.prototype, {

  isPathAccessor: true,
  splitter: '.',

  fromPath: function(path) {
    // ignore-in-doc
    if (obj.isString(path) && path !== '' && path !== this.splitter) {
      this._parts = path.split(this.splitter);
      this._path = path;
    } else if (obj.isArray(path)) {
      this._parts = [].concat(path);
      this._path = path.join(this.splitter);
    } else {
      this._parts = [];
      this._path = '';
    }
    return this;
  },

  setSplitter: function(splitter) {
    // ignore-in-doc
    if (splitter) this.splitter = splitter;
    return this;
  },

  parts: function() { /*key names as array*/ return this._parts; },

  size: function() { /*show-in-doc*/ return this._parts.length; },

  slice: function(n, m) { /*show-in-doc*/ return Path(this.parts().slice(n, m)); },

  normalizePath: function() {
    // ignore-in-doc
    // FIXME: define normalization
    return this._path;
  },

  isRoot: function(obj) { return this._parts.length === 0; },

  isIn: function(obj) {
    // Does the Path resolve to a value when applied to `obj`?
    if (this.isRoot()) return true;
    var parent = this.get(obj, -1);
    return parent && parent.hasOwnProperty(this._parts[this._parts.length-1]);
  },

  equals: function(obj) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path(["foo", 1, "bar", "baz"]);
    // // Path's can be both created via strings or pre-parsed with keys in a list.
    // p1.equals(p2) // => true
    return obj && obj.isPathAccessor && this.parts().equals(obj.parts());
  },

  isParentPathOf: function(otherPath) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1.bar");
    // p2.isParentPathOf(p1) // => true
    // p1.isParentPathOf(p2) // => false
    otherPath = otherPath && otherPath.isPathAccessor ?
      otherPath : Path(otherPath);
    var parts = this.parts(),
        otherParts = otherPath.parts();
    for(var i = 0; i < parts.length; i ++) {
      if (parts[i] != otherParts[i]) return false
    }
    return true
  },

  relativePathTo: function(otherPath) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1");
    // p2.relativePathTo(p1) // => Path(["bar","baz"])
    // p1.relativePathTo(p2) // => undefined
    otherPath = Path(otherPath);
    return this.isParentPathOf(otherPath) ?
      otherPath.slice(this.size(), otherPath.size()) : undefined;
  },

  del: function(obj) {
    if (this.isRoot()) return false;
    var parent = obj
    for (var i = 0; i < this._parts.length-1; i++) {
      var part = this._parts[i];
      if (parent.hasOwnProperty(part)) {
        parent = parent[part];
      } else return false;
    }
    return delete parent[this._parts[this._parts.length-1]];
  },

  set: function(obj, val, ensure) {
    // Deeply resolve path in `obj` and set the resulting property to `val`. If
    // `ensure` is true, create nested structure in between as necessary.
    // Example:
    // var o1 = {foo: {bar: {baz: 42}}};
    // var path = Path("foo.bar.baz");
    // path.set(o1, 43)
    // o1 // => {foo: {bar: {baz: 43}}}
    // var o2 = {foo: {}};
    // path.set(o2, 43, true)
    // o2 // => {foo: {bar: {baz: 43}}}
    if (this.isRoot()) return undefined;
    var parent = obj
    for (var i = 0; i < this._parts.length-1; i++) {
      var part = this._parts[i];
      if (parent.hasOwnProperty(part) && (typeof parent[part] === "object" || typeof parent[part] === "function")) {
        parent = parent[part];
      } else if (ensure) {
        parent = parent[part] = {};
      } else {
        return undefined;
      }
    }
    return parent[this._parts[this._parts.length-1]] = val;
  },

  get: function(obj, n) {
    // show-in-doc
    var parts = n ? this._parts.slice(0, n) : this._parts;
    return parts.reduce(function(current, pathPart) {
      return current ? current[pathPart] : current; }, obj);
  },

  concat: function(p, splitter) {
    // show-in-doc
    return Path(this.parts().concat(Path(p, splitter).parts()));
  },

  toString: function() { return this.normalizePath(); },

  serializeExpr: function() {
    // ignore-in-doc
    return 'Path(' + Objects.inspect(this.parts()) + ')';
  },

  watch: function(options) {
    // React or be notified on reads or writes to a path in a `target`. Options:
    // ```js
    // {
    //   target: OBJECT,
    //   uninstall: BOOLEAN,
    //   onGet: FUNCTION,
    //   onSet: FUNCTION,
    //   haltWhenChanged: BOOLEAN,
    //   verbose: BOOLEAN
    // }
    // ```
    // Example:
    // // Quite useful for debugging to find out what call-sites change an object.
    // var o = {foo: {bar: 23}};
    // Path("foo.bar").watch({target: o, verbose: true});
    // o.foo.bar = 24; // => You should see: "[object Object].bar changed: 23 -> 24"
    if (!options || this.isRoot()) return;
    var target = options.target,
        parent = this.get(target, -1),
        propName = exports.arr.last(this.parts()),
        newPropName = 'propertyWatcher$' + propName,
        watcherIsInstalled = parent && parent.hasOwnProperty(newPropName),
        uninstall = options.uninstall,
        haltWhenChanged = options.haltWhenChanged,
        showStack = options.showStack,
        getter = parent.__lookupGetter__(propName),
        setter = parent.__lookupSetter__(propName);
    if (!target || !propName || !parent) return;
    if (uninstall) {
      if (!watcherIsInstalled) return;
      delete parent[propName];
      parent[propName] = parent[newPropName];
      delete parent[newPropName];
      var msg = 'Watcher for ' + parent + '.' + propName + ' uninstalled';
      show(msg);
      return;
    }
    if (watcherIsInstalled) {
      var msg = 'Watcher for ' + parent + '.' + propName + ' already installed';
      show(msg);
      return;
    }
    if (getter || setter) {
      var msg = parent + '["' + propName + '"] is a getter/setter, watching not support';
      console.log(msg);
      if (typeof show === "undefined") show(msg);
      return;
    }
    // observe slots, for debugging
    parent[newPropName] = parent[propName];
    parent.__defineSetter__(propName, function(v) {
      var oldValue = parent[newPropName];
      if (options.onSet) options.onSet(v, oldValue);
      var msg = parent + "." + propName + " changed: " + oldValue + " -> " + v;
      if (showStack) msg += '\n' + (typeof lively !== "undefined" ?
                           lively.printStack() : console.trace());
      if (options.verbose) {
        console.log(msg);
        if (typeof show !== 'undefined') show(msg);
      }
      if (haltWhenChanged) debugger;
      return parent[newPropName] = v;
    });
    parent.__defineGetter__(propName, function() {
      if (options.onGet) options.onGet(parent[newPropName]);
      return parent[newPropName];
    });
    var msg = 'Watcher for ' + parent + '.' + propName + ' installed';
    console.log(msg);
    if (typeof show !== 'undefined') show(msg);
  },

  debugFunctionWrapper: function(options) {
    // ignore-in-doc
    // options = {target, [haltWhenChanged, showStack, verbose, uninstall]}
    var target = options.target,
      parent = this.get(target, -1),
      funcName = this.parts().last(),
      uninstall = options.uninstall,
      haltWhenChanged = options.haltWhenChanged === undefined ? true : options.haltWhenChanged,
      showStack = options.showStack,
      func = parent && funcName && parent[funcName],
      debuggerInstalled = func && func.isDebugFunctionWrapper;
    if (!target || !funcName || !func || !parent) return;
    if (uninstall) {
      if (!debuggerInstalled) return;
      parent[funcName] = parent[funcName].debugTargetFunction;
      var msg = 'Uninstalled debugFunctionWrapper for ' + parent + '.' + funcName;
      console.log(msg);
      if (typeof show !== 'undefined') show(msg);
      show(msg);
      return;
    }
    if (debuggerInstalled) {
      var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' already installed';
      console.log(msg);
      if (typeof show !== 'undefined') show(msg);
      return;
    }
    var debugFunc = parent[funcName] = func.wrap(function(proceed) {
      var args = Array.from(arguments);
      if (haltWhenChanged) debugger;
      if (showStack) show(lively.printStack());
      if (options.verbose) show(funcName + ' called');
      return args.shift().apply(parent, args);
    });
    debugFunc.isDebugFunctionWrapper = true;
    debugFunc.debugTargetFunction = func;
    var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' installed';
    console.log(msg);
    if (typeof show !== 'undefined') show(msg);
  }

});

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;
/*
 * Methods to make working with arrays more convenient and collection-like
 * abstractions for groups, intervals, grids.
 */
;(function(exports) {
"use strict";


// Pure JS implementations of native Array methods.
var arrNative = exports.arrNative = {

  sort: function(sortFunc) {
    // show-in-doc
    if (!sortFunc) {
      sortFunc = function(x,y) {
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
      };
    }
    var len = this.length, sorted = [];
    for (var i = 0; i < this.length; i++) {
      var inserted = false;
      for (var j = 0; j < sorted.length; j++) {
        if (1 === sortFunc(sorted[j], this[i])) {
          inserted = true;
          sorted[j+1] = sorted[j];
          sorted[j] = this[i];
          break;
        }
      }
      if (!inserted) sorted.push(this[i]);
    }
    return sorted;
  },

  filter: function(iterator, context) {
    // show-in-doc
    var results = [];
    for (var i = 0; i < this.length; i++) {
      if (!this.hasOwnProperty(i)) continue;
      var value = this[i];
      if (iterator.call(context, value, i)) results.push(value);
    }
    return results;
  },

  forEach: function(iterator, context) {
    // show-in-doc
    for (var i = 0, len = this.length; i < len; i++) {
      iterator.call(context, this[i], i, this); }
  },

  some: function(iterator, context) {
    // show-in-doc
    return this.detect(iterator, context) !== undefined;
  },

  every: function(iterator, context) {
    // show-in-doc
    var result = true;
    for (var i = 0, len = this.length; i < len; i++) {
      result = result && !! iterator.call(context, this[i], i);
      if (!result) break;
    }
    return result;
  },

  map: function(iterator, context) {
    // show-in-doc
    var results = [];
    this.forEach(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  },

  reduce: function(iterator, memo, context) {
    // show-in-doc
    var start = 0;
    if (!arguments.hasOwnProperty(1)) { start = 1; memo = this[0]; }
    for (var i = start; i < this.length; i++)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  },

  reduceRight: function(iterator, memo, context) {
    // show-in-doc
    var start = this.length-1;
    if (!arguments.hasOwnProperty(1)) { start--; memo = this[this.length-1]; }
    for (var i = start; i >= 0; i--)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  }

};

// variety of functions for Arrays
var arr = exports.arr = {

  // -=-=-=-=-=-=-=-
  // array creations
  // -=-=-=-=-=-=-=-

  range: function(begin, end, step) {
    // Examples:
    //   arr.range(0,5) // => [0,1,2,3,4,5]
    //   arr.range(0,10,2) // => [0,2,4,6,8,10]
    step = step || 1
    var result = [];
    for (var i = begin; i <= end; i += step)
      result.push(i);
    return result;
  },

  from: function(iterable) {
    // Makes JS arrays out of array like objects like `arguments` or DOM `childNodes`
    if (!iterable) return [];
    if (Array.isArray(iterable)) return iterable;
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length,
        results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  },

  withN: function(n, obj) {
    // Example:
    //   arr.withN(3, "Hello") // => ["Hello","Hello","Hello"]
    var result = new Array(n);
    while (n > 0) result[--n] = obj;
    return result;
  },

  genN: function(n, generator) {
    // Number -> Function -> Array
    // Takes a generator function that is called for each `n`.
    // Example:
    //   arr.genN(3, num.random) // => [46,77,95]
    var result = new Array(n);
    while (n > 0) result[--n] = generator(n);
    return result;
  },

  // -=-=-=-=-
  // filtering
  // -=-=-=-=-

  filter: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> [a]
    // Calls `iterator` for each element in `array` and returns a subset of it
    // including the elements for which `iterator` returned a truthy value.
    // Like `Array.prototype.filter`.
    return array.filter(iterator, context);
  },

  detect: function(arr, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> a
    // returns the first occurrence of an element in `arr` for which iterator
    // returns a truthy value
    for (var value, i = 0, len = arr.length; i < len; i++) {
      value = arr[i];
      if (iterator.call(context, value, i)) return value;
    }
    return undefined;
  },

  filterByKey: function(arr, key) {
    // [a] -> String -> [a]
    // Example:
    //   var objects = [{x: 3}, {y: 4}, {x:5}]
    //   arr.filterByKey(objects, "x") // => [{x: 3},{x: 5}]
    return arr.filter(function(ea) { return !!ea[key]; });
  },

  grep: function(arr, filter, context) {
    // [a] -> String|RegExp -> [a]
    // `filter` can be a String or RegExp. Will stringify each element in
    // Example:
    // ["Hello", "World", "Lively", "User"].grep("l") // => ["Hello","World","Lively"]
    if (typeof filter === 'string') filter = new RegExp(filter, 'i');
    return arr.filter(filter.test.bind(filter))
  },

  mask: function(array, mask) {
    // select every element in array for which array's element is truthy
    // Example: [1,2,3].mask([false, true, false]) => [2]
    return array.filter(function(_, i) { return !!mask[i]; });
  },

  reject: function(array, func, context) {
    // show-in-doc
    function iterator(val, i) { return !func.call(context, val, i); }
    return array.filter(iterator);
  },

  rejectByKey: function(array, key) {
    // show-in-doc
    return array.filter(function(ea) { return !ea[key]; });
  },

  without: function(array, elem) {
    // non-mutating
    // Example:
    // arr.without([1,2,3,4,5,6], 3) // => [1,2,4,5,6]
    return array.filter(function(value) { return value !== elem; });
  },

  withoutAll: function(array, otherArr) {
    // non-mutating
    // Example:
    // arr.withoutAll([1,2,3,4,5,6], [3,4]) // => [1,2,5,6]
    return array.filter(function(value) {
      return otherArr.indexOf(value) === -1;
    });
  },

  uniq: function(array, sorted) {
    // non-mutating
    // Removes duplicates from array.
    return array.inject([], function(a, value, index) {
      if (0 === index || (sorted ? a.last() != value : !a.include(value)))
        a.push(value);
      return a;
    });
  },

  uniqBy: function(array, comparator, context) {
    // like `arr.uniq` but with custom equality: `comparator(a,b)` returns
    // BOOL. True if a and be should be regarded equal, false otherwise.
    var result = arr.clone(array);
    for (var i = 0; i < result.length; i++) {
      var item = array[i];
      for (var j = i+1; j < result.length; j++) {
        if (comparator.call(context, item, result[j])) {
          arr.removeAt(result, j); j--;
        }
      }
    }
    return result;
  },

  compact: function(array) {
    // removes falsy values
    // Example:
    // arr.compact([1,2,undefined,4,0]) // => [1,2,4]
    return array.filter(function(ea) { return !!ea; });
  },

  mutableCompact: function(array) {
    // fix gaps that were created with 'delete'
    var i = 0, j = 0, len = array.length;
    while (i < len) {
      if (array.hasOwnProperty(i)) array[j++] = array[i];
      i++;
    }
    while (j++ < len) array.pop();
    return array;
  },

  // -=-=-=-=-
  // iteration
  // -=-=-=-=-

  forEach: function(array, iterator, context) {
    // [a] -> (a -> Undefined) -> c? -> Undefined
    // `iterator` is called on each element in `array` for side effects. Like
    // `Array.prototype.forEach`.
    return array.forEach(iterator, context);
  },

  zip: function(/*arr, arr2, arr3*/) {
    // Takes any number of lists as arguments. Combines them elment-wise.
    // Example:
    // arr.zip([1,2,3], ["a", "b", "c"], ["A", "B"])
    // // => [[1,"a","A"],[2,"b","B"],[3,"c",undefined]]
    var args = arr.from(arguments),
        array = args.shift(),
        iterator = typeof arr.last(args) === 'function' ?
          args.pop() : function(x) { return x; },
        collections = [array].concat(args).map(arr.from);
    return array.map(function(value, index) {
      return iterator(arr.pluck(collections, index), index); });
  },

  flatten: function flatten(array) {
    // Turns a nested collection into a flat one.
    // Example:
    // arr.flatten([1, [2, [3,4,5], [6]], 7,8])
    // // => [1,2,3,4,5,6,7,8]
    return array.reduce(function(flattened, value) {
      return flattened.concat(Array.isArray(value) ?
        flatten(value) : [value]);
    }, []);
  },

  delimWith: function(array, delim) {
    return array.reduce(function(xs, x) {
      if (xs.length > 0) xs.push(delim)
      xs.push(x); return xs;
    }, []);
  },

  // -=-=-=-=-
  // mapping
  // -=-=-=-=-

  map: function(array, iterator, context) {
    // [a] -> (a -> b) -> c? -> [b]
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.map(iterator, context);
  },

  invoke: function(array, method, arg1, arg2, arg3, arg4, arg5, arg6) {
    // Calls `method` on each element in `array`, passing all arguments. Often
    // a handy way to avoid verbose `map` calls.
    // Example: arr.invoke(["hello", "world"], "toUpperCase") // => ["HELLO","WORLD"]
    return array.map(function(ea) {
      return ea[method](arg1, arg2, arg3, arg4, arg5, arg6);
    });
  },

  pluck: function(array, property) {
    // Returns `property` or undefined from each element of array. For quick
    // `map`s and similar to `invoke`.
    // Example: arr.pluck(["hello", "world"], 0) // => ["h","w"]
    return array.map(function(ea) { return ea[property]; });
  },

  // -=-=-=-=-
  // folding
  // -=-=-=-=-

  reduce: function(array, iterator, memo, context) {
    // Array -> Function -> Object? -> Object? -> Object?
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.reduce(iterator, memo, context);
  },

  reduceRight: function(array, iterator, memo, context) {
    // show-in-doc
    return array.reduceRight(iterator, memo, context);
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  isArray: Array.isArray,

  include: function(array, object) {
    // Example: arr.include([1,2,3], 2) // => true
    return array.indexOf(object) !== -1;
  },

  some: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if there is at least one abject in `array` for which
    // `iterator` returns a truthy result. Like `Array.prototype.some`.
    return array.some(iterator, context);
  },

  every: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if for all abjects in `array` `iterator` returns a truthy
    // result. Like `Array.prototype.every`.
    return array.every(iterator, context);
  },

  equals: function(array, otherArray) {
    // Returns true iff each element in `array` is equal (`==`) to its
    // corresponding element in `otherArray`
    var len = array.length;
    if (!otherArray || len !== otherArray.length) return false;
    for (var i = 0; i < len; i++) {
      if (array[i] && otherArray[i] && array[i].equals && otherArray[i].equals) {
        if (!array[i].equals(otherArray[i])) {
          return false;
        } else {
          continue;
        }
      }
      if (array[i] != otherArray[i]) return false;
    }
    return true;
  },

  // -=-=-=-=-
  // sorting
  // -=-=-=-=-

  sort: function(array, sortFunc) {
    // [a] -> (a -> Number)? -> [a]
    // Just `Array.prototype.sort`
    return array.sort(sortFunc);
  },

  sortBy: function(array, iterator, context) {
    // Example:
    // arr.sortBy(["Hello", "Lively", "User"], function(ea) {
    //   return ea.charCodeAt(ea.length-1); }) // => ["Hello","User","Lively"]
    return arr.pluck(
      array.map(function(value, index) {
        return {value: value,criteria: iterator.call(context, value, index)};
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }), 'value');
  },

  sortByKey: function(array, key) {
    // Example:
    // lively.lang.arr.sortByKey([{x: 3}, {x: 2}, {x: 8}], "x")
    // // => [{x: 2},{x: 3},{x: 8}]
    return arr.sortBy(array, function(ea) { return ea[key]; });
  },

  reverse: function(array) { return array.reverse(); },

  reversed: function(array) { return arr.clone(array).reverse(); },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // RegExp / String matching
  // -=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(arr, re, stringifier) {
    // convert each element in arr into a string and apply re to match it.
    // result might include null items if re did not match (usful for masking)
    // Example:
    //   var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
    //   morphs.mask(morphs.reMatches(/code/i))
    stringifier = stringifier || String
    return arr.map(function(ea) { return stringifier(ea).match(re); });
  },

  // -=-=-=-=-=-
  // accessors
  // -=-=-=-=-=-

  first: function(array) { return array[0]; },

  last: function(array) { return array[array.length - 1]; },

  // -=-=-=-=-=-=-=-
  // Set operations
  // -=-=-=-=-=-=-=-

  intersect: function(array1, array2) {
    // set-like intersection
    return arr.uniq(array1).filter(function(item) {
      return array2.indexOf(item) > -1; });
  },

  union: function(array1, array2) {
    // set-like union
    var result = arr.clone(array1);
    for (var i = 0; i < array2.length; i++) {
      var item = array2[i];
      if (result.indexOf(item) === -1) result.push(item);
    }
    return result;
  },

  pushAt: function(array, item, index) {
    // inserts `item` at `index`, mutating
    array.splice(index, 0, item);
  },

  removeAt: function(array, index) {
    // inserts item at `index`, mutating
    array.splice(index, 1);
  },

  remove: function(array, item) {
    // removes first occurrence of item in `array`, mutating
    var index = array.indexOf(item);
    if (index >= 0) arr.removeAt(array, index);
    return item;
  },

  pushAll: function(array, items) {
    // appends all `items`, mutating
    for (var i = 0; i < items.length; i++)
      array.push(items[i]);
    return array;
  },

  pushAllAt: function(array, items, idx) {
    // inserts all `items` at `idx`, mutating
    array.splice.apply(array, [idx, 0].concat(items))
  },

  pushIfNotIncluded: function(array, item) {
    // only appends `item` if its not already in `array`, mutating
    if (!arr.include(array, item)) array.push(item);
  },

  replaceAt: function(array, item, index) {
    // mutating
    array.splice(index, 1, item); },

  clear: function(array) {
    // removes all items, mutating
    array.length = 0; return array;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-
  // asynchronous iteration
  // -=-=-=-=-=-=-=-=-=-=-=-
  doAndContinue: function(array, iterator, endFunc, context) {
    // Iterates over array but instead of consecutively calling iterator,
    // iterator gets passed in the invocation for the next iteration step
    // as a function as first parameter. This allows to wait arbitrarily
    // between operation steps, great for managing dependencies between tasks.
    // Related is [`fun.composeAsync`]().
    // Example:
    // arr.doAndContinue([1,2,3,4], function(next, n) {
    //   alert("At " + n);
    //   setTimeout(next, 100);
    // }, function() { alert("Done"); })
    // // If the elements are functions you can leave out the iterator:
    // arr.doAndContinue([
    //   function(next) { alert("At " + 1); next(); },
    //   function(next) { alert("At " + 2); next(); }
    // ], null, function() { alert("Done"); });
    endFunc = endFunc || Functions.Null;
    context = context || (typeof window !== 'undefined' ? window : global);
    iterator = iterator || function(next, ea, idx) { ea.call(context, next, idx); };
    return array.reduceRight(function(nextFunc, ea, idx) {
      return function() { iterator.call(context, nextFunc, ea, idx); }
    }, endFunc)();
  },

  nestedDelay: function(array, iterator, waitSecs, endFunc, context, optSynchronChunks) {
    // Calls `iterator` for every element in `array` and waits between iterator
    // calls `waitSecs`. Eventually `endFunc` is called. When passing a number n
    // as `optSynchronChunks`, only every nth iteration is delayed.
    endFunc = endFunc || function() {};
    return array.clone().reverse().inject(endFunc, function(nextFunc, ea, idx) {
      return function() {
        iterator.call(context || (typeof window !== 'undefined' ? window : global), ea, idx);
        // only really delay every n'th call optionally
        if (optSynchronChunks && (idx % optSynchronChunks !== 0)) {
          nextFunc()
        } else {
          nextFunc.delay(waitSecs);
        }
      }
    })();
  },

  forEachShowingProgress: function(/*array, progressBar, iterator, labelFunc, whenDoneFunc, context or spec*/) {
    // ignore-in-doc
    var args = Array.from(arguments),
      array = args.shift(),
      steps = array.length,
      progressBar, iterator, labelFunc, whenDoneFunc, context,
      progressBarAdded = false;

    // init args
    if (args.length === 1) {
      progressBar = args[0].progressBar;
      iterator = args[0].iterator;
      labelFunc = args[0].labelFunction;
      whenDoneFunc = args[0].whenDone;
      context = args[0].context;
    } else {
      progressBar = args[0];
      iterator = args[1];
      labelFunc = args[2];
      whenDoneFunc = args[3];
      context = args[4];
    }
    if (!context) context = typeof window !== 'undefined' ? window : global;
    if (!labelFunc) labelFunc = function(x) { return x; };

    // init progressbar
    if (!progressBar) {
      progressBarAdded = true;
      var Global = typeof window !== 'undefined' ? window : global;
      var world = Global.lively && lively.morphic && lively.morphic.World.current();
      progressBar = world ? world.addProgressBar() : {
        setValue: function(val) {},
        setLabel: function() {},
        remove: function() {}
      };
    }
    progressBar.setValue(0);

    // nest functions so that the iterator calls the next after a delay
    (array.reduceRight(function(nextFunc, item, idx) {
      return function() {
        try {
          progressBar.setValue(idx / steps);
          if (labelFunc) progressBar.setLabel(labelFunc.call(context, item, idx));
          iterator.call(context, item, idx);
        } catch (e) {
          console.error(
            'Error in forEachShowingProgress at %s (%s)\n%s\n%s',
            idx, item, e, e.stack);
        }
        nextFunc.delay(0);
      };
    }, function() {
      progressBar.setValue(1);
      if (progressBarAdded) (function() { progressBar.remove(); }).delay(0);
      if (whenDoneFunc) whenDoneFunc.call(context);
    }))();

    return array;
  },

  swap: function(array, index1, index2) {
    // mutating
    // Example:
    // var a = [1,2,3,4];
    // arr.swap(a, 3, 1);
    // a // => [1,4,3,2]
    if (index1 < 0) index1 = array.length + index1;
    if (index2 < 0) index2 = array.length + index2;
    var temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
    return array;
  },

  rotate: function(array, times) {
    // non-mutating
    // Example:
    // arr.rotate([1,2,3]) // => [2,3,1]
    times = times || 1;
    return array.slice(times).concat(array.slice(0,times));
  },

  // -=-=-=-=-
  // grouping
  // -=-=-=-=-

  groupBy: function(array, iterator, context) {
    // Applies `iterator` to each element in `array`, and puts the return value
    // into a collection (the group) associated to it's stringified representation
    // (the "hash").
    // See [`Group.prototype`] for available operations on groups.
    // Example:
    // Example 1: Groups characters by how often they occur in a string:
    // var chars = arr.from("Hello World");
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    // // Example 2: Group numbers by a custom qualifier:
    // arr.groupBy([3,4,1,7,4,3,8,4], function(n) {
    //   if (n <= 3) return "small";
    //   if (n <= 7) return "medium";
    //   return "large";
    // });
    // // => {
    // //   large: [8],
    // //   medium: [4,7,4,4],
    // //   small: [3,1,3]
    // // }
    return Group.fromArray(array, iterator, context);
  },

  groupByKey: function(array, key) {
    // var objects = [{x: }]
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    return arr.groupBy(array, function(ea) { return ea[key]; });
  },

  partition: function(array, iterator, context) {
    // Example:
    // var array = [1,2,3,4,5,6];
    // arr.partition(array, function(ea) { return ea > 3; })
    // // => [[1,2,3,4],[5,6]]
    iterator = iterator || function(x) { return x; };
    var trues = [], falses = [];
    array.forEach(function(value, index) {
      (iterator.call(context, value, index) ? trues : falses).push(value);
    });
    return [trues, falses];
  },

  batchify: function(array, constrainedFunc, context) {
    // Takes elements and fits them into subarrays (= batches) so that for
    // each batch constrainedFunc returns true. Note that contrained func
    // should at least produce 1-length batches, otherwise an error is raised
    // Example:
    // // Assume you have list of things that have different sizes and you want to
    // // create sub-arrays of these things, with each sub-array having if possible
    // // less than a `batchMaxSize` of combined things in it:
    // var sizes = [
    //   Math.pow(2, 15), // 32KB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 27), // 128MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 24), // 16MB
    //   Math.pow(2, 26)] // 64MB
    // var batchMaxSize = Math.pow(2, 28)/*256MB*/;
    // function batchConstrained(batch) {
    //   return batch.length == 1 || batch.sum() < batchMaxSize;
    // }
    // var batches = sizes.batchify(batchConstrained);
    // batches.pluck('length') // => [4,1,1,2]
    // batches.map(arr.sum).map(num.humanReadableByteSize) // => ["208.03MB","512MB","512MB","128MB"]

    return findBatches([], array);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function extractBatch(batch, sizes) {
      // Array -> Array -> Array[Array,Array]
      // case 1: no sizes to distribute, we are done
      if (!sizes.length) return [batch, []];
      var first = sizes[0], rest = sizes.slice(1);
      // if batch is empty we have to take at least one
      // if batch and first still fits, add first
      var candidate = batch.concat([first]);
      if (constrainedFunc.call(context, candidate)) return extractBatch(candidate, rest);
      // otherwise leave first out for now
      var batchAndSizes = extractBatch(batch, rest);
      return [batchAndSizes[0], [first].concat(batchAndSizes[1])];
    }

    function findBatches(batches, sizes) {
      if (!sizes.length) return batches;
      var extracted = extractBatch([], sizes);
      if (!extracted[0].length)
        throw new Error('Batchify constrained does not ensure consumption '
                + 'of at least one item per batch!');
      return findBatches(batches.concat([extracted[0]]), extracted[1]);
    }
  },

  toTuples: function(array, tupleLength) {
    // Creates sub-arrays with length `tupleLength`
    // Example:
    // arr.toTuples(["H","e","l","l","o"," ","W","o","r","l","d"], 4)
    // // => [["H","e","l","l"],["o"," ","W","o"],["r","l","d"]]
    tupleLength = tupleLength || 1;
    return arr.range(0,Math.ceil(array.length/tupleLength)-1).map(function(n) {
      return array.slice(n*tupleLength, n*tupleLength+tupleLength);
    }, array);
  },

  // -=-=-=-=-=-
  // randomness
  // -=-=-=-=-=-

  shuffle: function(array) {
    // Ramdomize the order of elements of array. Does not mutate array.
    // Example:
    // arr.shuffle([1,2,3,4,5]) // => [3,1,2,5,4]
    var unusedIndexes = arr.range(0, array.length-1);
    return array.reduce(function(shuffled, ea, i) {
      var shuffledIndex = unusedIndexes.splice(Math.round(Math.random() * (unusedIndexes.length-1)), 1);
      shuffled[shuffledIndex] = ea;
      return shuffled;
    }, Array(array.length));
  },

  // -=-=-=-=-=-=-=-
  // Number related
  // -=-=-=-=-=-=-=-

  max: function(array, iterator, context) {
    // Example:
    //   var array = [{x:3,y:2}, {x:5,y:1}, {x:1,y:5}];
    //   arr.max(array, function(ea) { return ea.x; }) // => {x: 5, y: 1}
    iterator = iterator || function(x) { return x; };
    var result;
    array.reduce(function(max, ea, i) {
      var val = iterator.call(context, ea, i);
      if (typeof val !== "number" || val <= max) return max;
      result = ea; return val;
    }, -Infinity);
    return result;
  },

  min: function(array, iterator, context) {
    // Similar to `arr.max`.
    iterator = iterator || function(x) { return x; };
    return arr.max(array, function(ea, i) {
      return -iterator.call(context, ea, i); });
  },

  sum: function(array) {
    // show-in-doc
    var sum = 0;
    for (var i = 0; i < array.length; i++) sum += array[i];
    return sum;
  },

  count: function(array, item) {
    return array.reduce(function(count, ea) {
      return ea === item ? count + 1 : count; }, 0);
  },

  size: function(array) { return array.length; },

  histogram: function(data, binSpec) {
    // ignore-in-doc
    // Without a `binSpec` argument partition the data
    // var numbers = arr.genN(10, num.random);
    // var numbers = arr.withN(10, "a");
    // => [65,73,34,94,92,31,27,55,95,48]
    // => [[65,73],[34,94],[92,31],[27,55],[95,48]]
    // => [[82,50,16],[25,43,77],[40,64,31],[51,39,13],[17,34,87],[51,33,30]]
    if (typeof binSpec === 'undefined' || typeof binSpec === 'number') {
      var binNumber = binSpec || (function sturge() {
        return Math.ceil(Math.log(data.length) / Math.log(2) + 1);
      })(data);
      var binSize = Math.ceil(Math.round(data.length / binNumber));
      return arr.range(0, binNumber-1).map(function(i) {
        return data.slice(i*binSize, (i+1)*binSize);
      });
    } else if (binSpec instanceof Array) {
      // ignore-in-doc
      // bins specifies n threshold values that will create n-1 bins.
      // Each data value d is placed inside a bin i if:
      // threshold[i] >= d && threshold[i+1] < d
      var thresholds = binSpec;
      return data.reduce(function(bins, d) {
        if (d < thresholds[1]) { bins[0].push(d); return bins; }
        for (var i = 1; i < thresholds.length; i++) {
          if (d >= thresholds[i] && (!thresholds[i+1] || d <= thresholds[i+1])) {
            bins[i].push(d); return bins;
          }
        }
        throw new Error(Strings.format('Histogram creation: Cannot group data %s into thresholds %o', d, thresholds));
      }, arr.range(1,thresholds.length).map(function() { return []; }))
    }
  },

  // -=-=-=-=-
  // Copying
  // -=-=-=-=-

  clone: function(array) {
    // shallow copy
    return [].concat(array);
  },

  // -=-=-=-=-=-
  // conversion
  // -=-=-=-=-=-

  toArray: function(array) { return arr.from(array); },

  // -=-=-=-=-=-
  // DEPRECATED
  // -=-=-=-=-=-

  each: function(arr, iterator, context) {
    return arr.forEach(iterator, context);
  },

  all: function(arr, iterator, context) {
    return arr.every(iterator, context);
  },

  any: function(arr, iterator, context) {
    return arr.some(iterator, context);
  },

  collect: function(arr, iterator, context) {
    return arr.map(iterator, context);
  },

  findAll: function(arr, iterator, context) {
    return arr.filter(iterator, context);
  },

  inject: function(array, memo, iterator, context) {
    if (context) iterator = iterator.bind(context);
    return array.reduce(iterator, memo);
  },

  // asynch methods
  mapAsyncSeries: function(array, iterator, callback) {
    // Apply `iterator` over `array`. Unlike `mapAsync` the invocation of
    // the iterator happens step by step in the order of the items of the array
    // and not concurrently.

    // ignore-in-doc
    // Could simply be:
    // return exports.arr.mapAsync(array, {parallel: 1}, iterator, callback);
    // but the version below is 2x faster

    var result = [], callbackTriggered = false;
    return array.reduceRight(function(nextFunc, ea, idx) {
      if (callbackTriggered) return;
      return function(err, eaResult) {
        if (err) return maybeDone(err);
        if (idx > 0) result.push(eaResult);
        try {
          iterator(ea, idx, exports.fun.once(nextFunc));
        } catch (e) { maybeDone(e); }
      }
    }, function(err, eaResult) {
      result.push(eaResult);
      maybeDone(err, true);
    })();

    function maybeDone(err, finalCall) {
      if (callbackTriggered || (!err && !finalCall)) return;
      callbackTriggered = true;
      try { callback(err, result); } catch (e) {
        console.error("Error in mapAsyncSeries - callback invocation error:\n" + (e.stack || e));
      }
    }
  },

  mapAsync: function(array, options, iterator, callback) {
    // Apply `iterator` over `array`. In each iterator gets a callback as third
    // argument that should be called when the iteration is done. After all
    // iterators have called their callbacks, the main `callback` function is
    // invoked with the result array.
    // Example:
    // lively.lang.arr.mapAsync([1,2,3,4],
    //   function(n, i, next) { setTimeout(function() { next(null, n + i); }, 20); },
    //   function(err, result) { /* result => [1,3,5,7] */ });

    if (typeof options === "function") {
      callback = iterator;
      iterator = options;
      options = null;
    }
    options = options || {};
    if (!options.parallel) options.parallel = array.length-1;

    var results = [], completed = [],
        callbackTriggered = false,
        lastIteratorIndex = 0,
        nActive = 0;

    var iterators = array.map(function(item, i) {
      return function() {
        nActive++;
        try {
          iterator(item, i, exports.fun.once(function(err, result) {
            results[i] = err || result;
            maybeDone(i, err);
          }));
        } catch (e) { maybeDone(i, e); }
      }
    });

    return activate();

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function activate() {
      while (nActive < options.parallel && lastIteratorIndex < array.length)
        iterators[lastIteratorIndex++]();
    }

    function maybeDone(idx, err) {
      if (completed.indexOf(idx) > -1) return;
      completed.push(idx);
      nActive--;
      if (callbackTriggered) return;
      if (!err && completed.length < array.length) { activate(); return; }
      callbackTriggered = true;
      try { callback && callback(err, results); } catch (e) {
        console.error("Error in mapAsync - main callback invocation error:\n" + (e.stack || e));
      }
    }
  },
}

// A Grouping is created by arr.groupBy and maps keys to Arrays.
var Group = exports.Group = function Group() {}

Group.by = exports.arr.groupBy;

Group.fromArray = function(array, hashFunc, context) {
  // Example:
  // Group.fromArray([1,2,3,4,5,6], function(n) { return n % 2; })
  // // => {"0": [2,4,6], "1": [1,3,5]}
  var grouping = new Group();
  for (var i = 0, len = array.length; i < len; i++) {
    var hash = hashFunc.call(context, array[i], i);
    if (!grouping[hash]) grouping[hash] = [];
    grouping[hash].push(array[i]);
  }
  return grouping;
}

Group.prototype.toArray = function() {
  // Example:
  // var group = arr.groupBy([1,2,3,4,5], function(n) { return n % 2; })
  // group.toArray(); // => [[2,4],[1,3,5]]
  return this.reduceGroups(function(all, _, group) {
    return all.concat([group]); }, []);
}

Group.prototype.forEach = function(iterator, context) {
  // Iteration for each item in each group, called like `iterator(groupKey, groupItem)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    groups[groupName].forEach(iterator.bind(context, groupName));
  });
  return groups;
}

Group.prototype.forEachGroup = function(iterator, context) {
  // Iteration for each group, called like `iterator(groupKey, group)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    iterator.call(context, groupName, groups[groupName]);
  });
  return groups;
}

Group.prototype.map = function(iterator, context) {
  // Map for each item in each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = group.map(iterator.bind(context, groupName));
  });
  return result;
}

Group.prototype.mapGroups = function(iterator, context) {
  // Map for each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = iterator.call(context, groupName, group);
  });
  return result;
}

Group.prototype.keys = function() {
  // show-in-docs
  return Object.keys(this);
}

Group.prototype.reduceGroups = function(iterator, carryOver, context) {
  // Reduce/fold for each group, called like `iterator(carryOver, groupKey, group)`
  this.forEachGroup(function(groupName, group) {
    carryOver = iterator.call(context, carryOver, groupName, group); });
  return carryOver;
}

Group.prototype.count = function() {
  // counts the elements of each group
  return this.reduceGroups(function(groupCount, groupName, group) {
    groupCount[groupName] = group.length;
    return groupCount;
  }, {});
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// A grid is just a two-dimaensional array, representing a table-like data
var grid = exports.grid = {

  create: function(rows, columns, initialObj) {
    // Example:
    // grid.create(3, 2, "empty")
    // // => [["empty","empty"],
    // //     ["empty","empty"],
    // //     ["empty","empty"]]
    var result = new Array(rows);
    while (rows > 0) result[--rows] = arr.withN(columns, initialObj);
    return result;
  },

  mapCreate: function(rows, cols, func, context) {
    // like `grid.create` but takes generator function for cells
    var result = new Array(rows);
    for (var i = 0; i < rows; i++) {
      result[i] = new Array(cols);
      for (var j = 0; j < cols; j ++) {
        result[i][j] = func.call(context || this, i, j);
      }
    }
    return result;
  },

  forEach: function(grid, func, context) {
    // iterate, `func` is called as `func(cellValue, i, j)`
    grid.forEach(function(row, i) {
      row.forEach(function(val, j) {
        func.call(context || this, val, i, j);
      });
    })
  },

  map: function(grid, func, context) {
    // map, `func` is called as `func(cellValue, i, j)`
    var result = new Array(grid.length);
    grid.forEach(function(row, i) {
      result[i] = new Array(row.length);
      row.forEach(function(val, j) {
        result[i][j] = func.call(context || this, val, i, j);
      });
    });
    return result;
  },

  toObjects: function(grid) {
    // The first row of the grid defines the propNames
    // for each following row create a new object with those porperties
    // mapped to the cells of the row as values
    // Example:
    // grid.toObjects([['a', 'b'],[1,2],[3,4]])
    // // => [{a:1,b:2},{a:3,b:4}]
    var props = grid[0], objects = new Array(grid.length-1);
    for (var i = 1; i < grid.length; i++) {
      var obj = objects[i-1] = {};
      for (var j = 0; j < props.length; j++) obj[props[j]] = grid[i][j];
    }
    return objects;
  },

  tableFromObjects: function(objects, valueForUndefined) {
    // Reverse operation to `grid.toObjects`. Useful for example to convert objectified
    // SQL result sets into tables that can be printed via Strings.printTable.
    // Objects are key/values like [{x:1,y:2},{x:3},{z:4}]. Keys are interpreted as
    // column names and objects as rows.
    // Example:
    // grid.tableFromObjects([{x:1,y:2},{x:3},{z:4}])
    // // => [["x","y","z"],
    // //    [1,2,null],
    // //    [3,null,null],
    // //    [null,null,4]]

    if (!Array.isArray(objects)) objects = [objects];
    var table = [[]], columns = table[0],
      rows = objects.reduce(function(rows, ea) {
        return rows.concat([Object.keys(ea).reduce(function(row, col) {
          var colIdx = columns.indexOf(col);
          if (colIdx === -1) { colIdx = columns.length; columns.push(col); }
          row[colIdx] = ea[col];
          return row;
        }, [])]);
      }, []);
    valueForUndefined = arguments.length === 1 ? null : valueForUndefined;
    rows.forEach(function(row) {
      // fill cells with no value with null
      for (var i = 0; i < columns.length; i++)
        if (!row[i]) row[i] = valueForUndefined;
    });
    return table.concat(rows);
  },

  benchmark: function() {
    // ignore-in-doc
    var results = [], t;

    var g = grid.create(1000, 200, 1),
        addNum = 0;
        t = lively.lang.fun.timeToRunN(function() {
    grid.forEach(g, function(n) { addNum += n; }) }, 10);
    results.push(exports.string.format('grid.forEach: %ims', t));

    var mapResult;
    t  = Functions.timeToRunN(function() {
      mapResult = grid.map(grid, function(n, i, j) {
        return i+j + Math.round(Math.random() * 100); });
    }, 10);
    results.push(exports.string.format('grid.map: %ims', t));

    var mapResult2 = grid.create(1000, 2000);
    t  = Functions.timeToRunN(function() {
      mapResult2 = new Array(1000);
      for (var i = 0; i < 1000; i++) mapResult2[i] = new Array(2000);
      grid.forEach(g, function(n, i, j) { mapResult2[i][j] = i+j + Math.round(Math.random() * 100); });
    }, 10);

    results.push('grid.map with forEach: ' + t + 'ms');

    results.push('--= 2012-09-22 =--\n'
          + "grid.forEach: 14.9ms\n"
          + "grid.map: 19.8ms\n"
          + "grid.map with forEach: 38.7ms\n");
    return results.join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// Intervals are arrays whose first two elements are numbers and the
// first element should be less or equal the second element, see
// [`interval.isInterval`](). This abstraction is useful when working with text
// ranges in rich text, for example.
var interval = exports.interval = {

  isInterval: function(object) {
    // Example:
    // interval.isInterval([1,12]) // => true
    // interval.isInterval([1,12, {property: 23}]) // => true
    // interval.isInterval([1]) // => false
    // interval.isInterval([12, 1]) // => false
    return Array.isArray(object)
        && object.length >= 2
        && object[0] <= object[1];
  },

  sort: function(intervals) {
    // Sorts intervals according to rules defined in [`interval.compare`]().
    return intervals.sort(interval.compare);
  },

  compare: function(a, b) {
    // How [`interval.sort`]() compares.
    // We assume that `a[0] <= a[1] and b[0] <= b[1]` according to `isInterval`
    // ```
    // -3: a < b and non-overlapping, e.g [1,2] and [3,4]
    // -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
    // -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
    //  0: a = b, e.g. [1,2] and [1,2]
    //  1: a > b and overlapping, e.g. [2,4] and [1,3]
    //  2: a > b and share border, e.g [1,4] and [0,1]
    //  3: a > b and non-overlapping, e.g [2,4] and [0,1]
    // ```
    if (a[0] < b[0]) { // -3 || -2 || -1
      if (a[1] < b[0]) return -3;
      if (a[1] === b[0]) return -2;
      return -1;
    }
    if (a[0] === b[0]) { // -1 || 0 || 1
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    // we know a[0] > b[0], 1 || 2 || 3
    return -1 * interval.compare(b, a);
  },

  coalesce: function(interval1, interval2, optMergeCallback) {
    // Turns two interval into one iff compare(interval1, interval2) ∈ [-2,
    // -1,0,1, 2] (see [`inerval.compare`]()).
    // Otherwise returns null. Optionally uses merge function.
    // Examples:
    //   interval.coalesce([1,4], [5,7]) // => null
    //   interval.coalesce([1,2], [1,2]) // => [1,2]
    //   interval.coalesce([1,4], [3,6]) // => [1,6]
    //   interval.coalesce([3,6], [4,5]) // => [3,6]
    var cmpResult = this.compare(interval1, interval2);
    switch (cmpResult) {
      case -3:
      case  3: return null;
      case  0:
        optMergeCallback && optMergeCallback(interval1, interval2, interval1);
        return interval1;
      case  2:
      case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
      case -2:
      case -1:
        var coalesced = [interval1[0], Math.max(interval1[1], interval2[1])];
        optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
        return coalesced;
      default: throw new Error("Interval compare failed");
    }
  },

  coalesceOverlapping: function(intervals, mergeFunc) {
    // Like `coalesce` but accepts an array of intervals.
    // Example:
    //   interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]])
    //   // => [[1,8],[9,10],[14,21]]
    var condensed = [], len = intervals.length;
    while (len > 0) {
      var ival = intervals.shift(); len--;
      for (var i = 0; i < len; i++) {
        var otherInterval = intervals[i],
            coalesced = interval.coalesce(ival, otherInterval, mergeFunc);
        if (coalesced) {
          ival = coalesced;
          intervals.splice(i, 1);
          len--; i--;
        }
      }
      condensed.push(ival);
    }
    return this.sort(condensed);
  },

  mergeOverlapping: function(intervalsA, intervalsB, mergeFunc) {
    var result = [];
    while (intervalsA.length > 0) {
      var intervalA = intervalsA.shift();

      var toMerge = intervalsB.map(function(intervalB) {
        var cmp = interval.compare(intervalA, intervalB);
        return cmp === -1 || cmp === 0 || cmp === 1;
      });

      result.push(mergeFunc(intervalA, toMerge[0]))

      result.push(intervalA);

    }
    return result;
  },

  intervalsInRangeDo: function(start, end, intervals, iterator, mergeFunc, context) {
      // Merges and iterates through sorted intervals. Will "fill up"
      // intervals. This is currently used for computing text chunks in
      // lively.morphic.TextCore.
      // Example:
      // interval.intervalsInRangeDo(
      //   2, 10, [[0, 1], [5,8], [2,4]],
      //   function(i, isNew) { i.push(isNew); return i; })
      // // => [[2,4,false],[4,5,true],[5,8,false],[8,10,true]]

    context = context || (typeof window !== 'undefined' ? window : global);
    // need to be sorted for the algorithm below
    intervals = this.sort(intervals);
    var free = [], nextInterval, collected = [];
    // merged intervals are already sorted, simply "negate" the interval array;
    while ((nextInterval = intervals.shift())) {
      if (nextInterval[1] < start) continue;
      if (nextInterval[0] < start) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[0] = start;
      };
      var nextStart = end < nextInterval[0] ? end : nextInterval[0];
      if (start < nextStart) {
        collected.push(iterator.call(context, [start, nextStart], true));
      };
      if (end < nextInterval[1]) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[1] = end;
      }
      // special case, the newly constructed interval has length 0,
      // happens when intervals contains doubles at the start
      if (nextInterval[0] === nextInterval[1]) {
        var prevInterval;
        if (mergeFunc && (prevInterval = collected.slice(-1)[0])) {
          // arguments: a, b, merged, like in the callback of #merge
          mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
        }
      } else {
        collected.push(iterator.call(context, nextInterval, false));
      }
      start = nextInterval[1];
      if (start >= end) break;
    }
    if (start < end) collected.push(iterator.call(context, [start, end], true));
    return collected;
  },

  intervalsInbetween: function(start, end, intervals) {
    // Computes "free" intervals between the intervals given in range start - end
    // currently used for computing text chunks in lively.morphic.TextCore
    // Example:
    // interval.intervalsInbetween(0, 10,[[1,4], [5,8]])
    // // => [[0,1],[4,5],[8,10]]
    return interval
      .intervalsInRangeDo(start, end,
        interval.coalesceOverlapping(Array.prototype.slice.call(intervals)),
        function(interval, isNew) { return isNew ? interval : null })
      .filter(function(ea) { return !!ea });
  },

  mapToMatchingIndexes:  function(intervals, intervalsToFind) {
    // Returns an array of indexes of the items in intervals that match
    // items in `intervalsToFind`.
    // Note: We expect intervals and intervals to be sorted according to [`interval.compare`]()!
    // This is the optimized version of:
    // ```
    // return intervalsToFind.collect(function findOne(toFind) {
    //    var startIdx, endIdx;
    //    var start = intervals.detect(function(ea, i) {
    //       startIdx = i; return ea[0] === toFind[0]; });
    //    if (start === undefined) return [];
    //    var end = intervals.detect(function(ea, i) {
    //       endIdx = i; return ea[1] === toFind[1]; });
    //    if (end === undefined) return [];
    //    return Array.range(startIdx, endIdx);
    // });
    // ```

    var startIntervalIndex = 0, endIntervalIndex, currentInterval;
    return intervalsToFind.map(function(toFind) {
      while ((currentInterval = intervals[startIntervalIndex])) {
        if (currentInterval[0] < toFind[0]) { startIntervalIndex++; continue };
        break;
      }
      if (currentInterval && currentInterval[0] === toFind[0]) {
        endIntervalIndex = startIntervalIndex;
        while ((currentInterval = intervals[endIntervalIndex])) {
          if (currentInterval[1] < toFind[1]) { endIntervalIndex++; continue };
          break;
        }
        if (currentInterval && currentInterval[1] === toFind[1]) {
          return arr.range(startIntervalIndex, endIntervalIndex);
        }
      }
      return [];
    });
  },

  benchmark: function() {
    // ignore-in-doc
    // Used for developing the code above. If you change the code, please
    // make sure that you don't worsen the performance!
    // See also lively.lang.tests.ExtensionTests.IntervallTest
    function benchmarkFunc(name, args, n) {
      return Strings.format(
        '%s: %sms',
        name,
        Functions.timeToRunN(function() { interval[name].apply(interval, args, 100000) }, n));
    }
    return [
      "Friday, 20. July 2012:",
      "coalesceOverlapping: 0.0003ms",
      "intervalsInbetween: 0.002ms",
      "mapToMatchingIndexes: 0.02ms",
      'vs.\n' + new Date() + ":",
      benchmarkFunc("coalesceOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
      benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000),
      benchmarkFunc("mapToMatchingIndexes", [Array.range(0, 1000).collect(function(n) { return [n, n+1] }), [[4,8], [500,504], [900,1004]]], 1000)
    ].join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// Accessor to sub-ranges of arrays. This is used, for example, for rendering
// large lists or tables in which only a part of the items should be used for
// processing or rendering. An array projection provides convenient access and
// can apply operations to sub-ranges.
var arrayProjection = exports.arrayProjection = {

  create: function(array, length, optStartIndex) {
    // Example:
    // arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    var startIndex = optStartIndex || 0
    if (startIndex + length > array.length)
      startIndex -= startIndex + length - array.length;
    return {array: array, from: startIndex, to: startIndex+length}
  },

  toArray: function(projection) {
    // show-in-doc
    return projection.array.slice(projection.from, projection.to);
  },

  originalToProjectedIndex: function(projection, index) {
    // Maps index from original Array to projection.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.originalToProjectedIndex(proj, 1) // => null
    //   arrayProjection.originalToProjectedIndex(proj, 3) // => 0
    //   arrayProjection.originalToProjectedIndex(proj, 5) // => 2
    if (index < projection.from || index >= projection.to) return null;
    return index - projection.from;
  },

  projectedToOriginalIndex: function(projection, index) {
    // Inverse to `originalToProjectedIndex`.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.projectedToOriginalIndex(proj, 1) // => 4
    if (index < 0  || index > projection.to - projection.from) return null;
    return projection.from + index;
  },

  transformToIncludeIndex: function(projection, index) {
    // Computes how the projection needs to shift minimally (think "scroll"
    // down or up) so that index becomes "visible" in projection.
    // Example:
    // var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    // arrayProjection.transformToIncludeIndex(proj, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    if (!(index in projection.array)) return null;
    var delta = 0;
    if (index < projection.from) delta = -projection.from+index;
    if (index >= projection.to) delta = index-projection.to+1;
    if (delta === 0) return projection;
    return arrayProjection.create(
      projection.array,
      projection.to-projection.from,
      projection.from+delta);
  }
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;
/*
 * Methods for traversing and transforming tree structures.
 */
;(function(exports) {
"use strict";

var tree = exports.tree = {

  detect: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns the first node for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    if (testFunc(treeNode)) return treeNode;
    var found;
    exports.arr.detect(childGetter(treeNode) || [],
      function(ea) { return found = tree.detect(ea, testFunc, childGetter); });
    return found;
  },

  filter: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns all nodes for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    var result = [];
    if (testFunc(treeNode)) result.push(treeNode);
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.filter(n, testFunc, childGetter); })));
  },

  map: function(treeNode, mapFunc, childGetter) {
    // Traverses a `treeNode` recursively and call `mapFunc` on each node. The
    // return values of all mapFunc calls is the result. `childGetter` is a
    // function to retrieve the children from a node.
    var result = [mapFunc(treeNode)];
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.map(n, mapFunc, childGetter); })));
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global clearTimeout, setTimeout*/

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
    var headerMatch = f.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
    if (!headerMatch || !headerMatch[1]) return [];
    var names = headerMatch[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  },

  qualifiedMethodName: function(f) {
    // ignore-in-doc
    var objString = "";
    if (f.declaredClass) {
      objString += f.declaredClass + '>>';
    } else if (f.declaredObject) {
      objString += f.declaredObject + '.';
    }
    return objString + (f.methodName || f.displayNameName || f.name || "anonymous");
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
      // cleaning up
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
      // cleaning up
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
  if (typeof lively !== 'undefined' && lively.Config && lively.Config.get('loadRewrittenCode')) {
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
    if (typeof lively !== 'undefined' && lively.Config && lively.Config.get('loadRewrittenCode')) {
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

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global*/

// String utility methods for printing, parsing, and converting strings.
;(function(exports) {

// show-in-doc
var string = exports.string = {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // printing and formatting strings
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  format: function strings$format() {
    // String+ -> String
    // Takes a variable number of arguments. The first argument is the format
    // string. Placeholders in the format string are marked with `"%s"`.
    // Example:
    //   lively.lang.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
    return string.formatFromArray(Array.prototype.slice.call(arguments));
  },

  formatFromArray: function strings$formatFromArray(objects) {
    var self = objects.shift();
    if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

    function appendText(object, string) { return "" + object; }

    function appendInteger(value, string) { return value.toString(); }

    function appendFloat(value, string, precision) {
      if (precision > -1) return value.toFixed(precision);
      else return value.toString();
    }

    function appendObject(value, string) { return exports.obj.inspect(value); }

    var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
    var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

    function parseFormat(fmt) {
      var oldFmt = fmt;
      var parts = [];

      for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
        var type = m[8] || m[5],
          appender = type in appenderMap ? appenderMap[type] : appendObject,
          precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
        parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
        parts.push({appender: appender, precision: precision});

        fmt = fmt.substr(m.index + m[0].length);
      }
      if (fmt)
        parts.push(fmt.toString());

      return parts;
    };

    var parts = parseFormat(self),
      str = "",
      objIndex = 0;

    for (var i = 0; i < parts.length; ++i) {
      var part = parts[i];
      if (part && typeof(part) == "object") {
        var object = objects[objIndex++];
        str += (part.appender || appendText)(object, str, part.precision);
      } else {
        str += appendText(part, str);
      }
    }
    return str;
  },

  indent: function (str, indentString, depth) {
    // String -> String -> String? -> String
    // Example:
    //   string.indent("Hello", "  ", 2) // => "    Hello"
    if (!depth || depth <= 0) return str;
    while (depth > 0) { depth--; str = indentString + str; }
    return str;
  },

  removeSurroundingWhitespaces: function(str) {
    // Example:
    //   string.removeSurroundingWhitespaces("  hello\n  world  ") // => "hello\nworld"
    function removeTrailingWhitespace(s) {
      while (s.length > 0 && /\s|\n|\r/.test(s[s.length - 1]))
        s = s.substring(0, s.length - 1);
      return s;
    }
    function removeLeadingWhitespace(string) {
      return string.replace(/^[\n\s]*(.*)/, '$1');
    }
    return removeLeadingWhitespace(removeTrailingWhitespace(str));
  },

  quote: function(str) {
    // Example:
    //   string.print("fo\"o") // => "\"fo\\\"o\""
    return '"' + str.replace(/"/g, '\\"') + '"';
  },

  print: function print(obj) {
    // Prints Arrays and escapes quotations. See `obj.inspect` for how to
    // completely print / inspect JavaScript data strcutures
    // Example:
    //   string.print([[1,2,3], "string", {foo: 23}])
    //      // => [[1,2,3],"string",[object Object]]
    if (obj && Array.isArray(obj)) return '[' + obj.map(print) + ']';
    if (typeof obj !== "string") return String(obj);
    var result = String(obj);
    result = result.replace(/\n/g, '\\n\\\n');
    result = result.replace(/(")/g, '\\$1');
    result = '\"' + result + '\"';
    return result;
  },

  printNested: function(list, depth) {
    // Example:
    //   string.printNested([1,2,[3,4,5]]) // => "1\n2\n  3\n  4\n  5\n"
    depth = depth || 0;
    var s = ""
    list.forEach(function(ea) {
      if (ea instanceof Array) {
        s += string.printNested(ea, depth + 1)
      } else {
        s +=  string.indent(ea +"\n", '  ', depth);
      }
    })
    return s
  },

  pad: function(string, n, left) {
    // Examples:
    // string.pad("Foo", 2) // => "Foo  "
    // string.pad("Foo", 2, true) // => "  Foo"
    return left ? ' '.times(n) + string : string + ' '.times(n);
  },

  printTable: function(tableArray, options) {
    // Array -> Object? -> String
    // Takes a 2D Array and prints a table string. Kind of the reverse
    // operation to `strings.tableize`
    // Example:
    //   string.printTable([["aaa", "b", "c"], ["d", "e","f"]])
    //    // =>
    //    // aaa b c
    //    // d   e f
    var columnWidths = [],
      separator = (options && options.separator) || ' ',
      alignLeftAll = !options || !options.align || options.align === 'left',
      alignRightAll = options && options.align === 'right';
    function alignRight(columnIndex) {
      if (alignLeftAll) return false;
      if (alignRightAll) return true;
      return options
        && Object.isArray(options.align)
        && options.align[columnIndex] === 'right';
    }
    tableArray.forEach(function(row) {
      row.forEach(function(cellVal, i) {
        if (columnWidths[i] === undefined) columnWidths[i] = 0;
        columnWidths[i] = Math.max(columnWidths[i], String(cellVal).length);
      });
    });
    return tableArray.collect(function(row) {
      return row.collect(function(cellVal, i) {
        var cellString = String(cellVal);
        return string.pad(cellString,
                   columnWidths[i] - cellString.length,
                   alignRight(i));
      }).join(separator);
    }).join('\n');
  },

  printTree: function(rootNode, nodePrinter, childGetter, indent) {
    // Object -> Function -> Function -> Number? -> String
    // A generic function to print a tree representation from a nested data structure.
    // Receives three arguments:
    // - `rootNode` an object representing the root node of the tree
    // - `nodePrinter` is a function that gets a tree node and should return stringified version of it
    // - `childGetter` is a function that gets a tree node and should return a list of child nodes
    // Example:
    // var root = {name: "a", subs: [{name: "b", subs: [{name: "c"}]}, {name: "d"}]};
    // string.printTree(root, function(n) { return n.name; }, function(n) { return n.subs; });
    // // =>
    // // a
    // // |-b
    // // | \-c
    // // \-d

    var nodeList = [];
    indent = indent || '  ';
    iterator(0, 0, rootNode);
    return nodeList.join('\n');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function iterator(depth, index, node) {
      // 1. Create stringified representation of node
      nodeList[index] = (string.times(indent, depth)) + nodePrinter(node, depth);
      var children = childGetter(node, depth),
        childIndex = index + 1;
      if (!children || !children.length) return childIndex;
      // 2. If there are children then assemble those linear inside nodeList
      // The childIndex is the pointer of the current items of childList into
      // nodeList.
      var lastIndex = childIndex,
        lastI = children.length - 1;
      children.forEach(function(ea, i) {
        childIndex = iterator(depth+1, childIndex, ea);
        // 3. When we have printed the recursive version then augment the
        // printed version of the direct children with horizontal slashes
        // directly in front of the represented representation
        var isLast = lastI === i,
          cs = nodeList[lastIndex].split(''),
          fromSlash = (depth*indent.length)+1,
          toSlash = (depth*indent.length)+indent.length;
        for (var i = fromSlash; i < toSlash; i++) cs[i] = '-';
        if (isLast) cs[depth*indent.length] = '\\';
        nodeList[lastIndex] = cs.join('');
        // 4. For all children (direct and indirect) except for the
        // last one (itself and all its children) add vertical bars in
        // front of each at position of the current nodes depth. This
        // makes is much easier to see which child node belongs to which
        // parent
        if (!isLast)
          nodeList.slice(lastIndex, childIndex).forEach(function(ea, i) {
            var cs2 = ea.split('');
            cs2[depth*indent.length] = '|';
            nodeList[lastIndex+i] = cs2.join(''); });
        lastIndex = childIndex;
      });
      return childIndex;
    }
  },

  toArray: function(s) {
    // Example:
    // string.toArray("fooo") // => ["f","o","o","o"]
    return s.split('');
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // parsing strings into other entities
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  lines: function(str) {
    // Example: string.lines("foo\nbar\n\rbaz") // => ["foo","bar","baz"]
    return str.split(/\n\r?/);
  },

  paragraphs: function(string, options) {
    // Examples:
    // var text = "Hello, this is a pretty long sentence\nthat even includes new lines."
    //         + "\n\n\nThis is a sentence in  a new paragraph.";
    // string.paragraphs(text) // => [
    //   // "Hello, this is a pretty long sentence\nthat even includes new lines.",
    //   // "This is a sentence in  a new paragraph."]
    // string.paragraphs(text, {keepEmptyLines: true}) // => [
    //   // "Hello, this is a pretty long sentence\n that even includes new lines.",
    //   // "\n ",
    //   // "This is a sentence in  a new paragraph."]
    var sep = options ? options.sep : '\n\n';
    if (!options || !options.keepEmptyLines) return string.split(new RegExp(sep + '+'));
    function isWhiteSpace(s) { return (/^\s*$/).test(s); }
    return string.split('\n').concat('').reduce(function(parasAndLast, line) {
      var paras = parasAndLast[0], last = parasAndLast[1];
      if (isWhiteSpace(last) === isWhiteSpace(line)) {
        last += '\n' + line;
      } else {
         last.length && paras.push(last); last = line;
      }
      return [paras, last];
    }, [[], ''])[0];
  },

  nonEmptyLines: function(str) {
    // Example: string.nonEmptyLines("foo\n\nbar\n") // => ["foo","bar"]
    return string.lines(str).compact();
  },

  tokens: function(str, regex) {
    // Example:
    // string.tokens(' a b c') => ['a', 'b', 'c']
    return str.split(regex || /\s+/).filter(function(tok) {
      return !(/^\s*$/).test(tok); });
  },

  tableize: function(s, options) {
    // String -> Object? -> Array
    // Takes a String representing a "table" and parses it into a 2D-Array (as
    // accepted by the `collection.Grid` methods or `string.printTable`)
    // ```js
    // options = {
    //     convertTypes: BOOLEAN, // automatically convert to Numbers, Dates, ...?
    //     cellSplitter: REGEXP // how to recognize "cells", by default just spaces
    // }
    // ```
    // Examples:
    // string.tableize('a b c\nd e f')
    // // => [["a","b","c"],["d","e","f"]]
    // // can also parse csv like
    // var csv = '"Symbol","Name","LastSale",\n'
    //         + '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
    //         + '"FCTY","1st Century Bancshares, Inc","5.65",'
    // string.tableize(csv, {cellSplitter: /^\s*"|","|",?\s*$/g})
    // // => [["Symbol","Name","LastSale"],
    // //     ["FLWS","1-800 FLOWERS.COM, Inc.",5.65],
    // //     ["FCTY","1st Century Bancshares, Inc",5.65]]

    options = options || {};
    var splitter = options.cellSplitter || /\s+/,
        emptyStringRe = /^\s*$/,
        convertTypes = options.hasOwnProperty('convertTypes') ? !!options.convertTypes : true,
        lines = string.lines(s), table = [];
    for (var i = 0; i < lines.length; i++) {
      var tokens = string.tokens(lines[i], splitter);
      if (convertTypes) {
        tokens = tokens.map(function(tok) {
          if (tok.match(emptyStringRe)) return tok;
          var num = Number(tok);
          if (!isNaN(num)) return num;
          var date = new Date(tok);
          if (!isNaN(+date)) return date;
          return tok.trim();
        });
      }
      if (tokens.length > 0) table.push(tokens);
    }
    return table;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // (un)escape / encoding / decoding
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  unescapeCharacterEntities: function(s) {
    // Converts [character entities](http://dev.w3.org/html5/html-author/charref)
    // into utf-8 strings
    // Example:
    //   string.unescapeCharacterEntities("foo &amp;&amp; bar") // => "foo && bar"
    if (typeof document === 'undefined') throw new Error("Cannot unescapeCharacterEntities");
    var div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent;
  },

  toQueryParams: function(s, separator) {
    // Example:
    // string.toQueryParams("http://example.com?foo=23&bar=test")
    //   // => {bar: "test", foo: "23"}
    var match = s.trim().match(/([^?#]*)(#.*)?$/);
    if (!match) return {};

    var hash = match[1].split(separator || '&').inject({}, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Array.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        } else hash[key] = value;
      }
      return hash;
    });
    return hash;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // file system path support
  // -=-=-=-=-=-=-=-=-=-=-=-=-
  joinPath: function(/*paths*/) {
    // Joins the strings passed as paramters together so that ea string is
    // connected via a single "/".
    // Example:
    // string.joinPath("foo", "bar") // => "foo/bar";
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(path, ea) {
      return typeof ea === "string" ?
        path.replace(/\/*$/, "") + "/" + ea.replace(/^\/*/, "") : path;
    });
  },

  // -=-=-=-=-=-=-=-=-
  // ids and hashing
  // -=-=-=-=-=-=-=-=-

  newUUID: function() {
    // Example:
    //   string.newUUID() // => "3B3E74D0-85EA-45F2-901C-23ECF3EAB9FB"
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
    return id;
  },

  createDataURI: function(content, mimeType) {
    // String -> String -> String
    // Takes some string representing content and a mime type.
    // For a list of mime types see: [http://www.iana.org/assignments/media-types/media-types.xhtml]()
    // More about data URIs: [https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs]()
    // Example:
    //   window.open(string.createDataURI('<h1>test</h1>', 'text/html'));
    mimeType = mimeType || "text/plain";
    return "data:" + mimeType
       + ";base64," + btoa(content);
  },

  hashCode: function(s) {
    // [http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/]()
    // Example: string.hashCode("foo") // => 101574
    var hash = 0, len = s.length;
    if (len == 0) return hash;
    for (var i = 0; i < len; i++) {
      var c = s.charCodeAt(i);
      hash = ((hash<<5)-hash) + c;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  },

  md5: function (string) {
    // © Joseph Myers [http://www.myersdaily.org/joseph/javascript/md5-text.html]()
    // Example:
    //   string.md5("foo") // => "acbd18db4cc2f85cedef654fccc4a4d8"

    /* ignore-in-doc
		this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  */
    // var add32 = hex(md51("hello")) === "5d41402abc4b2a76b9719d911017c592" ?
    //   function add32(a, b) { return (a + b) & 0xFFFFFFFF; } :
		var add32 = function add32(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}

  	function cmn(q, a, b, x, s, t) {
			a = add32(add32(a, q), add32(x, t));
			return add32((a << s) | (a >>> (32 - s)), b);
		}

		function ff(a, b, c, d, x, s, t) {
			return cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}

		function gg(a, b, c, d, x, s, t) {
			return cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}

		function hh(a, b, c, d, x, s, t) {
			return cmn(b ^ c ^ d, a, b, x, s, t);
		}

		function ii(a, b, c, d, x, s, t) {
			return cmn(c ^ (b | (~d)), a, b, x, s, t);
		}

		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];

			a = ff(a, b, c, d, k[0], 7, -680876936);
			d = ff(d, a, b, c, k[1], 12, -389564586);
			c = ff(c, d, a, b, k[2], 17,  606105819);
			b = ff(b, c, d, a, k[3], 22, -1044525330);
			a = ff(a, b, c, d, k[4], 7, -176418897);
			d = ff(d, a, b, c, k[5], 12,  1200080426);
			c = ff(c, d, a, b, k[6], 17, -1473231341);
			b = ff(b, c, d, a, k[7], 22, -45705983);
			a = ff(a, b, c, d, k[8], 7,  1770035416);
			d = ff(d, a, b, c, k[9], 12, -1958414417);
			c = ff(c, d, a, b, k[10], 17, -42063);
			b = ff(b, c, d, a, k[11], 22, -1990404162);
			a = ff(a, b, c, d, k[12], 7,  1804603682);
			d = ff(d, a, b, c, k[13], 12, -40341101);
			c = ff(c, d, a, b, k[14], 17, -1502002290);
			b = ff(b, c, d, a, k[15], 22,  1236535329);

			a = gg(a, b, c, d, k[1], 5, -165796510);
			d = gg(d, a, b, c, k[6], 9, -1069501632);
			c = gg(c, d, a, b, k[11], 14,  643717713);
			b = gg(b, c, d, a, k[0], 20, -373897302);
			a = gg(a, b, c, d, k[5], 5, -701558691);
			d = gg(d, a, b, c, k[10], 9,  38016083);
			c = gg(c, d, a, b, k[15], 14, -660478335);
			b = gg(b, c, d, a, k[4], 20, -405537848);
			a = gg(a, b, c, d, k[9], 5,  568446438);
			d = gg(d, a, b, c, k[14], 9, -1019803690);
			c = gg(c, d, a, b, k[3], 14, -187363961);
			b = gg(b, c, d, a, k[8], 20,  1163531501);
			a = gg(a, b, c, d, k[13], 5, -1444681467);
			d = gg(d, a, b, c, k[2], 9, -51403784);
			c = gg(c, d, a, b, k[7], 14,  1735328473);
			b = gg(b, c, d, a, k[12], 20, -1926607734);

			a = hh(a, b, c, d, k[5], 4, -378558);
			d = hh(d, a, b, c, k[8], 11, -2022574463);
			c = hh(c, d, a, b, k[11], 16,  1839030562);
			b = hh(b, c, d, a, k[14], 23, -35309556);
			a = hh(a, b, c, d, k[1], 4, -1530992060);
			d = hh(d, a, b, c, k[4], 11,  1272893353);
			c = hh(c, d, a, b, k[7], 16, -155497632);
			b = hh(b, c, d, a, k[10], 23, -1094730640);
			a = hh(a, b, c, d, k[13], 4,  681279174);
			d = hh(d, a, b, c, k[0], 11, -358537222);
			c = hh(c, d, a, b, k[3], 16, -722521979);
			b = hh(b, c, d, a, k[6], 23,  76029189);
			a = hh(a, b, c, d, k[9], 4, -640364487);
			d = hh(d, a, b, c, k[12], 11, -421815835);
			c = hh(c, d, a, b, k[15], 16,  530742520);
			b = hh(b, c, d, a, k[2], 23, -995338651);

			a = ii(a, b, c, d, k[0], 6, -198630844);
			d = ii(d, a, b, c, k[7], 10,  1126891415);
			c = ii(c, d, a, b, k[14], 15, -1416354905);
			b = ii(b, c, d, a, k[5], 21, -57434055);
			a = ii(a, b, c, d, k[12], 6,  1700485571);
			d = ii(d, a, b, c, k[3], 10, -1894986606);
			c = ii(c, d, a, b, k[10], 15, -1051523);
			b = ii(b, c, d, a, k[1], 21, -2054922799);
			a = ii(a, b, c, d, k[8], 6,  1873313359);
			d = ii(d, a, b, c, k[15], 10, -30611744);
			c = ii(c, d, a, b, k[6], 15, -1560198380);
			b = ii(b, c, d, a, k[13], 21,  1309151649);
			a = ii(a, b, c, d, k[4], 6, -145523070);
			d = ii(d, a, b, c, k[11], 10, -1120210379);
			c = ii(c, d, a, b, k[2], 15,  718787259);
			b = ii(b, c, d, a, k[9], 21, -343485551);

			x[0] = add32(a, x[0]);
			x[1] = add32(b, x[1]);
			x[2] = add32(c, x[2]);
			x[3] = add32(d, x[3]);

		}

		function md51(s) {
			var n = s.length,
			state = [1732584193, -271733879, -1732584194, 271733878], i;
			for (i=64; i<=n; i+=64) {
				md5cycle(state, md5blk(s.substring(i-64, i)));
			}
			s = s.substring(i-64);
			var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], sl=s.length;
			for (i=0; i<sl; i++) 	tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
			tail[i>>2] |= 0x80 << ((i%4) << 3);
			if (i > 55) {
				md5cycle(state, tail);
				i=16;
				while (i--) { tail[i] = 0 }
	//			for (i=0; i<16; i++) tail[i] = 0;
			}
			tail[14] = n*8;
			md5cycle(state, tail);
			return state;
		}

		/* ignore-in-doc
		 * there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 */
		function md5blk(s) { 		/* I figured global was faster.   */
			var md5blks = [], i; 	/* Andy King said do it this way. */
			for (i=0; i<64; i+=4) {
			md5blks[i>>2] = s.charCodeAt(i)
			+ (s.charCodeAt(i+1) << 8)
			+ (s.charCodeAt(i+2) << 16)
			+ (s.charCodeAt(i+3) << 24);
			}
			return md5blks;
		}

		var hex_chr = '0123456789abcdef'.split('');

		function rhex(n)
		{
			var s='', j=0;
			for(; j<4; j++)	s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]	+ hex_chr[(n >> (j * 8)) & 0x0F];
			return s;
		}

		function hex(x) {
			var l=x.length;
			for (var i=0; i<l; i++)	x[i] = rhex(x[i]);
			return x.join('');
		}

		return hex(md51(string));
	},

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-
  // matching strings / regexps
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(string, re) {
    // Different to the native `match` function this method returns an object
    // with `start`, `end`, and `match` fields
    // Example:
    //   string.reMatches("Hello World", /o/g)
    //   // => [{start: 4, end: 5, match: "o"},{start: 7, end: 8, match: "o"}]
    var matches = [];
    string.replace(re, function(match, idx) {
      matches.push({match: match, start: idx, end: idx + match.length}); });
    return matches;
  },

  stringMatch: function(s, patternString, options) {
    // returns `{matched: true}` if success otherwise
    // `{matched: false, error: EXPLANATION, pattern: STRING|RE, pos: NUMBER}`
    // Example:
    //   string.stringMatch("foo 123 bar", "foo __/[0-9]+/__ bar") // => {matched: true}
    //   string.stringMatch("foo aaa bar", "foo __/[0-9]+/__ bar")
    //     // => {
    //     //   error: "foo <--UNMATCHED-->aaa bar",
    //     //   matched: false,
    //     //   pattern: /[0-9]+/,
    //     //   pos: 4
    //     // }
    options = options || {};
    if (!!options.normalizeWhiteSpace) s = s.replace(/\s+/g, ' ');
    if (!!options.ignoreIndent) {
      s = s.replace(/^\s+/gm, '');
      patternString = patternString.replace(/^\s+/gm, '');
    }
    return s == patternString ?
      {matched: true} : embeddedReMatch(s , patternString);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function splitInThree(string, start, end, startGap, endGap) {
      // split string at start and end
      // return (0, start), (start, end), (end, ...)
      startGap = startGap || 0; endGap = endGap || 0;
      return [string.slice(0, start),
          string.slice(start+startGap, end-endGap),
          string.slice(end)]
    }

    function matchStringForward(s, pattern) {
      // try to match pattern at beginning of string. if matched, return
      // result object with {
      //   match: STRING,
      //   REST: STRING -- remaining string after pattern was consumed
      // }
      if (pattern.constructor !== RegExp) {
        var idx = s.indexOf(pattern);
        if (idx === 0) return {match: pattern, rest: s.slice(pattern.length)}
        // no match
        for (var i = 0; i < pattern.length; i++) // figure out where we failed
          if (pattern[i] != s[i])
            return {match: null, pos: i};
        return {match: null};
      }
      var matches = string.reMatches(s, pattern);
      // show(matches)
      // show(string.slice(matches[0].end));
      return (!matches || !matches.length || matches[0].start !== 0) ?
        {match: null} :
        {match: matches[0].match, rest: s.slice(matches[0].end)};
    }

    function matchStringForwardWithAllPatterns(s, patterns) {
      // like matchStringForward, just apply list of patterns
      var pos = 0;
      for (var i = 0; i < patterns.length; i++) {
        var p = patterns[i],
          result = matchStringForward(s, p);
        if (!result.match) return {matched: false, pos: pos + (result.pos || 0), pattern: p}
        pos += result.match.length;
        s = result.rest;
      }
      return s.length ? {matched: false, pos: pos} : {matched: true}
    }

    function splitIntoPatterns(matcher) {
      var starts = string.reMatches(matcher, /__\//g),
          ends = string.reMatches(matcher, /\/__/g);
      if (starts.length !== ends.length) {
        throw new Error("pattern invalid: "
                + matcher
                + " cannot be split into __/.../__ embedded RegExps"
                + "\nstarts: " + JSON.stringify(starts)
                + '\nvs ends:\n' + JSON.stringify(ends));
      }
      var consumed = 0;
      return starts.reduce(function(patterns, start, i) {
        var end = ends[i];
        var matcher = patterns.pop();
        var splitted = splitInThree(
          matcher,
          start.start-consumed,
          end.end-consumed,
          3, 3);
        if (splitted[0].length) {
          patterns.push(splitted[0]);
          consumed += splitted[0].length;
        }
        try {
          if (splitted[1].length) {
            patterns.push(new RegExp(splitted[1]));
            consumed += splitted[1].length + 3 + 3;
          }
        } catch(e) {
          throw new Error("Cannot create pattern re from: " + exports.obj.inspect(splitted))
        }
        if (splitted[2].length) { patterns.push(splitted[2]); }
        return patterns;
      }, [matcher]);
    }

    function embeddedReMatch(s, patternString) {
      // the main match func
      var patterns = splitIntoPatterns(patternString)
      var result = matchStringForwardWithAllPatterns(s, patterns);
      if (result.matched) return result;
      result.error = s.slice(0, result.pos) + '<--UNMATCHED-->' + s.slice(result.pos)
      return result;
    }
  },

  peekRight: function(s, start, needle) {
    // Finds the next occurence of `needle` (String or RegExp). Returns delta
    // index.
    // Example:
    // string.peekRight("Hello World", 0, /o/g) // => 4
    // string.peekRight("Hello World", 5, /o/) // => 2
    s = s.slice(start);
    if (typeof needle === 'string') {
      var idx = s.indexOf(needle);
      return idx === -1 ? null : idx + start;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return matches[0] ? matches[0].start : null;
    }
    return null;
  },

  peekLeft: function(s, start, needle) {
    // Similar to `peekRight`
    s = s.slice(0, start);
    if (typeof needle === 'string') {
      var idx = s.lastIndexOf(needle);
      return idx === -1 ? null : idx;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return exports.arr.last(matches) ? exports.arr.last(matches).start : null;
    }
    return null;
  },

  lineIndexComputer: function(s) {
    // String -> Function
    // For converting character positions to line numbers.
    // Returns a function accepting char positions. If the char pos is outside
    // of the line ranges -1 is returned.
    // Example:
    // var idxComp = string.lineIndexComputer("Hello\nWorld\n\nfoo");
    // idxComp(3) // => 0 (index 3 is "l")
    // idxComp(6) // => 1 (index 6 is "W")
    // idxComp(12) // => 2 (index 12 is "\n")

    // ignore-in-doc
    // line ranges: list of numbers, each line has two entries:
    // i -> start of line, i+1 -> end of line
    var lineRanges = string.lines(s).reduce(function(lineIndexes, line) {
      var lastPos = lineIndexes.slice(-1)[0] || -1;
      return lineIndexes.concat([lastPos+1, lastPos + 1 + line.length]);
    }, []);
    // ignore-in-doc
    // FIXME, this is O(n). Make cumputation more efficient, binary lookup?
    return function(pos) {
      for (var line = 0; line < lineRanges.length; line+=2)
        if (pos >= lineRanges[line] && pos <= lineRanges[line+1])
          return line / 2;
      return -1;
    }
  },

  // -=-=-=-=-
  // diffing
  // -=-=-=-=-

  diff: function(s1, s2) {
    if (typeof JsDiff === "undefined") return 'diff not supported';
    return JsDiff.convertChangesToXML(JsDiff.diffWordsWithSpace(s1, s2));
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  empty: function(s) {
    // show-in-doc
    return s == '';
  },

  include: function(s, pattern) {
    // Example:
    // string.include("fooo!", "oo") // => true
    return s.indexOf(pattern) > -1;
  },

  startsWith: function(s, pattern) {
    // Example:
    // string.startsWith("fooo!", "foo") // => true
    return s.indexOf(pattern) === 0;
  },

  startsWithVowel: function(s) {
    // show-in-doc
    var c = s[0];
    return c === 'A' || c === 'E' || c === 'I' || c === 'O' || c === 'U'
      || c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u' || false;
  },

  endsWith: function(s, pattern) {
    // Example:
    // string.endsWith("fooo!", "o!") // => true
    var d = s.length - pattern.length;
    return d >= 0 && s.lastIndexOf(pattern) === d;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // string conversion and manipulation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  withDecimalPrecision: function(str, precision) {
    // String -> Number -> String
    // Example: string.withDecimalPrecision("1.12345678", 3) // => "1.123"
    var floatValue = parseFloat(str);
    return isNaN(floatValue) ? str : floatValue.toFixed(precision);
  },

  capitalize: function(s) {
    // Example:
    // string.capitalize("foo bar") // => "Foo bar"
    return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  },

  camelCaseString: function(s) {
    // Spaces to camels, including first char
    // Example: string.camelCaseString("foo bar baz") // => "FooBarBaz"
    return s.split(" ").invoke('capitalize').join("")
  },

  camelize: function(s) {
    // Dashes to camels, excluding first char
    // Example: string.camelize("foo-bar-baz") // => "fooBarBaz"
    var parts = s.split('-'),
        len = parts.length;
    if (len == 1) return parts[0];

    var camelized = s.charAt(0) == '-' ?
        parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];
    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    return camelized;
  },

  truncate: function(s, length, truncation) {
    // Enforces that s is not more then `length` characters long.
    // Example:
    // string.truncate("123456789", 5) // => "12..."
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return s.length > length ?
      s.slice(0, length - truncation.length) + truncation : String(s);
  },

  regExpEscape: function(s) {
    // For creating RegExps from strings and not worrying about proper escaping
    // of RegExp special characters to literally match those.
    // Example:
    // var re = new RegExp(string.regExpEscape("fooo{20}"));
    // re.test("fooo") // => false
    // re.test("fooo{20}") // => true
    return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
            .replace(/\x08/g, '\\x08');
  },

  succ: function(s) {
    // Uses char code.
    // Example:
    // string.succ("a") // => "b"
    // string.succ("Z") // => "["
    return s.slice(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) + 1);
  },

  digitValue: function() {
    // ignore-in-doc
    return this.charCodeAt(0) - "0".charCodeAt(0);
  },

  times: function(s, count) {
    // Example:
    // string.times("test", 3) // => "testtesttest"
    return count < 1 ? '' : new Array(count + 1).join(s);
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*
 * Utility functions for JS Numbers.
 */
;(function(exports) {
"use strict";

var num = exports.num = {

  random: function(min, max) {
    // random number between (and including) `min` and `max`
    min = min || 0;
    max  = max || 100;
    return Math.round(Math.random() * (max-min) + min)
  },

  normalRandom: (function(mean, stdDev) {
    // returns randomized numbers in a normal distribution that can be
    // controlled ising the `mean` and `stdDev` parameters
    var spare, isSpareReady = false;
    return function(mean, stdDev) {
      if (isSpareReady) {
        isSpareReady = false;
        return spare * stdDev + mean;
      } else {
        var u, v, s;
        do {
          u = Math.random() * 2 - 1;
          v = Math.random() * 2 - 1;
          s = u * u + v * v;
        } while (s >= 1 || s == 0);
        var mul = Math.sqrt(-2.0 * Math.log(s) / s);
        spare = v * mul;
        isSpareReady = true;
        return mean + stdDev * u * mul;
      }
    }
  })(),

  randomSmallerInteger: function (n) { return Math.floor(Math.random() * n); },

  humanReadableByteSize: function(n) {
    // interpret `n` as byte size and print a more readable version
    // Example:
    //   num.humanReadableByteSize(Math.pow(2,32)) // => "4096MB"
    function round(n) { return Math.round(n * 100) / 100 }
    if (n < 1000) return String(round(n)) + 'B'
    n = n / 1024;
    if (n < 1000) return String(round(n)) + 'KB'
    n = n / 1024;
    return String(round(n)) + 'MB'
  },

  average: function(numbers) {
    // show-in-doc
    return numbers.reduce(function(sum, n) { return sum + n; }, 0) / numbers.length;
  },

  median: function(numbers) {
    // show-in-doc
    var sorted = numbers.sort(function(a,b) { return b - a; }),
        len = numbers.length;
    return len % 2 === 0 ?
      0.5 * (sorted[len/2-1] + sorted[len/2]) :
      sorted[(len-1)/2];
  },

  between: function(x, a, b, eps) {
    // is `a` <= `x` <= `y`?
    eps = eps || 0;
    var min, max;
    if (a < b) { min = a, max = b }
    else { max = a, min = b }
    return (max - x + eps >= 0) && (min - x - eps <= 0);
  },

  sort: function(arr) {
    // numerical sort, JavaScript native `sort` function is lexical by default.
    return arr.sort(function(a,b) { return a-b; });
  },

  parseLength: function(string, toUnit) {
    // This converts the length value to pixels or the specified `toUnit`.
    // length converstion, supported units are: mm, cm, in, px, pt, pc
    // Examples:
    // num.parseLength('3cm') // => 113.38582677165354
    // num.parseLength('3cm', "in") // => 1.1811023622047243
    toUnit = toUnit || 'px'
    var match = string.match(/([0-9\.]+)\s*(.*)/);
    if (!match || !match[1]) return undefined;
    var length = parseFloat(match[1]),
      fromUnit = match[2];
    return exports.num.convertLength(length, fromUnit, toUnit);
  },

  convertLength: (function() {
    // ignore-in-doc
    // num.convertLength(20, 'px', 'pt').roundTo(0.01)
    function toCm(n, unit) {
      // as defined in http://www.w3.org/TR/css3-values/#absolute-lengths
      if (unit === 'cm') return n;
      else if (unit === 'mm') return n*0.1;
      else if (unit === 'in') return n*2.54;
      else if (unit === 'px') return n*toCm(1/96, 'in');
      else if (unit === 'pt') return n*toCm(1/72, 'in');
      else if (unit === 'pc') return n*toCm(12, 'pt');
    }
    return function to(length, fromUnit, toUnit) {
      if (fromUnit === toUnit) return length;
      else if (toUnit === "cm") return toCm(length, fromUnit);
      else if (fromUnit === "cm") return length / toCm(1, toUnit);
      else return to(to(length, fromUnit, 'cm'), 'cm', toUnit);
    }
  })(),

  roundTo: function(n, quantum) {
    // `quantum` is something like 0.01,

    // for JS rounding to work we need the reciprocal
    quantum = 1 / quantum;
    return Math.round(n * quantum) / quantum;
  },

  detent: function(n, detent, grid, snap) {
    // This function is useful to implement smooth transitions and snapping.
    // Map all values that are within detent/2 of any multiple of grid to
    // that multiple. Otherwise, if snap is true, return self, meaning that
    // the values in the dead zone will never be returned. If snap is
    // false, then expand the range between dead zone so that it covers the
    // range between multiples of the grid, and scale the value by that
    // factor.
    // Examples:
    // // With snapping:
    // num.detent(0.11, 0.2, 0.5, true) // => 0.11
    // num.detent(0.39, 0.2, 0.5, true) // => 0.39
    // num.detent(0.55, 0.2, 0.5, true)  // => 0.5
    // num.detent(0.61, 0.2, 0.5, true)   // => 0.61
    // // Smooth transitions without snapping:
    // num.detent(0.1,  0.2, 0.5) // => 0
    // num.detent(0.11,  0.2, 0.5) // => 0.0166666
    // num.detent(0.34,  0.2, 0.5)  // => 0.4
    // num.detent(0.39,  0.2, 0.5) // => 0.4833334
    // num.detent(0.4,  0.2, 0.5) // => 0.5
    // num.detent(0.6,  0.2, 0.5) // => 0.5
    var r1 = exports.num.roundTo(n, grid); // Nearest multiple of grid
    if (Math.abs(n - r1) < detent / 2) return r1; // Snap to that multiple...
    if (snap) return n // ...and return n
    // or compute nearest end of dead zone
    var r2 = n < r1 ? r1 - (detent / 2) : r1 + (detent / 2);
    // and scale values between dead zones to fill range between multiples
    return r1 + ((n - r2) * grid / (grid - detent));
  },

  toDegrees: function(n) {
    // Example:
    // num.toDegrees(Math.PI/2) // => 90
    return (n * 180 / Math.PI) % 360;
  },

  toRadians: function(n) {
    // Example:
    // num.toRadians(180) // => 3.141592653589793
    return n / 180 * Math.PI;
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*
 * Util functions to print and work with JS date objects.
 */
;(function(exports) {
"use strict";

  var dateFormat = (function setupDateFormat() {

    /*
     * Date Format 1.2.3
     * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
     * MIT license
     *
     * Includes enhancements by Scott Trenda <scott.trenda.net>
     * and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */

    // http://blog.stevenlevithan.com/archives/date-time-format

    var dateFormat = (function() {
        var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date;
            if (isNaN(date)) throw SyntaxError("invalid date");

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var	_ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
            D = date[_ + "Day"](),
                m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                dd:   pad(d),
                    ddd:  dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m:    m + 1,
                    mm:   pad(m + 1),
                    mmm:  dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    yy:   String(y).slice(2),
                yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                HH:   pad(H),
                    M:    M,
                MM:   pad(M),
                    s:    s,
                ss:   pad(s),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L),
                    t:    H < 12 ? "a"  : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A"  : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    })();

    // Some common format strings
    dateFormat.masks = {
        "default":      "ddd mmm dd yyyy HH:MM:ss",
        shortDate:      "m/d/yy",
        mediumDate:     "mmm d, yyyy",
        longDate:       "mmmm d, yyyy",
        fullDate:       "dddd, mmmm d, yyyy",
        shortTime:      "h:MM TT",
        mediumTime:     "h:MM:ss TT",
        longTime:       "h:MM:ss TT Z",
        isoDate:        "yyyy-mm-dd",
        isoTime:        "HH:MM:ss",
        isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

    // Internationalization strings
    dateFormat.i18n = {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    };

    return dateFormat;

  })(); // end of setupDateFormat

exports.date = {

  format: (function(date, mask, utc) {
    // Custom date / time stringifier. Provides default masks:
    //
    // Mask           | Pattern
    // ---------------|--------------------------------
    // default        | `"ddd mmm dd yyyy HH:MM:ss"`
    // shortDate      | `"m/d/yy"`
    // mediumDate     | `"mmm d, yyyy"`
    // longDate       | `"mmmm d, yyyy"`
    // fullDate       | `"dddd, mmmm d, yyyy"`
    // shortTime      | `"h:MM TT"`
    // mediumTime     | `"h:MM:ss TT"`
    // longTime       | `"h:MM:ss TT Z"`
    // isoDate        | `"yyyy-mm-dd"`
    // isoTime        | `"HH:MM:ss"`
    // isoDateTime    | `"yyyy-mm-dd'T'HH:MM:ss"`
    // isoUtcDateTime | `"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"`
    //
    // and internationalized strings via `date.format.i18n.dayNames`
    // and `date.format.i18n.dayNames`
    // Examples:
    //   date.format(new Date(), date.format.masks.longTime) // => "7:13:31 PM PDT"
    //   date.format(new Date(), "yyyy/mm/dd") // => "2014/10/09"
    return dateFormat;
  })(),

  equals: function(date, otherDate) {
    // show-in-doc
    return otherDate
      && otherDate instanceof Date
      && otherDate.getTime() === date.getTime();
  },

  relativeTo: function(date, otherDate) {
    // Prints a human readable difference of two Date objects. The older date
    // goes first.
    // Examples:
    //   var now = new Date();
    //   date.relativeTo(new Date(now-2000), now) // => "2 secs"
    //   date.relativeTo(new Date("10/11/2014"), new Date("10/12/2014")) // => "1 day"
    if (!(otherDate instanceof Date)) return '';
    if (otherDate < date) return '';
    if (otherDate === date) return 'now';
    var minuteString = 'min',
        secondString = 'sec',
        hourString   = 'hour',
        dayString    = 'day',
        diff         = otherDate - date,
        totalSecs    = Math.round(diff/1000),
        secs         = totalSecs % 60,
        mins         = Math.floor(totalSecs/60)%60,
        hours        = Math.floor(totalSecs/60/60)%24,
        days         = Math.floor(totalSecs/60/60/24),
        parts        = [];
    if (days > 0) {
      parts.push(days);
      if (days > 1) dayString += 's';
      parts.push(dayString);
    }
    if (hours > 0 && days < 2) {
      parts.push(hours);
      if (hours > 1) hourString += 's';
      parts.push(hourString);
    }
    if (mins > 0 && hours < 3 && days === 0) {
      parts.push(mins);
      if (mins > 1) minuteString += 's';
      parts.push(minuteString);
    }
    if (secs > 0 && mins < 3 && hours === 0 && days === 0) {
      parts.push(secs);
      if (secs > 1) secondString += 's';
      parts.push(secondString);
    }
    return parts.join(' ');
  }

};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global process, global*/

/*
 * A lightweight class system that allows change classes at runtime.
 */

;(function(exports) {
"use strict";

var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
var Global = typeof window !== "undefined" ? window : global;

// ignore-in-doc
var classHelper = exports.classHelper = {

  anonymousCounter: 0,

  defaultCategoryName: 'default category',

  initializerTemplate: typeof lively !== "undefined" && lively.Config && lively.Config.loadRewrittenCode ?
    (function CLASS(){ classHelper.initializer.apply(this, arguments) }).toStringRewritten().replace(/__0/g, 'Global').replace(/__1/g, '__1') :
    (function CLASS(){ classHelper.initializer.apply(this, arguments) }).toString(),

  newInitializer: function(name) {
    // ignore-in-doc
    // this hack ensures that class instances have a name
    var src = classHelper.initializerTemplate.replace(/function\s*(CLASS)?\(\)/, 'function ' + name + '()');
    if (typeof lively !== "undefined" && lively.Config && lively.Config.loadRewrittenCode) {
      var idx = src.match('.*storeFrameInfo\([^\)]*, ([0-9]+)\)')[2];
      src = '__createClosure("core/lively/Base.js", ' + idx + ', Global, ' + src + ');';
    } else src += ' ' + name;
    var initializer = eval(src);
    initializer.displayName = name;
    return initializer;
  },

  initializer: function initializer() {
    // ignore-in-doc
    var firstArg = arguments[0];
    if (firstArg && firstArg.isInstanceRestorer) {
      // for deserializing instances just do nothing
    } else {
      // automatically call the initialize method
      this.initialize.apply(this, arguments);
    }
  },

  isValidIdentifier: (function() {
    // ignore-in-doc
    // As defined in the Ecmascript standard (http://www.ecma-international.org/ecma-262/5.1/#sec-7.6)
    // JS identifiers can consist out of several unicode character classes.
    // The code below was generated using the MIT licensed CSET library, see http://inimino.org/~inimino/blog/javascript_cset
    // The code to produce the regexps:
    //
    // var specialStart = fromString('$_'),
    //   Lu = fromUnicodeGeneralCategory('Lu'),
    //   Ll = fromUnicodeGeneralCategory('Ll'),
    //   Lt = fromUnicodeGeneralCategory('Lt'),
    //   Lm = fromUnicodeGeneralCategory('Lm'),
    //   Lo = fromUnicodeGeneralCategory('Lo'),
    //   Nl = fromUnicodeGeneralCategory('Nl');
    //   joiner1 = fromString("\u200C"),
    //   joiner2 = fromString("\u200D"),
    //   Mn = fromUnicodeGeneralCategory("Mn"),
    //   Mc = fromUnicodeGeneralCategory("Mc"),
    //   Nd = fromUnicodeGeneralCategory("Nd"),
    //   Pc = fromUnicodeGeneralCategory("Pc"),
    //   startCharTester = toRegex([specialStart,Lu,Ll,Lt,Lm,Lo,Nl].reduce(union)),
    //   precedingCharTester = toRegex([specialStart, Lu,Ll,Lt,Lm,Lo,Nl, joiner1, joiner2,Mn, Mc, Nd, Pc].reduce(union));
    // console.log('var startChars = /%s/;', startCharTester);
    // console.log('var precedingCharTester = /^(?:%s)*$/;', precedingCharTester);
    var tester = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/
    return function(string) { return tester.test(string); }
  })(),

  isClass: function(object) {
    if (object === Object
      || object === Array
      || object === Function
      || object === String
      || object === Boolean
      || object === Date
      || object === RegExp
      || object === Number) {
      return true;
    }
    return (object instanceof Function) && (object.superclass !== undefined);
  },

  className: function(cl) {
    if (cl === Object) return "Object"
    if (cl === Array) return "Array"
    if (cl === Function) return "Function"
    if (cl === String) return "String"
    if (cl === Boolean) return "Boolean"
    if (cl === Date) return "Date"
    if (cl === RegExp) return "RegExp"
    if (cl === Number) return "Number"
    return cl.type;
  },

  forName: function forName(name) {
    // ignore-in-doc
    // lookup the class object given the qualified name
    var ns = classHelper.namespaceFor(name),
      shortName = classHelper.unqualifiedNameFor(name);
    return ns[shortName];
  },

  deleteObjectNamed: function(name) {
    var ns = classHelper.namespaceFor(name),
      shortName = classHelper.unqualifiedNameFor(name);
    delete ns[shortName];
  },

  unqualifiedNameFor: function(name) {
    // ignore-in-doc
    var lastDot = name.lastIndexOf('.'), // lastDot may be -1
        unqualifiedName = name.substring(lastDot + 1);
    if (!classHelper.isValidIdentifier(unqualifiedName)) throw new Error('not a name ' + unqualifiedName);
    return unqualifiedName;
  },

  namespaceFor: function(className) {
    // ignore-in-doc
    // get the namespace object given the qualified name
    var lastDot = className ? className.lastIndexOf('.') : -1;
    if (lastDot < 0) return Global;
    var nsName = className.slice(0, lastDot);
    if (typeof lively !== "undefined" && lively.module) return lively.module(nsName);
    var path = exports.Path(nsName),
        ns = path.get(Global);
    return ns || path.set(Global, {}, true);
  },

  withAllClassNames: function(scope, callback) {
    for (var name in scope) {
      try {
        if (classHelper.isClass(scope[name])) callback(name);
      } catch (er) { /*FF exceptions*/ }
    }
    callback("Object");
    callback("Global");
  },

  getConstructor: function(object) {
    var c = object.constructor;
    return (c && c.getOriginal) ? c.getOriginal() : c;
  },

  getPrototype: function(object) {
    return this.getConstructor(object).prototype;
  },

  applyPrototypeMethod: function(methodName, target, args) {
    var method = this.getPrototype(target);
    if (!method) throw new Error("method " + methodName + " not found");
    return method.apply(this, args);
  },

  getSuperConstructor: function(object) {
    return this.getConstructor(object).superclass;
  },

  getSuperPrototype: function(object) {
    var sup = this.getSuperConstructor(object);
    return sup && sup.prototype;
  },

  addPins: function(cls, spec) {
    // ignore-in-doc
    if (Global.Relay) {
      classHelper.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
      return;
    }
    // ignore-in-doc
    // this is for refactoring away from Relay and friends
    if (!Object.isArray(spec)) throw new Error('Cannot deal with non-Array spec in addPins');
    function unstripName(name) { return name.replace(/[\+|\-]?(.*)/, '$1') };
    function needsSetter(name) { return !exports.string.startsWith(name, '-') };
    function needsGetter(name) { return !exports.string.startsWith(name, '+') };
    var mixinSpec = {};
    spec.forEach(function(specString) {
      var name = unstripName(specString);
      if (needsSetter(specString))
        mixinSpec['set' + name] = function(value) { return this['_' + name] = value }
      if (needsGetter(specString))
        mixinSpec['get' + name] = function() { return this['_' + name] }
    })
    classHelper.addMixin(cls, mixinSpec);
  },

  addMixin: function(cls, source) {
    var spec = {};
    for (var prop in source) {
      var value = source[prop];
      switch (prop) {
        case "constructor": case "initialize": case "deserialize": case "copyFrom":
        case "toString": case "definition": case "description":
          break;
        default:
          if (cls.prototype[prop] === undefined) // do not override existing values!
            spec[prop] = value;
      }
    }
    cls.addMethods(spec);
  }

};

// Methods for creating and modifying class objects.
exports.class
= {

  create: function(/*... */) {
    // Main method of the class system.
    // First argument can be the superclass or if no super class is specified
    // Object is the superclass. Second arg is the class name. The following
    // argument can be a JavaScript object whose keys and values will be
    // installed as attributes/methods of the class.
    // 
    // Note that when a class with the same name already exists it will be
    // modified so that interactive development is possible. To completely
    // remove a class use `lively.lang.class.remove(TheClass)`
    // Example:
    // lively.lang.class.create("NewClass", {
    //   method: function() { return 23; }
    // });
    // var instance = new NewClass();
    // instance.method() // => 23
    // //
    // // Alternatively class with superclass as first argument
    // lively.lang.class.create(NewClass, "NewClass2", {
    //   method: function($super) { return $super() + 2; }
    // });
    // var instance = new NewClass2();
    // instance.method() // => 25

    var args = exports.arr.from(arguments),
        superclass = args.shift(),
        className,
        targetScope = Global,
        shortName = null;

    if (!superclass || typeof superclass === "string") {
      className = superclass;
      superclass = Object;
    } else className = args.shift();

    if (className) {
      targetScope = classHelper.namespaceFor(className);
      shortName = classHelper.unqualifiedNameFor(className);
    }  else {
      shortName = "anonymous_" + (classHelper.anonymousCounter++);
      className = shortName;
    }

    var klass;
    if (className && targetScope[shortName] && (targetScope[shortName].superclass === superclass)) {
      // preserve the class to allow using the subclass construct in interactive development
      klass = targetScope[shortName];
    } else {
      klass = classHelper.newInitializer(shortName);
      klass.superclass = superclass;
      var protoclass = function() { }; // that's the constructor of the new prototype object
      protoclass.prototype = superclass.prototype;
      klass.prototype = new protoclass();
      klass.prototype.constructor = klass;
      klass.type = className; // KP: .name would be better but js ignores .name on anonymous functions
      klass.displayName = className; // for debugging, because name can not be assigned
      if (className) targetScope[shortName] = klass; // otherwise it's anonymous

      // remember the module that contains the class def
      if (typeof lively !== "undefined" && lively.Module && lively.Module.current)
        klass.sourceModule = lively.Module.current();

      // add a more appropriate toString implementation
      klass.toString = function() {
        var initCategory = exports.arr.detect(
                            Object.keys(klass.categories || {}),
                            function(category) {
                              return klass.categories[category].indexOf("initialize") > -1;
                            }) || "default category";
        return exports.string.format(
          'lively.lang.class.create(%s, "%s",\n"%s", {\n  initialize: %s\n}/*...*/)',
          klass.superclass.type || klass.superclass.name,
          klass.type, initCategory,
          klass.prototype.initialize);
      }
    };

    // the remaining args should be category strings or source objects
    exports.class.addMethods.apply(Global, [klass].concat(args));

    if (!klass.prototype.initialize)
      klass.prototype.initialize = function() {};

    return klass;
  },

  addMethods: function(/*...*/) {
    // Takes an exiting class and adds/replaces its methods by the supplied JS
    // object.

    var klass = arguments[0],
        args = arguments,
        category = classHelper.defaultCategoryName,
        traits = [];
    for (var i = 1; i < args.length; i++) {
      if (typeof args[i] === 'string') {
        category = args[i];
      } else if (Global.RealTrait && args[i] instanceof RealTrait) {
        // FIXME Traits are optional and defined in lively.Traits
        // This should go somewhere into lively.Traits...
        // we apply traits afterwards because they can override behavior
        traits.push(args[i]);
      } else {
        exports.class.addCategorizedMethods(klass, category,
          args[i] instanceof Function ? (args[i])() : args[i]);
      }
    }
    for (i = 0; i < traits.length; i++) traits[i].applyTo(klass);

    return klass;
  },

  addCategorizedMethods: function(klass, categoryName, source) {
    // first parameter is a category name
    // copy all the methods and properties from {source} into the
    // prototype property of the receiver, which is intended to be
    // a class constructor.    Method arguments named '$super' are treated
    // specially, see Prototype.js documentation for "classHelper.create()" for details.
    // derived from classHelper.Methods.addMethods() in prototype.js

    // prepare the categories
    if (!klass.categories) klass.categories = {};
    if (!klass.categories[categoryName]) klass.categories[categoryName] = [];
    var currentCategoryNames = klass.categories[categoryName];

    if (!source)
      throw dbgOn(new Error('no source in addCategorizedMethods!'));

    var ancestor = klass.superclass && klass.superclass.prototype;

    var className = klass.type || "Anonymous";

    for (var property in source) {

      if (property === 'constructor') continue;

      var getter = source.__lookupGetter__(property);
      if (getter) klass.prototype.__defineGetter__(property, getter);
      var setter = source.__lookupSetter__(property);
      if (setter) klass.prototype.__defineSetter__(property, setter);
      if (getter || setter) continue;

      currentCategoryNames.push(property);

      var value = source[property];
      // weirdly, RegExps are functions in Safari, so testing for
      // Object.isFunction on regexp field values will return true.
      // But they're not full-blown functions and don't
      // inherit argumentNames from Function.prototype

      var hasSuperCall = ancestor && typeof value === 'function' &&
          exports.fun.argumentNames(value)[0] == "$super";
      if (hasSuperCall) {
        // wrapped in a function to save the value of 'method' for advice
        (function() {
          var method = value;
          var advice = (function(m) {
            var cs = function callSuper() {
              var method = ancestor[m];
              if (!method) {
                throw new Error(exports.string.format('Trying to call super of' +
                  '%s>>%s but super method non existing in %s',
                  className, m, ancestor.constructor.type));
              }
              return method.apply(this, arguments);
            };
            cs.varMapping = {ancestor: ancestor, m: m};
            cs.isSuperCall = true;
            return cs;
          })(property);
  
          advice.methodName = "$super:" + (klass.superclass ? klass.superclass.type + ">>" : "") + property;
  
          value = exports.obj.extend(exports.fun.wrap(advice, method), {
            valueOf:  function() { return method; },
            toString: function() { return method.toString(); },
            originalFunction: method,
            methodName: advice.methodName,
            isSuperWrapper: true
          });
          // for lively.Closures
          method.varMapping = {$super: advice};
        })();
      }

      klass.prototype[property] = value;

      if (property === "formals") { // rk FIXME remove the cruft
        // special property (used to be pins, but now called formals to disambiguate old and new style
        classHelper.addPins(klass, value);
      } else if (typeof value === 'function') {
        // remember name for profiling in WebKit
        value.displayName = className + "$" + property;

        // remember where it was defined
        if (typeof lively !== "undefined" && lively.Module && lively.Module.current)
          value.sourceModule = lively.Module.current();

        for (; value; value = value.originalFunction) {
          value.declaredClass = klass.prototype.constructor.type;
          value.methodName = property;
        }
      }
    } // end of for (var property in source)

    return klass;
  },

  addProperties: function(klass, spec, recordType) {
    // ignore-in-doc
    classHelper.addMixin(klass, recordType.prototype.create(spec).prototype);
  },

  isSubclassOf: function(klassA, klassB) {
    // Is `klassA` a descendent of klassB?
    return exports.class.superclasses(klassA).indexOf(klassB) > -1;
  },

  superclasses: function(klass) {
    // show-in-doc
    if (!klass.superclass) return [];
    if (klass.superclass === Object) return [Object];
    return exports.class.superclasses(klass.superclass).concat([klass.superclass]);
  },

  categoryNameFor: function(klass, propName) {
    // ignore-in-doc
    for (var categoryName in klass.categories) {
      if (klass.categories[categoryName].indexOf(propName) > -1)
        return categoryName;
    }
    return null;
  },

  remove: function(klass) {
    // Remove `klass`, modifies the namespace the class is installed in.
    var ownerNamespace = classHelper.namespaceFor(klass.type),
        ownName = classHelper.unqualifiedNameFor(klass.type);
    delete ownerNamespace[ownName];
  }
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global clearTimeout, setTimeout, clearInterval, setInterval*/

/*
 * A pluggable interface to provide asynchronous, actor-like message
 * communication between JavaScript systems. Provides a unified message protocol
 * and send / receive methods.
 */
;(function(exports) {
"use strict";

var arr = exports.arr;
if (!arr) throw new Error("messenger.js needs collection.js!")

var fun = exports.fun;
if (!fun) throw new Error("messenger.js needs function.js!")

var string = exports.string;
if (!string) throw new Error("messenger.js needs string.js!")

var events = exports.events;
if (!events) throw new Error("messenger.js needs events.js!")

var obj = exports.obj;
if (!obj) throw new Error("messenger.js needs object.js!")

var OFFLINE = 'offline';
var ONLINE = 'online';
var CONNECTING = 'connecting';

/*

A messenger is an object that provides a common, message-based interface. Messengers expect you to provide an implementation of a small number of methods: `send`, `listen`, `close`, and `isOnline`. A messenger will then provide a unified interface for sending and receiving messages. Common boilerplate functionality such as queuing messages, error handling, dealing with instable connections, heartbeats, etc. is handled by the messenger object automatically (and can be parameterized).

This allows to use a single interface across a range of heterogeneous objects without having to implement every detail of the abstraction repeatedly. This is especially valuable when dealing with asynchronous or remote communication (web workers, XHR requests, WebSockets, node.js processes, ...).

To see a minimal example of how to use messengers for the local communication between JavaScript objects [see this example](#messenger-example).

A more sophisticated example of messengers is [the worker implementation](worker.js) which provides an actor-like worker interface that uses web workers in web browsers and child_process.fork in node.js.

```js
var msger = lively.lang.messenger.create({
  send: function(msg, onSendDone) { console.log(msg); onSendDone(); },
  listen: function(thenDo) { thenDo(); },
  close: function(thenDo) { thenDo(); },
  isOnline: function() { return true }
});
```

#### Messenger interface

The interface methods are build to enable an user to send and receive
messages. Each messenger provides the following methods:

##### msger.id()

Each msger has an id that can either be defined by the user when the
msger is created or is automatically assigned. The id should be unique for each
messenger in a messenger network. It is used as the `target` attribute to
address messages and internally in the messaging implementation for routing.
See the [message protocol](#messenger-message-protocol) description for more info.

##### msger.isOnline()

Can the msger send and receive messages right now?

##### msger.heartbeatEnabled()

Does the msger send automated heartbeat messages?

##### msger.listen(optionalCallback)

Brings the messenger "online": Starts listening for messages and brings it
into a state to send messages. `optionalCallback` is a function that is called
when listening begins. It should accept one argument `error` that is null if no
error occured when listening was started, an Error object otherwise.

##### msger.send(msg, onReceiveFunc)

Sends a message. The message should be structured according to the [message
protocol](#messenger-message-protocol). `onReceiveFunc` is triggered when the `msg` is being
answered. `onReceiveFunc` should take two arguments: `error` and `answer`.
`answer` is itself a message object.

##### msger.sendTo(target, action, data, onReceiveFunc)

A simpler `send`, the `msg` object is automatically assembled. `target`
should be an id of the receiver and `action` a string naming the service that
should be triggered on the receiver.

##### msger.answer(msg, data, expectMore, whenSend)

Assembles an answer message for `msg` that includes `data`. `expectMore`
should be truthy when multiple answers should be send (a streaming response,
see the [messaging protocol](#messenger-message-protocol)).

##### msger.close(thenDo)

Stops listening.

##### msger.whenOnline(thenDo)

Registers a callback that is triggered as soon as a listen attempt succeeds
(or when the messenger is listening already then it succeeds immediately).

##### msger.outgoingMessages()

Returns the messages that are currently inflight or not yet send.

##### msger.addServices(serviceSpec)

Add services to the messenger. `serviceSpec` should be  JS object whose keys
correspond to message actions:

```js
msg.addServices({
  helloWorld: function(msg, messenger) {
    messenger.answer(msg, "received a message!");
  }
});
```

See the examples below for more information.

##### *[event]* msger.on("message")

To allow users to receive messages that were not initiated by a send,
messengers are [event emitters](events.js) that emit `"message"` events
whenever they receive a new message.

The messenger object is used to create new messenger interfaces and ties
them to a specific implementation. Please see [worker.js]() for examples of
how web workers and node.js processes are wrapped to provide a cross-platform
interface to a worker abstraction.


#### <a name="messenger-message-protocol"></a>Message protocol

A message is a JSON object with the following fields:

```js
var messageSchema = {

    // REQUIRED selector for service lookup. By convention action gets
    // postfixed with "Result" for response messages
    action: STRING,

    // REQUIRED target of the message, the id of the receiver
    target: UUID,

    // OPTIONAL arguments
    data: OBJECT,

    // OPTIONAL identifier of the message, will be provided if not set by user
    messageId: UUID,

    // OPTIONAL sender of the message, will be provided if not set by user
    sender: UUID,

    // OPTIONAL identifier of a message that this message answers, will be provided
    inResponseTo: UUID,

    // OPTIONAL if message is an answer. Can be interpreted by the receiver as
    // a streaming response. Lively participants (tracker and clients) will
    // trigger data bindings and fire callbacks for a message for every streaming
    // response
    expectMoreResponses: BOOL,

    // EXPERIMENTAL UUIDs of trackers/sessions handlers that forwarded this
    // message
    route: ARRAY
}
```

The `sendTo` and `answer` methods of messengers will automatically create these
messages. If the user invokes the `send` method then a JS object according to
the schema above should be passed as the first argument.

#### <a name="messenger-example"></a>Messenger examples

The following code implements what is needed to use a messenger to communicate
between any number of local JavaScript objects. Instead of dispatching methods using
a local list of messengers you will most likely use an existing networking /
messaging mechanism.

See the [worker](#) and [its implementation](worker.js) for a real use case in
which forking processes in the browser using Web Workers and in node.js using
child_process.fork is unified.

```js
// spec that defines message sending in terms of receivers in the messengers list
var messengers = [];
var messengerSpec = {
  send: function(msg, onSendDone) {
    var err = null, recv = arr.detect(messengers, function(ea) {
          return ea.id() === msg.target; });
    if (recv) recv.onMessage(msg);
    else err = new Error("Could not find receiver " + msg.target);
    onSendDone(err);
  },
  listen: function(thenDo) { arr.pushIfNotIncluded(messengers, this); },
  close: function(thenDo) { arr.remove(messengers, this); },
  isOnline: function() { return arr.include(messengers, this); }
};

// Create the messengers and add a simple "service"
var msger1 = messenger.create(messengerSpec);
var msger2 = messenger.create(messengerSpec);
msger2.addServices({
  add: function(msg, msger) { msger.answer(msg, {result: msg.data.a + msg.data.b}); }
});

// turn'em on...
msger1.listen();
msger2.listen();

// ...and action!
msger1.sendTo(msger2.id(), 'add', {a: 3, b: 4},
  function(err, answer) { alert(answer.data.result); });
```

*/


var messenger = exports.messenger = {
  
  OFFLINE: OFFLINE,
  ONLINE: ONLINE,
  CONNECTING: CONNECTING,

  create: function(spec) {

    var expectedMethods = [
      {name: "send", args: ['msg', 'callback']},
      {name: "listen", args: ['messenger', 'callback']},
      {name: "close", args: ['messenger', 'callback']},
      {name: "isOnline", args: []}
    ];
    expectedMethods.forEach(function(exp) {
      if (spec[exp.name]) return;
        var msg = "message implementation needs function "
                + exp.name + "(" + (exp.args.join(',')) + ")";
        throw new Error(msg);
    });

    var heartbeatInterval = spec.sendHeartbeat && (spec.heartbeatInterval || 1000);
    var ignoreUnknownMessages = spec.hasOwnProperty("ignoreUnknownMessages") ? spec.ignoreUnknownMessages : false;

    var messenger = {

      _outgoing: [],
      _inflight: [],
      _id: spec.id || string.newUUID(),
      _ignoreUnknownMessages: ignoreUnknownMessages,
      _services: {},
      _messageCounter: 0,
      _messageResponseCallbacks: {},
      _whenOnlineCallbacks: [],
      _statusWatcherProc: null,
      _startHeartbeatProcessProc: null,
      _listenInProgress: null,
      _heartbeatInterval: heartbeatInterval,
      _status: OFFLINE,

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      _runWhenOnlineCallbacks: function() {
        var cbs = arr.clone(messenger._whenOnlineCallbacks);
        messenger._whenOnlineCallbacks = [];
        cbs.forEach(function(ea) {
          try { ea.call(null, null, messenger); } catch (e) {
            console.error("error in _runWhenOnlineCallbacks: %s", e);
          }
        });
      },

      _ensureStatusWatcher: function() {
        if (messenger._statusWatcherProc) return;
        messenger._statusWatcherProc = setInterval(function() {
          if (messenger.isOnline() && messenger._whenOnlineCallbacks.length)
            messenger._runWhenOnlineCallbacks();
          var prevStatus = messenger._status;
          messenger._status = messenger.isOnline() ? ONLINE : OFFLINE;
          if (messenger._status !== ONLINE && messenger._statusWatcherProc) {
            messenger.reconnect();
          }
          if (messenger._status !== prevStatus && messenger.onStatusChange) {
            messenger.onStatusChange();
          }
        }, 20);
      },

      _addMissingData: function(msg) {
        if (!msg.target) throw new Error("Message needs target!");
        if (!msg.action) throw new Error("Message needs action!");
        if (!msg.data) msg.data = null;
        if (!msg.messageId) msg.messageId = string.newUUID();
        msg.sender = messenger.id();
        msg.messageIndex = messenger._messageCounter++;
        return msg;
      },

      _queueSend: function(msg, onReceiveFunc) {
        if (onReceiveFunc && typeof onReceiveFunc !== 'function')
          throw new Error("Expecing a when send callback, got: " + onReceiveFunc);
        messenger._outgoing.push([msg, onReceiveFunc]);
      },

      _deliverMessageQueue: function() {
        if (!spec.allowConcurrentSends && messenger._inflight.length) return;

        var queued = messenger._outgoing.shift();
        if (!queued) return;

        messenger._inflight.push(queued);
        if (messenger.isOnline()) deliver(queued);
        else messenger.whenOnline(function() { deliver(queued); });
        startTimeoutProc(queued);

        if (spec.allowConcurrentSends && messenger._outgoing.length)
          messenger._deliverMessageQueue();

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function deliver(queued) {
          if (messenger._inflight.indexOf(queued) === -1) return; // timed out
          var msg = queued[0], callback = queued[1];
          if (callback)
            messenger._messageResponseCallbacks[msg.messageId] = callback;

          spec.send.call(messenger, msg, function(err) {
            arr.remove(messenger._inflight, queued);
            if (err) onSendError(err, queued);
            messenger._deliverMessageQueue();
          });
        }

        function startTimeoutProc(queued) {
          if (typeof spec.sendTimeout !== 'number') return;
          setTimeout(function() {
            if (messenger._inflight.indexOf(queued) === -1) return; // delivered
            arr.remove(messenger._inflight, queued);
            onSendError(new Error('Timeout sending message'), queued);
            messenger._deliverMessageQueue();
          }, spec.sendTimeout);
        }

        function onSendError(err, queued) {
          var msg = queued[0], callback = queued[1];
          delete messenger._messageResponseCallbacks[msg.messageId];
          console.error(err);
          callback && callback(err);
        }
      },

      _startHeartbeatProcess: function() {
        if (messenger._startHeartbeatProcessProc) return;
        messenger._startHeartbeatProcessProc = setTimeout(function() {
          spec.sendHeartbeat.call(messenger, function(err, result) {
            messenger._startHeartbeatProcessProc = null;
            messenger._startHeartbeatProcess();
          })
        }, messenger._heartbeatInterval);
      },

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      id: function() { return messenger._id; },

      isOnline: function() { return spec.isOnline.call(messenger); },

      heartbeatEnabled: function() {
        return typeof messenger._heartbeatInterval === 'number';
      },

      listen: function(thenDo) {
        if (messenger._listenInProgress) return;
        messenger._listenInProgress = true;
        messenger._ensureStatusWatcher();
        return spec.listen.call(messenger, function(err) {
          messenger._listenInProgress = null;
          thenDo && thenDo(err);
          if (messenger.heartbeatEnabled())
            messenger._startHeartbeatProcess();
        });
        return messenger;
      },

      reconnect: function() {
        if (messenger._status === ONLINE) return;
        messenger.listen();
        return messenger;
      },

      send: function(msg, onReceiveFunc) {
        messenger._addMissingData(msg);
        messenger._queueSend(msg, onReceiveFunc);
        messenger._deliverMessageQueue();
        return msg;
      },

      sendTo: function(target, action, data, onReceiveFunc) {
        var msg = {target: target, action: action, data: data};
        return messenger.send(msg, onReceiveFunc);
      },

      onMessage: function(msg) {
        messenger.emit("message", msg);
        if (msg.inResponseTo) {
          var cb = messenger._messageResponseCallbacks[msg.inResponseTo];
          if (cb && !msg.expectMoreResponses) delete messenger._messageResponseCallbacks[msg.inResponseTo];
          if (cb) cb(null, msg);
        } else {
          var action = messenger._services[msg.action];
          if (action) {
            try {
              action.call(null, msg, messenger);
            } catch (e) {
              console.error("Error invoking service: " + e);
              messenger.answer(msg, {error: String(e)});
            }
          } else if (!messenger._ignoreUnknownMessages) {
            var err = new Error("messageNotUnderstood: " + msg.action);
            messenger.answer(msg, {error: String(err)});
          }
        }
      },

      answer: function(msg, data, expectMore, whenSend) {
        if (typeof expectMore === 'function') {
          whenSend = expectMore; expectMore = false; }
        var answer = {
          target: msg.sender,
          action: msg.action + 'Result',
          inResponseTo: msg.messageId,
          data: data};
        if (expectMore) answer.expectMoreResponses = true;
        return messenger.send(answer, whenSend);
      },

      close: function(thenDo) {
        clearInterval(messenger._statusWatcherProc);
        messenger._statusWatcherProc = null;
        spec.close.call(messenger, function(err) {
          messenger._status = OFFLINE;
          thenDo && thenDo(err);
        });
        return messenger;
      },

      whenOnline: function(thenDo) {
        messenger._whenOnlineCallbacks.push(thenDo);
        if (messenger.isOnline()) messenger._runWhenOnlineCallbacks();
        return messenger;
      },

      outgoingMessages: function() {
        return arr.pluck(messenger._inflight.concat(messenger._outgoing), 0);
      },

      addServices: function(serviceSpec) {
        obj.extend(messenger._services, serviceSpec);
        return messenger;
      }
    }

    if (spec.services) messenger.addServices(spec.services);
    events.makeEmitter(messenger);

    return messenger;
  }

};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global require, Worker, URL, webkitURL, Blob, BlobBuilder, process, require*/

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
    importScripts.apply(this, options.scriptsToLoad || []);
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
    Global = this;
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

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));

//# sourceMappingURL=lively.lang.dev.js.map