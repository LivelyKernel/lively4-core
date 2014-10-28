/*global window, process, global*/

;(function() {
"use strict";

var globalInterfaceSpec = [
  {action: "installMethods", target: "Array",              sources: ["arr"],    methods: ["from","genN","range","withN"]},
  {action: "installMethods", target: "Array.prototype",    sources: ["arr"],    methods: ["all","any","batchify","clear","clone","collect","compact","delimWith","detect","doAndContinue","each","equals","filterByKey","findAll","first","flatten","forEachShowingProgress","grep","groupBy","groupByKey","histogram","include","inject","intersect","invoke","last","mask","max","min","mutableCompact","nestedDelay","partition","pluck","pushAll","pushAllAt","pushAt","pushIfNotIncluded","reMatches","reject","rejectByKey","remove","removeAt","replaceAt","rotate","shuffle","sortBy","sortByKey","sum","swap","toArray","toTuples","union","uniq","uniqBy","without","withoutAll","zip"], alias: [["select", "filter"],["find","detect"]]},
  {action: "installMethods", target: "Date",               sources: ["date"],   methods: [/*"parse"*/]},
  {action: "installMethods", target: "Date.prototype",     sources: ["date"],   methods: ["equals","format","relativeTo"]},
  {action: "installMethods", target: "Function",           sources: ["fun"],    methods: ["fromString"]},
  {action: "installMethods", target: "Function.prototype", sources: ["fun"],    methods: [/*"addProperties",*/"addToObject","argumentNames","asScript","asScriptOf","binds","curry","delay","getOriginal","getVarMapping","logCalls","logCompletion","logErrors","qualifiedMethodName","setProperty","traceCalls","wrap"]},
  {action: "installMethods", target: "Number",             sources: ["num"],    methods: []},
  {action: "installMethods", target: "Number.prototype",   sources: ["num"],    methods: ["detent","randomSmallerInteger","roundTo","toDegrees","toRadians"]},
  {action: "installMethods", target: "Object",             sources: ["obj"],    methods: ["addScript","clone","deepCopy","extend","inherit","isArray","isBoolean","isElement","isEmpty","isFunction","isNumber","isObject","isRegExp","isString","isUndefined","merge","mergePropertyInHierarchy","values","valuesInPropertyHierarchy"]},
  {action: "installMethods", target: "Object.prototype",   sources: ["obj"],    methods: []},
  {action: "installMethods", target: "String.prototype",   sources: ["string"], methods: ["camelize","capitalize","digitValue","empty","endsWith","hashCode","include","pad","regExpEscape","startsWith","startsWithVowel","succ","times","toArray","toQueryParams","truncate"]},

  {action: "installObject", target: "Numbers",                source: "num",        methods: ["average","between","convertLength","humanReadableByteSize","median","normalRandom","parseLength","random","sort"]},
  {action: "installObject", target: "Properties",             source: "properties", methods: ["all","allOwnPropertiesOrFunctions","allProperties","any","forEachOwn","hash","nameFor","own","ownValues","values"]},
  {action: "installObject", target: "Strings",                source: "string",     methods: ["camelCaseString","createDataURI","diff","format","formatFromArray","indent","lineIndexComputer","lines","md5","newUUID","nonEmptyLines","pad","paragraphs","peekLeft","peekRight","print","printNested","printTable","printTree","quote","reMatches","removeSurroundingWhitespaces","stringMatch","tableize","tokens","unescapeCharacterEntities","withDecimalPrecision"]},
  {action: "installObject", target: "Objects",                source: "obj",        methods: ["equals","inspect","isMutableType","safeToString","shortPrintStringOf","typeStringOf"]},
  {action: "installObject", target: "Functions",              source: "fun",        methods: ["all","compose","composeAsync","createQueue","debounce","debounceNamed","either","extractBody","flip","wrapperChain","notYetImplemented","once","own","throttle","throttleNamed","timeToRun","timeToRunN","waitFor","workerWithCallbackQueue"], alias: [["methodChain", "wrapperChain"]]},
  {action: "installObject", target: "Grid",                   source: "grid"},
  {action: "installObject", target: "Interval",               source: "interval"},
  {action: "installObject", target: "lively.ArrayProjection", source: "arrayProjection"},
  {action: "installObject", target: "lively.Closure",         source: "Closure"},
  {action: "installObject", target: "lively.Grouping",        source: "Group"},
  {action: "installObject", target: "lively.PropertyPath",    source: "Path"},
  {action: "installObject", target: "lively.Worker",          source: "worker"}
];

var Global = typeof window !== "undefined" ? window : global;
var isNode = typeof process !== 'undefined'
          && process.versions && process.versions.node;

var jsext = createLivelyLangObject();
if (isNode) module.exports.jsext = jsext;
else Global.jsext = jsext;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function createLivelyLangObject() {
  return {
    chain: chain,
    noConflict: noConflict,
    installGlobals: installGlobals,
    uninstallGlobals: uninstallGlobals,
    globalInterfaceSpec: globalInterfaceSpec
  };
}

function chain(object) {
  if (!object) return object;

  var chained;
  if (Array.isArray(object)) return createChain(jsext.arr, object);
  if (object.constructor.name === "Date") return createChain(jsext.date, object);
  switch (typeof object) {
    case 'string': return createChain(jsext.string, object);
    case 'object': return createChain(jsext.obj, object);
    case 'function': return createChain(jsext.fun, object);
    case 'number': return createChain(jsext.num, object);
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
  if (!isNode && typeof window !== "undefined") delete window.jsext;
  return jsext;
}

function installGlobals() {
  globalInterfaceSpec.forEach(function(ea) {
    if (ea.action === "installMethods") {
      var targetPath = jsext.Path(ea.target);
      if (!targetPath.isIn(Global)) targetPath.set(Global, {}, true);
      var sourcePath = jsext.Path(ea.sources[0]);
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
      var targetPath = jsext.Path(ea.target);
      var source = jsext.Path(ea.source).get(jsext);
      targetPath.set(Global, source, true);
      
    } else throw new Error("Cannot deal with global setup action: " + ea.action);
  });
}

function installProperty(sourcePath, targetPath) {
  if (!sourcePath.isIn(jsext)) {
    var err = new Error("property not provided by lively.lang: " + sourcePath);
    console.error(err.stack || err);
    throw err;
  }

  var prop = sourcePath.get(jsext);
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
      var p = jsext.Path(ea.target)
      var target = p.get(Global);
      if (!target) return;
      ea.methods.forEach(function(name) { delete target[name]; });
      if (ea.alias)
        ea.alias.forEach(function(mapping) { delete target[mapping[0]]; });

    } else if (ea.action === "installObject") {
      var p = jsext.Path(ea.target);
      p.del(Global);
      
    } else throw new Error("Cannot deal with global setup action: " + ea.action);
  })
}

})();
