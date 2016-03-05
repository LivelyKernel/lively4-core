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
    {action: "installMethods", target: "Function.prototype", sources: ["klass"],  methods: ["create","addMethods","isSubclassOf","superclasses","categoryNameFor","remove"], alias: [["subclass", "create"]]},

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

  var isNode = typeof require !== 'undefined' && typeof exports !== 'undefined';

  var livelyLang = createLivelyLangObject();
  if (isNode) { module.exports = livelyLang; return; }
  
  livelyLang._prevLivelyGlobal = Global.lively;
  if (!Global.lively) Global.lively = {};
  if (!Global.lively.lang) Global.lively.lang = livelyLang;
  else
    for (var name in livelyLang) {
      Global.lively.lang[name] = livelyLang[name];
    }

  return;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function createLivelyLangObject() {
    return {
      chain: chain,
      noConflict: noConflict,
      installGlobals: installGlobals,
      uninstallGlobals: uninstallGlobals,
      globalInterfaceSpec: globalInterfaceSpec,
      deprecatedLivelyPatches: deprecatedLivelyPatches,
      toString: function() { return "[object lively.lang]"; }
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
        var source = livelyLang.Path(ea.source).get(livelyLang);
        var target = p.get(Global);
        if (!target) return;
        ea.methods
          .filter(function(name) { return source === target[name]; })
          .forEach(function(name) { delete target[name]; });
        if (ea.alias)
          ea.alias
            .filter(function(name) { return source === target[name]; })
            .forEach(function(mapping) { delete target[mapping[0]]; });

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
