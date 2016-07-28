
;(function() {
  var GLOBAL = typeof window !== "undefined" ? window :
    typeof global!=="undefined" ? global :
      typeof self!=="undefined" ? self : this;
  var lively = GLOBAL.lively = GLOBAL.lively || (GLOBAL.lively = {});
/*global window, process, global*/


;(function(Global) {

  var globalInterfaceSpec = [
    {action: "installMethods", target: "Array",              sources: ["arr"],    methods: ["from","genN","range","withN"]},
    {action: "installMethods", target: "Array.prototype",    sources: ["arr"],    methods: ["all","any","batchify","clear","clone","collect","compact","delimWith","detect","doAndContinue","each","equals","filterByKey","findAll","first","flatten","forEachShowingProgress","grep","groupBy","groupByKey","histogram","include","inject","intersect","invoke","last","mapAsync", "mapAsyncSeries", "mask","max","min","mutableCompact","nestedDelay","partition","pluck","pushAll","pushAllAt","pushAt","pushIfNotIncluded","reMatches","reject","rejectByKey","remove","removeAt","replaceAt","rotate","shuffle","size","sortBy","sortByKey","sum","swap","toArray","toTuples","union","uniq","uniqBy","without","withoutAll","zip"], alias: [["select", "filter"]]},
    {action: "installMethods", target: "Date",               sources: ["date"],   methods: [/*"parse"*/]},
    {action: "installMethods", target: "Date.prototype",     sources: ["date"],   methods: ["equals","format","relativeTo"]},
    {action: "installMethods", target: "Function",           sources: ["fun"],    methods: ["fromString"]},
    {action: "installMethods", target: "Function.prototype", sources: ["fun"],    methods: [/*"addProperties",*/"addToObject","argumentNames","asScript","asScriptOf","binds","curry","delay","functionNames","localFunctionNames","getOriginal","getVarMapping","logCalls","logCompletion","logErrors","qualifiedMethodName","setProperty","traceCalls","wrap"]},
    {action: "installMethods", target: "Number",             sources: ["num"],    methods: []},
    {action: "installMethods", target: "Number.prototype",   sources: ["num"],    methods: ["detent","randomSmallerInteger","roundTo","toDegrees","toRadians"]},
    {action: "installMethods", target: "Object",             sources: ["obj"],    methods: ["addScript","clone","deepCopy","extend","inherit","isArray","isBoolean","isElement","isEmpty","isFunction","isNumber","isObject","isRegExp","isString","isUndefined","merge","mergePropertyInHierarchy","values","valuesInPropertyHierarchy"]},
    {action: "installMethods", target: "Object.prototype",   sources: ["obj"],    methods: []},
    {action: "installMethods", target: "String.prototype",   sources: ["string"], methods: ["camelize","capitalize","digitValue","empty","hashCode","include","pad","regExpEscape","startsWithVowel","succ","times","toArray","toQueryParams","truncate"]},
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
  if (isNode) { module.exports = livelyLang; if (!Global.lively) return; }

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

    // rk 2016-05-22: !!! in order to not capture objects in the lexical scope of
    // eval as they were defined while THIS files WAS loaded, we need to inject
    // globals / context, i.e. local lively here might be != Global.lively!

    Function.evalJS = livelyLang.fun.evalJS = function(src) {
        var fixVars = ""
            + "var Global = typeof System !== 'undefined' ? System.global :\n"
            + "    typeof window !== 'undefined' ? window :\n"
            + "    typeof global!=='undefined' ? global :\n"
            + "    typeof self!=='undefined' ? self : this;\n";
        if (Global.lively && Global.lively != lively)
            fixVars += "var lively = Global.lively;\n";
        return eval(fixVars + src);
    }

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

})(typeof window !== "undefined" ? window :
    typeof global!=="undefined" ? global :
      typeof self!=="undefined" ? self : this);
;
(function (exports) {
    'use strict';
    function print(object) {
        if (object && obj.isArray(object)) {
            return '[' + object.map(print) + ']';
        }
        if (typeof object !== 'string') {
            return String(object);
        }
        var result = String(object);
        result = result.replace(/\n/g, '\\n\\\n');
        result = result.replace(/(")/g, '\\$1');
        result = '"' + result + '"';
        return result;
    }
    function indent(str, indentString, depth) {
        if (!depth || depth <= 0)
            return str;
        while (depth > 0) {
            depth--;
            str = indentString + str;
        }
        return str;
    }
    var obj = exports.obj = {
        isArray: function (obj) {
            return obj && Array.isArray(obj);
        },
        isElement: function (object) {
            return object && object.nodeType == 1;
        },
        isFunction: function (object) {
            return object instanceof Function;
        },
        isBoolean: function (object) {
            return typeof object == 'boolean';
        },
        isString: function (object) {
            return typeof object == 'string';
        },
        isNumber: function (object) {
            return typeof object == 'number';
        },
        isUndefined: function (object) {
            return typeof object == 'undefined';
        },
        isRegExp: function (object) {
            return object instanceof RegExp;
        },
        isObject: function (object) {
            return typeof object == 'object';
        },
        isPrimitive: function (obj) {
            if (!obj)
                return true;
            switch (typeof obj) {
            case 'string':
            case 'number':
            case 'boolean':
                return true;
            }
            return false;
        },
        isEmpty: function (object) {
            for (var key in object)
                if (object.hasOwnProperty(key))
                    return false;
            return true;
        },
        equals: function (a, b) {
            if (a === b)
                return true;
            if (!a && !b)
                return true;
            if (!a || !b)
                return false;
            if (Array.isArray(a))
                return exports.arr.deepEquals(a, b);
            switch (a.constructor) {
            case String:
            case Date:
            case Boolean:
            case Number:
                return a == b;
            }
            ;
            if (typeof a.isEqualNode === 'function')
                return a.isEqualNode(b);
            if (typeof a.equals === 'function')
                return a.equals(b);
            return cmp(a, b) && cmp(b, a);
            function cmp(left, right) {
                for (var name in left) {
                    if (typeof left[name] === 'function')
                        continue;
                    if (!obj.equals(left[name], right[name]))
                        return false;
                }
                return true;
            }
        },
        keys: Object.keys || function (object) {
            var keys = [];
            for (var property in object)
                keys.push(property);
            return keys;
        },
        values: function (object) {
            return object ? Object.keys(object).map(function (k) {
                return object[k];
            }) : [];
        },
        select: function (obj, keys) {
            var selected = {};
            for (var i = 0; i < keys.length; i++)
                selected[keys[i]] = obj[keys[i]];
            return selected;
        },
        dissoc: function (object, keys) {
            var result = {};
            for (var name in object)
                if (object.hasOwnProperty(name) && keys.indexOf(name) === -1)
                    result[name] = object[name];
            return result;
        },
        addScript: function (object, funcOrString, optName, optMapping) {
            var func = exports.fun.fromString(funcOrString);
            return exports.fun.asScriptOf(func, object, optName, optMapping);
        },
        extend: function (destination, source) {
            var currentCategoryNames = null;
            for (var i = 1; i < arguments.length; i++) {
                if (typeof arguments[i] == 'string') {
                    var catName = arguments[i];
                    if (!destination.categories)
                        destination.categories = {};
                    if (!destination.categories[catName])
                        destination.categories[catName] = [];
                    currentCategoryNames = destination.categories[catName];
                    continue;
                }
                var source = arguments[i];
                for (var property in source) {
                    var getter = source.__lookupGetter__(property), setter = source.__lookupSetter__(property);
                    if (getter)
                        destination.__defineGetter__(property, getter);
                    if (setter)
                        destination.__defineSetter__(property, setter);
                    if (getter || setter)
                        continue;
                    var sourceObj = source[property];
                    destination[property] = sourceObj;
                    if (currentCategoryNames)
                        currentCategoryNames.push(property);
                    if (typeof sourceObj === 'function') {
                        if (!sourceObj.displayName)
                            sourceObj.displayName = property;
                        if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
                            sourceObj.sourceModule = lively.Module.current();
                    }
                }
            }
            return destination;
        },
        clone: function (object) {
            if (obj.isPrimitive(object))
                return object;
            if (Array.isArray(object))
                return Array.prototype.slice.call(object);
            var clone = {};
            for (var key in object) {
                if (object.hasOwnProperty(key))
                    clone[key] = object[key];
            }
            return clone;
        },
        extract: function (object, properties, mapFunc) {
            var copied = {};
            for (var i = 0; i < properties.length; i++) {
                if (properties[i] in object)
                    copied[properties[i]] = mapFunc ? mapFunc(properties[i], object[properties[i]]) : object[properties[i]];
            }
            return copied;
        },
        inspect: function inspect(object, options, depth) {
            options = options || {};
            depth = depth || 0;
            if (options.customPrinter) {
                var ignoreSignal = options._ignoreSignal || (options._ignoreSignal = {});
                var customInspected = options.customPrinter(object, ignoreSignal);
                if (customInspected !== ignoreSignal)
                    return customInspected;
            }
            if (!object)
                return print(object);
            if (typeof object === 'function') {
                return options.printFunctionSource ? String(object) : 'function' + (object.name ? ' ' + object.name : '') + '(' + exports.fun.argumentNames(object).join(',') + ') {/*...*/}';
            }
            switch (object.constructor) {
            case String:
            case Boolean:
            case RegExp:
            case Number:
                return print(object);
            }
            ;
            if (typeof object.serializeExpr === 'function')
                return object.serializeExpr();
            var isArray = object && Array.isArray(object), openBr = isArray ? '[' : '{', closeBr = isArray ? ']' : '}';
            if (options.maxDepth && depth >= options.maxDepth)
                return openBr + '/*...*/' + closeBr;
            var printedProps = [];
            if (isArray) {
                printedProps = object.map(function (ea) {
                    return inspect(ea, options, depth + 1);
                });
            } else {
                printedProps = Object.keys(object).sort(function (a, b) {
                    var aIsFunc = typeof object[a] === 'function', bIsFunc = typeof object[b] === 'function';
                    if (aIsFunc === bIsFunc) {
                        if (a < b)
                            return -1;
                        if (a > b)
                            return 1;
                        return 0;
                    }
                    return aIsFunc ? 1 : -1;
                }).map(function (key, i) {
                    if (isArray)
                        inspect(object[key], options, depth + 1);
                    var printedVal = inspect(object[key], options, depth + 1);
                    return options.escapeKeys ? Strings.print(key) : key + ': ' + printedVal;
                });
            }
            if (printedProps.length === 0) {
                return openBr + closeBr;
            }
            var printedPropsJoined = printedProps.join(', '), useNewLines = (!isArray || options.newLineInArrays) && (!options.minLengthForNewLine || printedPropsJoined.length >= options.minLengthForNewLine), ind = indent('', options.indent || '  ', depth), propIndent = indent('', options.indent || '  ', depth + 1), startBreak = useNewLines && !isArray ? '\n' + propIndent : '', eachBreak = useNewLines ? '\n' + propIndent : '', endBreak = useNewLines && !isArray ? '\n' + ind : '';
            if (useNewLines)
                printedPropsJoined = printedProps.join(',' + eachBreak);
            return openBr + startBreak + printedPropsJoined + endBreak + closeBr;
        },
        merge: function (objs) {
            if (arguments.length > 1) {
                return obj.merge(Array.prototype.slice.call(arguments));
            }
            if (Array.isArray(objs[0])) {
                return Array.prototype.concat.apply([], objs);
            }
            return objs.reduce(function (merged, ea) {
                for (var name in ea)
                    if (ea.hasOwnProperty(name))
                        merged[name] = ea[name];
                return merged;
            }, {});
        },
        deepMerge: function (objA, objB) {
            if (!objA)
                return objB;
            if (!objB)
                return objA;
            if (Array.isArray(objA)) {
                if (!Array.isArray(objB))
                    return objB;
                var merged = objA.map(function (ea, i) {
                    return obj.deepMerge(ea, objB[i]);
                });
                if (objB.length > objA.length)
                    merged = merged.concat(objB.slice(objA.length));
                return merged;
            }
            if (typeof objA !== 'object' || typeof objB !== 'object')
                return objB;
            return Object.keys(objA).concat(Object.keys(objB)).reduce(function (merged, name) {
                if (!objA[name])
                    merged[name] = objB[name];
                else if (!objB[name])
                    merged[name] = objA[name];
                else if (typeof objA[name] !== 'object' || typeof objB[name] !== 'object')
                    merged[name] = objB[name];
                else
                    merged[name] = obj.deepMerge(objA[name], objB[name]);
                return merged;
            }, {});
        },
        inherit: function (obj) {
            return Object.create(obj);
        },
        valuesInPropertyHierarchy: function (obj, name) {
            var result = [], lookupObj = obj;
            while (lookupObj) {
                if (lookupObj.hasOwnProperty(name))
                    result.unshift(lookupObj[name]);
                lookupObj = Object.getPrototypeOf(lookupObj);
            }
            return result;
        },
        mergePropertyInHierarchy: function (obj, propName) {
            return this.merge(this.valuesInPropertyHierarchy(obj, propName));
        },
        deepCopy: function (object) {
            if (!object || typeof object !== 'object' || object instanceof RegExp)
                return object;
            var result = Array.isArray(object) ? Array(object.length) : {};
            for (var key in object) {
                if (object.hasOwnProperty(key))
                    result[key] = obj.deepCopy(object[key]);
            }
            return result;
        },
        typeStringOf: function (obj) {
            if (obj === null)
                return 'null';
            if (typeof obj === 'undefined')
                return 'undefined';
            return obj.constructor.name;
        },
        shortPrintStringOf: function (obj) {
            if (!this.isMutableType(obj))
                return this.safeToString(obj);
            if (obj.constructor.name !== 'Object' && !Array.isArray(obj)) {
                if (obj.constructor.name)
                    return obj.constructor.name ? obj.constructor.name : Object.prototype.toString.call(obj).split(' ')[1].split(']')[0];
            }
            var typeString = '';
            function displayTypeAndLength(obj, collectionType, firstBracket, secondBracket) {
                if (obj.constructor.name === collectionType) {
                    typeString += firstBracket;
                    if (obj.length || Object.keys(obj).length)
                        typeString += '...';
                    typeString += secondBracket;
                }
            }
            displayTypeAndLength(obj, 'Object', '{', '}');
            displayTypeAndLength(obj, 'Array', '[', ']');
            return typeString;
        },
        isMutableType: function (obj) {
            var immutableTypes = [
                'null',
                'undefined',
                'Boolean',
                'Number',
                'String'
            ];
            return immutableTypes.indexOf(this.typeStringOf(obj)) === -1;
        },
        safeToString: function (obj) {
            try {
                return (obj ? obj.toString() : String(obj)).replace('\n', '');
            } catch (e) {
                return '<error printing object>';
            }
        },
        asObject: function (obj) {
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
    var properties = exports.properties = {
        all: function (object, predicate) {
            var a = [];
            for (var name in object) {
                if ((object.__lookupGetter__(name) || typeof object[name] !== 'function') && (predicate ? predicate(name, object) : true))
                    a.push(name);
            }
            return a;
        },
        allOwnPropertiesOrFunctions: function (obj, predicate) {
            return Object.getOwnPropertyNames(obj).reduce(function (result, name) {
                if (predicate ? predicate(obj, name) : true)
                    result.push(name);
                return result;
            }, []);
        },
        own: function (object) {
            var a = [];
            for (var name in object) {
                if (object.hasOwnProperty(name) && (object.__lookupGetter__(name) || object[name] !== 'function'))
                    a.push(name);
            }
            return a;
        },
        forEachOwn: function (object, func, context) {
            var result = [];
            for (var name in object) {
                if (!object.hasOwnProperty(name))
                    continue;
                var value = object[name];
                if (value !== 'function') {
                    result.push(func.call(context || this, name, value));
                }
            }
            return result;
        },
        nameFor: function (object, value) {
            for (var name in object) {
                if (object[name] === value)
                    return name;
            }
            return undefined;
        },
        values: function (obj) {
            var values = [];
            for (var name in obj)
                values.push(obj[name]);
            return values;
        },
        ownValues: function (obj) {
            var values = [];
            for (var name in obj) {
                if (obj.hasOwnProperty(name))
                    values.push(obj[name]);
            }
            return values;
        },
        any: function (obj, predicate) {
            for (var name in obj) {
                if (predicate(obj, name))
                    return true;
            }
            return false;
        },
        allProperties: function (obj, predicate) {
            var result = [];
            for (var name in obj) {
                if (predicate ? predicate(obj, name) : true)
                    result.push(name);
            }
            return result;
        },
        hash: function (obj) {
            return Object.keys(obj).sort().join('').hashCode();
        }
    };
    var Path = exports.Path = function Path(p, splitter) {
        if (p instanceof Path)
            return p;
        if (!(this instanceof Path))
            return new Path(p, splitter);
        if (splitter)
            this.setSplitter(splitter);
        return this.fromPath(p);
    };
    obj.extend(Path, {
        superclass: Object,
        type: 'Path',
        categories: {}
    });
    obj.extend(Path.prototype, {
        isPathAccessor: true,
        splitter: '.',
        fromPath: function (path) {
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
        setSplitter: function (splitter) {
            if (splitter)
                this.splitter = splitter;
            return this;
        },
        parts: function () {
            return this._parts;
        },
        size: function () {
            return this._parts.length;
        },
        slice: function (n, m) {
            return Path(this.parts().slice(n, m));
        },
        normalizePath: function () {
            return this._path;
        },
        isRoot: function (obj) {
            return this._parts.length === 0;
        },
        isIn: function (obj) {
            if (this.isRoot())
                return true;
            var parent = this.get(obj, -1);
            return parent && parent.hasOwnProperty(this._parts[this._parts.length - 1]);
        },
        equals: function (obj) {
            return obj && obj.isPathAccessor && this.parts().equals(obj.parts());
        },
        isParentPathOf: function (otherPath) {
            otherPath = otherPath && otherPath.isPathAccessor ? otherPath : Path(otherPath);
            var parts = this.parts(), otherParts = otherPath.parts();
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] != otherParts[i])
                    return false;
            }
            return true;
        },
        relativePathTo: function (otherPath) {
            otherPath = Path(otherPath);
            return this.isParentPathOf(otherPath) ? otherPath.slice(this.size(), otherPath.size()) : undefined;
        },
        del: function (obj) {
            if (this.isRoot())
                return false;
            var parent = obj;
            for (var i = 0; i < this._parts.length - 1; i++) {
                var part = this._parts[i];
                if (parent.hasOwnProperty(part)) {
                    parent = parent[part];
                } else
                    return false;
            }
            return delete parent[this._parts[this._parts.length - 1]];
        },
        withParentAndKeyDo: function (obj, ensure, doFunc) {
            if (this.isRoot())
                return doFunc(null, null);
            var parent = obj;
            for (var i = 0; i < this._parts.length - 1; i++) {
                var part = this._parts[i];
                if (parent.hasOwnProperty(part) && (typeof parent[part] === 'object' || typeof parent[part] === 'function')) {
                    parent = parent[part];
                } else if (ensure) {
                    parent = parent[part] = {};
                } else {
                    return doFunc(null, part);
                }
            }
            return doFunc(parent, this._parts[this._parts.length - 1]);
        },
        set: function (obj, val, ensure) {
            return this.withParentAndKeyDo(obj, ensure, function (parent, key) {
                return parent ? parent[key] = val : undefined;
            });
        },
        defineProperty: function (obj, propertySpec, ensure) {
            return this.withParentAndKeyDo(obj, ensure, function (parent, key) {
                return parent ? Object.defineProperty(parent, key, propertySpec) : undefined;
            });
        },
        get: function (obj, n) {
            var parts = n ? this._parts.slice(0, n) : this._parts;
            return parts.reduce(function (current, pathPart) {
                return current ? current[pathPart] : current;
            }, obj);
        },
        concat: function (p, splitter) {
            return Path(this.parts().concat(Path(p, splitter).parts()));
        },
        toString: function () {
            return this.normalizePath();
        },
        serializeExpr: function () {
            return 'Path(' + Objects.inspect(this.parts()) + ')';
        },
        watch: function (options) {
            if (!options || this.isRoot())
                return;
            var target = options.target, parent = this.get(target, -1), propName = this.parts().slice(-1)[0], newPropName = 'propertyWatcher$' + propName, watcherIsInstalled = parent && parent.hasOwnProperty(newPropName), uninstall = options.uninstall, haltWhenChanged = options.haltWhenChanged, showStack = options.showStack, getter = parent.__lookupGetter__(propName), setter = parent.__lookupSetter__(propName);
            if (!target || !propName || !parent)
                return;
            if (uninstall) {
                if (!watcherIsInstalled)
                    return;
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
                if (typeof show === 'undefined')
                    show(msg);
                return;
            }
            parent[newPropName] = parent[propName];
            parent.__defineSetter__(propName, function (v) {
                var oldValue = parent[newPropName];
                if (options.onSet)
                    options.onSet(v, oldValue);
                var msg = parent + '.' + propName + ' changed: ' + oldValue + ' -> ' + v;
                if (showStack)
                    msg += '\n' + (typeof lively !== 'undefined' ? lively.printStack() : console.trace());
                if (options.verbose) {
                    console.log(msg);
                    if (typeof show !== 'undefined')
                        show(msg);
                }
                if (haltWhenChanged)
                    debugger;
                return parent[newPropName] = v;
            });
            parent.__defineGetter__(propName, function () {
                if (options.onGet)
                    options.onGet(parent[newPropName]);
                return parent[newPropName];
            });
            var msg = 'Watcher for ' + parent + '.' + propName + ' installed';
            console.log(msg);
            if (typeof show !== 'undefined')
                show(msg);
        },
        debugFunctionWrapper: function (options) {
            var target = options.target, parent = this.get(target, -1), funcName = this.parts().slice(-1)[0], uninstall = options.uninstall, haltWhenChanged = options.haltWhenChanged === undefined ? true : options.haltWhenChanged, showStack = options.showStack, func = parent && funcName && parent[funcName], debuggerInstalled = func && func.isDebugFunctionWrapper;
            if (!target || !funcName || !func || !parent)
                return;
            if (uninstall) {
                if (!debuggerInstalled)
                    return;
                parent[funcName] = parent[funcName].debugTargetFunction;
                var msg = 'Uninstalled debugFunctionWrapper for ' + parent + '.' + funcName;
                console.log(msg);
                if (typeof show !== 'undefined')
                    show(msg);
                show(msg);
                return;
            }
            if (debuggerInstalled) {
                var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' already installed';
                console.log(msg);
                if (typeof show !== 'undefined')
                    show(msg);
                return;
            }
            var debugFunc = parent[funcName] = func.wrap(function (proceed) {
                var args = Array.from(arguments);
                if (haltWhenChanged)
                    debugger;
                if (showStack)
                    show(lively.printStack());
                if (options.verbose)
                    show(funcName + ' called');
                return args.shift().apply(parent, args);
            });
            debugFunc.isDebugFunctionWrapper = true;
            debugFunc.debugTargetFunction = func;
            var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' installed';
            console.log(msg);
            if (typeof show !== 'undefined')
                show(msg);
        }
    });
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    var Global = typeof window !== 'undefined' ? window : global;
    var classHelper = exports.classHelper = {
        anonymousCounter: 0,
        defaultCategoryName: 'default category',
        initializerTemplate: typeof lively !== 'undefined' && lively.Config && lively.Config.loadRewrittenCode ? function CLASS() {
            classHelper.initializer.apply(this, arguments);
        }.toStringRewritten().replace(/__0/g, 'Global').replace(/__1/g, '__1') : function CLASS() {
            classHelper.initializer.apply(this, arguments);
        }.toString(),
        newInitializer: function (name) {
            var src = classHelper.initializerTemplate.replace(/function\s*(CLASS)?\(\)/, 'function ' + name + '()');
            if (typeof lively !== 'undefined' && lively.Config && lively.Config.loadRewrittenCode) {
                var idx = src.match('.*storeFrameInfo([^)]*, ([0-9]+))')[2];
                src = '__createClosure("core/lively/Base.js", ' + idx + ', Global, ' + src + ');';
            } else
                src += ' ' + name;
            var initializer = eval(src);
            initializer.displayName = name;
            return initializer;
        },
        initializer: function initializer() {
            var firstArg = arguments[0];
            if (firstArg && firstArg.isInstanceRestorer) {
            } else {
                this.initialize.apply(this, arguments);
            }
        },
        isValidIdentifier: function () {
            var tester = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/;
            return function (string) {
                return tester.test(string);
            };
        }(),
        isClass: function (object) {
            if (object === Object || object === Array || object === Function || object === String || object === Boolean || object === Date || object === RegExp || object === Number) {
                return true;
            }
            return object instanceof Function && object.superclass !== undefined;
        },
        className: function (cl) {
            if (cl === Object)
                return 'Object';
            if (cl === Array)
                return 'Array';
            if (cl === Function)
                return 'Function';
            if (cl === String)
                return 'String';
            if (cl === Boolean)
                return 'Boolean';
            if (cl === Date)
                return 'Date';
            if (cl === RegExp)
                return 'RegExp';
            if (cl === Number)
                return 'Number';
            return cl.type;
        },
        forName: function forName(name) {
            var ns = classHelper.namespaceFor(name), shortName = classHelper.unqualifiedNameFor(name);
            return ns[shortName];
        },
        deleteObjectNamed: function (name) {
            var ns = classHelper.namespaceFor(name), shortName = classHelper.unqualifiedNameFor(name);
            delete ns[shortName];
        },
        unqualifiedNameFor: function (name) {
            var lastDot = name.lastIndexOf('.'), unqualifiedName = name.substring(lastDot + 1);
            if (!classHelper.isValidIdentifier(unqualifiedName))
                throw new Error('not a name ' + unqualifiedName);
            return unqualifiedName;
        },
        namespaceFor: function (className) {
            var lastDot = className ? className.lastIndexOf('.') : -1;
            if (lastDot < 0)
                return Global;
            var nsName = className.slice(0, lastDot);
            if (typeof lively !== 'undefined' && lively.module)
                return lively.module(nsName);
            var path = exports.Path(nsName), ns = path.get(Global);
            return ns || path.set(Global, {}, true);
        },
        withAllClassNames: function (scope, callback) {
            for (var name in scope) {
                try {
                    if (classHelper.isClass(scope[name]))
                        callback(name);
                } catch (er) {
                }
            }
            callback('Object');
            callback('Global');
        },
        getConstructor: function (object) {
            var c = object.constructor;
            return c && c.getOriginal ? c.getOriginal() : c;
        },
        getPrototype: function (object) {
            return this.getConstructor(object).prototype;
        },
        applyPrototypeMethod: function (methodName, target, args) {
            var method = this.getPrototype(target);
            if (!method)
                throw new Error('method ' + methodName + ' not found');
            return method.apply(this, args);
        },
        getSuperConstructor: function (object) {
            return this.getConstructor(object).superclass;
        },
        getSuperPrototype: function (object) {
            var sup = this.getSuperConstructor(object);
            return sup && sup.prototype;
        },
        addPins: function (cls, spec) {
            if (Global.Relay) {
                classHelper.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
                return;
            }
            if (!Object.isArray(spec))
                throw new Error('Cannot deal with non-Array spec in addPins');
            function unstripName(name) {
                return name.replace(/[\+|\-]?(.*)/, '$1');
            }
            ;
            function needsSetter(name) {
                return !exports.string.startsWith(name, '-');
            }
            ;
            function needsGetter(name) {
                return !exports.string.startsWith(name, '+');
            }
            ;
            var mixinSpec = {};
            spec.forEach(function (specString) {
                var name = unstripName(specString);
                if (needsSetter(specString))
                    mixinSpec['set' + name] = function (value) {
                        return this['_' + name] = value;
                    };
                if (needsGetter(specString))
                    mixinSpec['get' + name] = function () {
                        return this['_' + name];
                    };
            });
            classHelper.addMixin(cls, mixinSpec);
        },
        addMixin: function (cls, source) {
            var spec = {};
            for (var prop in source) {
                var value = source[prop];
                switch (prop) {
                case 'constructor':
                case 'initialize':
                case 'deserialize':
                case 'copyFrom':
                case 'toString':
                case 'definition':
                case 'description':
                    break;
                default:
                    if (cls.prototype[prop] === undefined)
                        spec[prop] = value;
                }
            }
            cls.addMethods(spec);
        }
    };
    exports.klass = exports.class = {
        create: function () {
            var args = exports.arr.from(arguments), superclass = args.shift(), className, targetScope = Global, shortName = null;
            if (!superclass || typeof superclass === 'string') {
                className = superclass;
                superclass = Object;
            } else
                className = args.shift();
            if (className) {
                targetScope = classHelper.namespaceFor(className);
                shortName = classHelper.unqualifiedNameFor(className);
            } else {
                shortName = 'anonymous_' + classHelper.anonymousCounter++;
                className = shortName;
            }
            var klass;
            if (className && targetScope[shortName] && targetScope[shortName].superclass === superclass) {
                klass = targetScope[shortName];
            } else {
                klass = classHelper.newInitializer(shortName);
                klass.superclass = superclass;
                var protoclass = function () {
                };
                protoclass.prototype = superclass.prototype;
                klass.prototype = new protoclass();
                klass.prototype.constructor = klass;
                klass.type = className;
                klass.displayName = className;
                if (className)
                    targetScope[shortName] = klass;
                if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
                    klass.sourceModule = lively.Module.current();
                klass.toString = function () {
                    var initCategory = exports.arr.detect(Object.keys(klass.categories || {}), function (category) {
                        return klass.categories[category].indexOf('initialize') > -1;
                    }) || 'default category';
                    return exports.string.format('lively.lang.class.create(%s, "%s",\n"%s", {\n  initialize: %s\n}/*...*/)', klass.superclass.type || klass.superclass.name, klass.type, initCategory, klass.prototype.initialize);
                };
            }
            ;
            exports.klass.addMethods.apply(Global, [klass].concat(args));
            if (!klass.prototype.initialize)
                klass.prototype.initialize = function () {
                };
            return klass;
        },
        addMethods: function () {
            var klass = arguments[0], args = arguments, category = classHelper.defaultCategoryName, traits = [];
            for (var i = 1; i < args.length; i++) {
                if (typeof args[i] === 'string') {
                    category = args[i];
                } else if (Global.RealTrait && args[i] instanceof RealTrait) {
                    traits.push(args[i]);
                } else {
                    exports.klass.addCategorizedMethods(klass, category, args[i] instanceof Function ? args[i]() : args[i]);
                }
            }
            for (i = 0; i < traits.length; i++)
                traits[i].applyTo(klass);
            return klass;
        },
        addCategorizedMethods: function (klass, categoryName, source) {
            if (!klass.categories)
                klass.categories = {};
            if (!klass.categories[categoryName])
                klass.categories[categoryName] = [];
            var currentCategoryNames = klass.categories[categoryName];
            if (!source)
                throw dbgOn(new Error('no source in addCategorizedMethods!'));
            var ancestor = klass.superclass && klass.superclass.prototype;
            var className = klass.type || 'Anonymous';
            for (var property in source) {
                if (property === 'constructor')
                    continue;
                var getter = source.__lookupGetter__(property);
                if (getter)
                    klass.prototype.__defineGetter__(property, getter);
                var setter = source.__lookupSetter__(property);
                if (setter)
                    klass.prototype.__defineSetter__(property, setter);
                if (getter || setter)
                    continue;
                currentCategoryNames.push(property);
                var value = source[property];
                var hasSuperCall = ancestor && typeof value === 'function' && exports.fun.argumentNames(value)[0] == '$super';
                if (hasSuperCall) {
                    (function () {
                        var method = value;
                        var advice = function (m) {
                            var cs = function callSuper() {
                                var method = ancestor[m];
                                if (!method) {
                                    throw new Error(exports.string.format('Trying to call super of' + '%s>>%s but super method non existing in %s', className, m, ancestor.constructor.type));
                                }
                                return method.apply(this, arguments);
                            };
                            cs.varMapping = {
                                ancestor: ancestor,
                                m: m
                            };
                            cs.isSuperCall = true;
                            return cs;
                        }(property);
                        advice.methodName = '$super:' + (klass.superclass ? klass.superclass.type + '>>' : '') + property;
                        value = exports.obj.extend(exports.fun.wrap(advice, method), {
                            valueOf: function () {
                                return method;
                            },
                            toString: function () {
                                return method.toString();
                            },
                            originalFunction: method,
                            methodName: advice.methodName,
                            isSuperWrapper: true
                        });
                        method.varMapping = { $super: advice };
                    }());
                }
                klass.prototype[property] = value;
                if (property === 'formals') {
                    classHelper.addPins(klass, value);
                } else if (typeof value === 'function') {
                    value.displayName = className + '$' + property;
                    if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
                        value.sourceModule = lively.Module.current();
                    for (; value; value = value.originalFunction) {
                        value.declaredClass = klass.prototype.constructor.type;
                        value.methodName = property;
                    }
                }
            }
            return klass;
        },
        addProperties: function (klass, spec, recordType) {
            classHelper.addMixin(klass, recordType.prototype.create(spec).prototype);
        },
        isSubclassOf: function (klassA, klassB) {
            return exports.klass.superclasses(klassA).indexOf(klassB) > -1;
        },
        superclasses: function (klass) {
            if (!klass.superclass)
                return [];
            if (klass.superclass === Object)
                return [Object];
            return exports.klass.superclasses(klass.superclass).concat([klass.superclass]);
        },
        categoryNameFor: function (klass, propName) {
            for (var categoryName in klass.categories) {
                if (klass.categories[categoryName].indexOf(propName) > -1)
                    return categoryName;
            }
            return null;
        },
        remove: function (klass) {
            var ownerNamespace = classHelper.namespaceFor(klass.type), ownName = classHelper.unqualifiedNameFor(klass.type);
            delete ownerNamespace[ownName];
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var features = {
        from: !!Array.from,
        filter: !!Array.prototype.filter,
        find: !!Array.prototype.find,
        findIndex: !!Array.prototype.findIndex,
        includes: !!Array.prototype.includes
    };
    var arr = exports.arr = {
        range: function (begin, end, step) {
            step = step || 1;
            var result = [];
            for (var i = begin; i <= end; i += step)
                result.push(i);
            return result;
        },
        from: features.from ? Array.from : function (iterable) {
            if (!iterable)
                return [];
            if (Array.isArray(iterable))
                return iterable;
            if (iterable.toArray)
                return iterable.toArray();
            var length = iterable.length, results = new Array(length);
            while (length--)
                results[length] = iterable[length];
            return results;
        },
        withN: function (n, obj) {
            var result = new Array(n);
            while (n > 0)
                result[--n] = obj;
            return result;
        },
        genN: function (n, generator) {
            var result = new Array(n);
            while (n > 0)
                result[--n] = generator(n);
            return result;
        },
        filter: function (array, iterator, context) {
            return array.filter(iterator, context);
        },
        detect: features.find ? function (arr, iterator, context) {
            return arr.find(iterator, context);
        } : function (arr, iterator, context) {
            for (var value, i = 0, len = arr.length; i < len; i++) {
                value = arr[i];
                if (iterator.call(context, value, i))
                    return value;
            }
            return undefined;
        },
        findIndex: features.findIndex ? function (arr, iterator, context) {
            return arr.findIndex(iterator, context);
        } : function (arr, iterator, context) {
            var i = -1;
            return arr.find(function (ea, j) {
                i = j;
                return iterator.call(ea, context);
            }) ? i : -1;
        },
        filterByKey: function (arr, key) {
            return arr.filter(function (ea) {
                return !!ea[key];
            });
        },
        grep: function (arr, filter, context) {
            if (typeof filter === 'string')
                filter = new RegExp(filter, 'i');
            return arr.filter(filter.test.bind(filter));
        },
        mask: function (array, mask) {
            return array.filter(function (_, i) {
                return !!mask[i];
            });
        },
        reject: function (array, func, context) {
            function iterator(val, i) {
                return !func.call(context, val, i);
            }
            return array.filter(iterator);
        },
        rejectByKey: function (array, key) {
            return array.filter(function (ea) {
                return !ea[key];
            });
        },
        without: function (array, elem) {
            return array.filter(function (value) {
                return value !== elem;
            });
        },
        withoutAll: function (array, otherArr) {
            return array.filter(function (value) {
                return otherArr.indexOf(value) === -1;
            });
        },
        uniq: function (array, sorted) {
            return array.reduce(function (a, value, index) {
                if (0 === index || (sorted ? a.last() != value : a.indexOf(value) === -1))
                    a.push(value);
                return a;
            }, []);
        },
        uniqBy: function (array, comparator, context) {
            var result = arr.clone(array);
            for (var i = 0; i < result.length; i++) {
                var item = array[i];
                for (var j = i + 1; j < result.length; j++) {
                    if (comparator.call(context, item, result[j])) {
                        arr.removeAt(result, j);
                        j--;
                    }
                }
            }
            return result;
        },
        compact: function (array) {
            return array.filter(function (ea) {
                return !!ea;
            });
        },
        mutableCompact: function (array) {
            var i = 0, j = 0, len = array.length;
            while (i < len) {
                if (array.hasOwnProperty(i))
                    array[j++] = array[i];
                i++;
            }
            while (j++ < len)
                array.pop();
            return array;
        },
        forEach: function (array, iterator, context) {
            return array.forEach(iterator, context);
        },
        zip: function () {
            var args = Array.from(arguments), array = args.shift(), iterator = typeof arr.last(args) === 'function' ? args.pop() : function (x) {
                    return x;
                }, collections = [array].concat(args).map(function (ea) {
                    return Array.from(ea);
                });
            return array.map(function (value, index) {
                return iterator(arr.pluck(collections, index), index);
            });
        },
        flatten: function flatten(array, optDepth) {
            if (typeof optDepth === 'number') {
                if (optDepth <= 0)
                    return array;
                optDepth--;
            }
            return array.reduce(function (flattened, value) {
                return flattened.concat(Array.isArray(value) ? flatten(value, optDepth) : [value]);
            }, []);
        },
        flatmap: function (array, it, ctx) {
            var results = [];
            for (var i = 0; i < array.length; i++) {
                results.push.apply(results, it.call(ctx, array[i], i));
            }
            return results;
        },
        interpose: function (array, delim) {
            return array.reduce(function (xs, x) {
                if (xs.length > 0)
                    xs.push(delim);
                xs.push(x);
                return xs;
            }, []);
        },
        delimWith: function (array, delim) {
            return arr.interpose(array, delim);
        },
        map: function (array, iterator, context) {
            return array.map(iterator, context);
        },
        invoke: function (array, method, arg1, arg2, arg3, arg4, arg5, arg6) {
            return array.map(function (ea) {
                return ea[method](arg1, arg2, arg3, arg4, arg5, arg6);
            });
        },
        pluck: function (array, property) {
            return array.map(function (ea) {
                return ea[property];
            });
        },
        reduce: function (array, iterator, memo, context) {
            return array.reduce(iterator, memo, context);
        },
        reduceRight: function (array, iterator, memo, context) {
            return array.reduceRight(iterator, memo, context);
        },
        isArray: Array.isArray,
        include: features.includes ? function (array, object) {
            return array.includes(object);
        } : function (array, object) {
            return array.indexOf(object) !== -1;
        },
        some: function (array, iterator, context) {
            return array.some(iterator, context);
        },
        every: function (array, iterator, context) {
            return array.every(iterator, context);
        },
        equals: function (array, otherArray) {
            var len = array.length;
            if (!otherArray || len !== otherArray.length)
                return false;
            for (var i = 0; i < len; i++) {
                if (array[i] && otherArray[i] && array[i].equals && otherArray[i].equals) {
                    if (!array[i].equals(otherArray[i])) {
                        return false;
                    } else {
                        continue;
                    }
                }
                if (array[i] != otherArray[i])
                    return false;
            }
            return true;
        },
        deepEquals: function (array, otherArray) {
            var len = array.length;
            if (!otherArray || len !== otherArray.length)
                return false;
            for (var i = 0; i < len; i++) {
                if (!exports.obj.equals(array[i], otherArray[i]))
                    return false;
            }
            return true;
        },
        isSorted: function (array, descending) {
            var isSorted = true;
            for (var i = 1; i < array.length; i++) {
                if (!descending && arr[i - 1] > arr[i])
                    return false;
                else if (descending && arr[i - 1] < arr[i])
                    return false;
            }
        },
        sort: function (array, sortFunc) {
            return array.sort(sortFunc);
        },
        sortBy: function (array, iterator, context) {
            return arr.pluck(array.map(function (value, index) {
                return {
                    value: value,
                    criteria: iterator.call(context, value, index)
                };
            }).sort(function (left, right) {
                var a = left.criteria, b = right.criteria;
                return a < b ? -1 : a > b ? 1 : 0;
            }), 'value');
        },
        sortByKey: function (array, key) {
            return arr.sortBy(array, function (ea) {
                return ea[key];
            });
        },
        reverse: function (array) {
            return array.reverse();
        },
        reversed: function (array) {
            return arr.clone(array).reverse();
        },
        reMatches: function (arr, re, stringifier) {
            stringifier = stringifier || String;
            return arr.map(function (ea) {
                return stringifier(ea).match(re);
            });
        },
        first: function (array) {
            return array[0];
        },
        last: function (array) {
            return array[array.length - 1];
        },
        intersect: function (array1, array2) {
            return arr.uniq(array1).filter(function (item) {
                return array2.indexOf(item) > -1;
            });
        },
        union: function (array1, array2) {
            var result = arr.clone(array1);
            for (var i = 0; i < array2.length; i++) {
                var item = array2[i];
                if (result.indexOf(item) === -1)
                    result.push(item);
            }
            return result;
        },
        pushAt: function (array, item, index) {
            array.splice(index, 0, item);
        },
        removeAt: function (array, index) {
            array.splice(index, 1);
        },
        remove: function (array, item) {
            var index = array.indexOf(item);
            if (index >= 0)
                arr.removeAt(array, index);
            return item;
        },
        pushAll: function (array, items) {
            array.push.apply(array, items);
            return array;
        },
        pushAllAt: function (array, items, idx) {
            array.splice.apply(array, [
                idx,
                0
            ].concat(items));
        },
        pushIfNotIncluded: function (array, item) {
            if (!array.includes(item))
                array.push(item);
        },
        replaceAt: function (array, item, index) {
            array.splice(index, 1, item);
        },
        clear: function (array) {
            array.length = 0;
            return array;
        },
        doAndContinue: function (array, iterator, endFunc, context) {
            endFunc = endFunc || Functions.Null;
            context = context || (typeof window !== 'undefined' ? window : global);
            iterator = iterator || function (next, ea, idx) {
                ea.call(context, next, idx);
            };
            return array.reduceRight(function (nextFunc, ea, idx) {
                return function () {
                    iterator.call(context, nextFunc, ea, idx);
                };
            }, endFunc)();
        },
        nestedDelay: function (array, iterator, waitSecs, endFunc, context, optSynchronChunks) {
            endFunc = endFunc || function () {
            };
            return array.clone().reverse().reduce(function (nextFunc, ea, idx) {
                return function () {
                    iterator.call(context || (typeof window !== 'undefined' ? window : global), ea, idx);
                    if (optSynchronChunks && idx % optSynchronChunks !== 0) {
                        nextFunc();
                    } else {
                        nextFunc.delay(waitSecs);
                    }
                };
            }, endFunc)();
        },
        forEachShowingProgress: function () {
            var args = Array.from(arguments), array = args.shift(), steps = array.length, progressBar, iterator, labelFunc, whenDoneFunc, context, progressBarAdded = false;
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
            if (!context)
                context = typeof window !== 'undefined' ? window : global;
            if (!labelFunc)
                labelFunc = function (x) {
                    return x;
                };
            if (!progressBar) {
                progressBarAdded = true;
                var Global = typeof window !== 'undefined' ? window : global;
                var world = Global.lively && lively.morphic && lively.morphic.World.current();
                progressBar = world ? world.addProgressBar() : {
                    setValue: function (val) {
                    },
                    setLabel: function () {
                    },
                    remove: function () {
                    }
                };
            }
            progressBar.setValue(0);
            array.reduceRight(function (nextFunc, item, idx) {
                return function () {
                    try {
                        progressBar.setValue(idx / steps);
                        if (labelFunc)
                            progressBar.setLabel(labelFunc.call(context, item, idx));
                        iterator.call(context, item, idx);
                    } catch (e) {
                        console.error('Error in forEachShowingProgress at %s (%s)\n%s\n%s', idx, item, e, e.stack);
                    }
                    nextFunc.delay(0);
                };
            }, function () {
                progressBar.setValue(1);
                if (progressBarAdded)
                    (function () {
                        progressBar.remove();
                    }.delay(0));
                if (whenDoneFunc)
                    whenDoneFunc.call(context);
            })();
            return array;
        },
        swap: function (array, index1, index2) {
            if (index1 < 0)
                index1 = array.length + index1;
            if (index2 < 0)
                index2 = array.length + index2;
            var temp = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
            return array;
        },
        rotate: function (array, times) {
            times = times || 1;
            return array.slice(times).concat(array.slice(0, times));
        },
        groupBy: function (array, iterator, context) {
            return Group.fromArray(array, iterator, context);
        },
        groupByKey: function (array, key) {
            return arr.groupBy(array, function (ea) {
                return ea[key];
            });
        },
        partition: function (array, iterator, context) {
            iterator = iterator || function (x) {
                return x;
            };
            var trues = [], falses = [];
            array.forEach(function (value, index) {
                (iterator.call(context, value, index) ? trues : falses).push(value);
            });
            return [
                trues,
                falses
            ];
        },
        batchify: function (array, constrainedFunc, context) {
            return findBatches([], array);
            function extractBatch(batch, sizes) {
                if (!sizes.length)
                    return [
                        batch,
                        []
                    ];
                var first = sizes[0], rest = sizes.slice(1);
                var candidate = batch.concat([first]);
                if (constrainedFunc.call(context, candidate))
                    return extractBatch(candidate, rest);
                var batchAndSizes = extractBatch(batch, rest);
                return [
                    batchAndSizes[0],
                    [first].concat(batchAndSizes[1])
                ];
            }
            function findBatches(batches, sizes) {
                if (!sizes.length)
                    return batches;
                var extracted = extractBatch([], sizes);
                if (!extracted[0].length)
                    throw new Error('Batchify constrained does not ensure consumption ' + 'of at least one item per batch!');
                return findBatches(batches.concat([extracted[0]]), extracted[1]);
            }
        },
        toTuples: function (array, tupleLength) {
            tupleLength = tupleLength || 1;
            return arr.range(0, Math.ceil(array.length / tupleLength) - 1).map(function (n) {
                return array.slice(n * tupleLength, n * tupleLength + tupleLength);
            }, array);
        },
        permutations: function () {
            function computePermutations(restArray, values) {
                return !restArray.length ? [values] : arr.flatmap(restArray, function (ea, i) {
                    return computePermutations(restArray.slice(0, i).concat(restArray.slice(i + 1)), values.concat([ea]));
                });
            }
            return function (array) {
                return computePermutations(array, []);
            };
        }(),
        combinationsPick: function (listOfListsOfValues, pickIndices) {
            var values = listOfListsOfValues.map(function (subspace, i) {
                    return subspace[pickIndices[i]];
                }), nextState = pickIndices.slice();
            for (var i = listOfListsOfValues.length; i--; i >= 0) {
                var subspace = listOfListsOfValues[i], nextIndex = nextState[i] + 1;
                if (subspace[nextIndex]) {
                    nextState[i] = nextIndex;
                    break;
                } else if (i === 0) {
                    nextState = undefined;
                    break;
                } else {
                    nextState[i] = 0;
                }
            }
            return [
                values,
                nextState
            ];
        },
        combinations: function (listOfListsOfValues) {
            var size = listOfListsOfValues.reduce(function (prod, space) {
                    return prod * space.length;
                }, 1), searchState = listOfListsOfValues.map(function (_) {
                    return 0;
                }), results = new Array(size);
            for (var i = 0; i < size; i++) {
                var result = arr.combinationsPick(listOfListsOfValues, searchState);
                results[i] = result[0];
                searchState = result[1];
            }
            return results;
        },
        take: function (arr, n) {
            return arr.slice(0, n);
        },
        drop: function (arr, n) {
            return arr.slice(n);
        },
        takeWhile: function (arr, fun, context) {
            var i = 0;
            ;
            for (; i < arr.length; i++)
                if (!fun.call(context, arr[i], i))
                    break;
            return arr.slice(0, i);
        },
        dropWhile: function (arr, fun, context) {
            var i = 0;
            ;
            for (; i < arr.length; i++)
                if (!fun.call(context, arr[i], i))
                    break;
            return arr.slice(i);
        },
        shuffle: function (array) {
            var unusedIndexes = arr.range(0, array.length - 1);
            return array.reduce(function (shuffled, ea, i) {
                var shuffledIndex = unusedIndexes.splice(Math.round(Math.random() * (unusedIndexes.length - 1)), 1);
                shuffled[shuffledIndex] = ea;
                return shuffled;
            }, Array(array.length));
        },
        max: function (array, iterator, context) {
            iterator = iterator || function (x) {
                return x;
            };
            var result;
            array.reduce(function (max, ea, i) {
                var val = iterator.call(context, ea, i);
                if (typeof val !== 'number' || val <= max)
                    return max;
                result = ea;
                return val;
            }, -Infinity);
            return result;
        },
        min: function (array, iterator, context) {
            iterator = iterator || function (x) {
                return x;
            };
            return arr.max(array, function (ea, i) {
                return -iterator.call(context, ea, i);
            });
        },
        sum: function (array) {
            var sum = 0;
            for (var i = 0; i < array.length; i++)
                sum += array[i];
            return sum;
        },
        count: function (array, item) {
            return array.reduce(function (count, ea) {
                return ea === item ? count + 1 : count;
            }, 0);
        },
        size: function (array) {
            return array.length;
        },
        histogram: function (data, binSpec) {
            if (typeof binSpec === 'undefined' || typeof binSpec === 'number') {
                var binNumber = binSpec || function sturge() {
                    return Math.ceil(Math.log(data.length) / Math.log(2) + 1);
                }(data);
                var binSize = Math.ceil(Math.round(data.length / binNumber));
                return arr.range(0, binNumber - 1).map(function (i) {
                    return data.slice(i * binSize, (i + 1) * binSize);
                });
            } else if (binSpec instanceof Array) {
                var thresholds = binSpec;
                return data.reduce(function (bins, d) {
                    if (d < thresholds[1]) {
                        bins[0].push(d);
                        return bins;
                    }
                    for (var i = 1; i < thresholds.length; i++) {
                        if (d >= thresholds[i] && (!thresholds[i + 1] || d <= thresholds[i + 1])) {
                            bins[i].push(d);
                            return bins;
                        }
                    }
                    throw new Error(Strings.format('Histogram creation: Cannot group data %s into thresholds %o', d, thresholds));
                }, arr.range(1, thresholds.length).map(function () {
                    return [];
                }));
            }
        },
        clone: function (array) {
            return [].concat(array);
        },
        toArray: function (array) {
            return arr.from(array);
        },
        each: function (arr, iterator, context) {
            return arr.forEach(iterator, context);
        },
        all: function (arr, iterator, context) {
            return arr.every(iterator, context);
        },
        any: function (arr, iterator, context) {
            return arr.some(iterator, context);
        },
        collect: function (arr, iterator, context) {
            return arr.map(iterator, context);
        },
        findAll: function (arr, iterator, context) {
            return arr.filter(iterator, context);
        },
        inject: function (array, memo, iterator, context) {
            if (context)
                iterator = iterator.bind(context);
            return array.reduce(iterator, memo);
        },
        mapAsyncSeries: function (array, iterator, callback) {
            var result = [], callbackTriggered = false;
            return array.reduceRight(function (nextFunc, ea, idx) {
                if (callbackTriggered)
                    return;
                return function (err, eaResult) {
                    if (err)
                        return maybeDone(err);
                    if (idx > 0)
                        result.push(eaResult);
                    try {
                        iterator(ea, idx, exports.fun.once(nextFunc));
                    } catch (e) {
                        maybeDone(e);
                    }
                };
            }, function (err, eaResult) {
                result.push(eaResult);
                maybeDone(err, true);
            })();
            function maybeDone(err, finalCall) {
                if (callbackTriggered || !err && !finalCall)
                    return;
                callbackTriggered = true;
                try {
                    callback(err, result);
                } catch (e) {
                    console.error('Error in mapAsyncSeries - callback invocation error:\n' + (e.stack || e));
                }
            }
        },
        mapAsync: function (array, options, iterator, callback) {
            if (typeof options === 'function') {
                callback = iterator;
                iterator = options;
                options = null;
            }
            options = options || {};
            if (!array.length)
                return callback && callback(null, []);
            if (!options.parallel)
                options.parallel = Infinity;
            var results = [], completed = [], callbackTriggered = false, lastIteratorIndex = 0, nActive = 0;
            var iterators = array.map(function (item, i) {
                return function () {
                    nActive++;
                    try {
                        iterator(item, i, exports.fun.once(function (err, result) {
                            results[i] = err || result;
                            maybeDone(i, err);
                        }));
                    } catch (e) {
                        maybeDone(i, e);
                    }
                };
            });
            return activate();
            function activate() {
                while (nActive < options.parallel && lastIteratorIndex < array.length)
                    iterators[lastIteratorIndex++]();
            }
            function maybeDone(idx, err) {
                if (completed.indexOf(idx) > -1)
                    return;
                completed.push(idx);
                nActive--;
                if (callbackTriggered)
                    return;
                if (!err && completed.length < array.length) {
                    activate();
                    return;
                }
                callbackTriggered = true;
                try {
                    callback && callback(err, results);
                } catch (e) {
                    console.error('Error in mapAsync - main callback invocation error:\n' + (e.stack || e));
                }
            }
        }
    };
    if (!features.from)
        Array.from = arr.from;
    if (!features.filter)
        Array.prototype.filter = function (it, ctx) {
            return arr.filter(this, it, ctx);
        };
    if (!features.find)
        Array.prototype.find = function (it, ctx) {
            return arr.find(this, it, ctx);
        };
    if (!features.findIndex)
        Array.prototype.findIndex = function (it, ctx) {
            return arr.findIndex(this, it, ctx);
        };
    if (!features.includes)
        Array.prototype.includes = function (x) {
            return arr.include(this, x);
        };
    var Group = exports.Group = function Group() {
    };
    Group.by = exports.arr.groupBy;
    Group.fromArray = function (array, hashFunc, context) {
        var grouping = new Group();
        for (var i = 0, len = array.length; i < len; i++) {
            var hash = hashFunc.call(context, array[i], i);
            if (!grouping[hash])
                grouping[hash] = [];
            grouping[hash].push(array[i]);
        }
        return grouping;
    };
    Group.prototype.toArray = function () {
        return this.reduceGroups(function (all, _, group) {
            return all.concat([group]);
        }, []);
    };
    Group.prototype.forEach = function (iterator, context) {
        var groups = this;
        Object.keys(groups).forEach(function (groupName) {
            groups[groupName].forEach(iterator.bind(context, groupName));
        });
        return groups;
    };
    Group.prototype.forEachGroup = function (iterator, context) {
        var groups = this;
        Object.keys(groups).forEach(function (groupName) {
            iterator.call(context, groupName, groups[groupName]);
        });
        return groups;
    };
    Group.prototype.map = function (iterator, context) {
        var result = new Group();
        this.forEachGroup(function (groupName, group) {
            result[groupName] = group.map(iterator.bind(context, groupName));
        });
        return result;
    };
    Group.prototype.mapGroups = function (iterator, context) {
        var result = new Group();
        this.forEachGroup(function (groupName, group) {
            result[groupName] = iterator.call(context, groupName, group);
        });
        return result;
    };
    Group.prototype.keys = function () {
        return Object.keys(this);
    };
    Group.prototype.reduceGroups = function (iterator, carryOver, context) {
        this.forEachGroup(function (groupName, group) {
            carryOver = iterator.call(context, carryOver, groupName, group);
        });
        return carryOver;
    };
    Group.prototype.count = function () {
        return this.reduceGroups(function (groupCount, groupName, group) {
            groupCount[groupName] = group.length;
            return groupCount;
        }, {});
    };
    var grid = exports.grid = {
        get: function (grid, nRow, nCol) {
            var row = grid[nRow];
            return row ? row[nCol] : undefined;
        },
        set: function (grid, nRow, nCol, obj) {
            var row = grid[nRow];
            if (row)
                row[nCol] = obj;
            return obj;
        },
        getRow: function (grid, nRow) {
            return grid[nRow];
        },
        setRow: function (grid, nRow, newRow) {
            return grid[nRow] = newRow;
        },
        getCol: function (grid, nCol) {
            return grid.reduce(function (col, row) {
                col.push(row[nCol]);
                return col;
            }, []);
        },
        setCol: function (grid, nCol, newCol) {
            return grid.map(function (row, i) {
                return row[nCol] ? row[nCol] = newCol[i] : undefined;
            });
        },
        create: function (rows, columns, initialObj) {
            var result = new Array(rows);
            while (rows > 0)
                result[--rows] = arr.withN(columns, initialObj);
            return result;
        },
        mapCreate: function (rows, cols, func, context) {
            var result = new Array(rows);
            for (var i = 0; i < rows; i++) {
                result[i] = new Array(cols);
                for (var j = 0; j < cols; j++) {
                    result[i][j] = func.call(context || this, i, j);
                }
            }
            return result;
        },
        forEach: function (grid, func, context) {
            grid.forEach(function (row, i) {
                row.forEach(function (val, j) {
                    func.call(context || this, val, i, j);
                });
            });
        },
        map: function (grid, func, context) {
            var result = new Array(grid.length);
            grid.forEach(function (row, i) {
                result[i] = new Array(row.length);
                row.forEach(function (val, j) {
                    result[i][j] = func.call(context || this, val, i, j);
                });
            });
            return result;
        },
        toObjects: function (grid) {
            var props = grid[0], objects = new Array(grid.length - 1);
            for (var i = 1; i < grid.length; i++) {
                var obj = objects[i - 1] = {};
                for (var j = 0; j < props.length; j++)
                    obj[props[j]] = grid[i][j];
            }
            return objects;
        },
        tableFromObjects: function (objects, valueForUndefined) {
            if (!Array.isArray(objects))
                objects = [objects];
            var table = [[]], columns = table[0], rows = objects.reduce(function (rows, ea) {
                    return rows.concat([Object.keys(ea).reduce(function (row, col) {
                            var colIdx = columns.indexOf(col);
                            if (colIdx === -1) {
                                colIdx = columns.length;
                                columns.push(col);
                            }
                            row[colIdx] = ea[col];
                            return row;
                        }, [])]);
                }, []);
            valueForUndefined = arguments.length === 1 ? null : valueForUndefined;
            rows.forEach(function (row) {
                for (var i = 0; i < columns.length; i++)
                    if (!row[i])
                        row[i] = valueForUndefined;
            });
            return table.concat(rows);
        },
        benchmark: function () {
            var results = [], t;
            var g = grid.create(1000, 200, 1), addNum = 0;
            t = lively.lang.fun.timeToRunN(function () {
                grid.forEach(g, function (n) {
                    addNum += n;
                });
            }, 10);
            results.push(exports.string.format('grid.forEach: %ims', t));
            var mapResult;
            t = Functions.timeToRunN(function () {
                mapResult = grid.map(grid, function (n, i, j) {
                    return i + j + Math.round(Math.random() * 100);
                });
            }, 10);
            results.push(exports.string.format('grid.map: %ims', t));
            var mapResult2 = grid.create(1000, 2000);
            t = Functions.timeToRunN(function () {
                mapResult2 = new Array(1000);
                for (var i = 0; i < 1000; i++)
                    mapResult2[i] = new Array(2000);
                grid.forEach(g, function (n, i, j) {
                    mapResult2[i][j] = i + j + Math.round(Math.random() * 100);
                });
            }, 10);
            results.push('grid.map with forEach: ' + t + 'ms');
            results.push('--= 2012-09-22 =--\n' + 'grid.forEach: 14.9ms\n' + 'grid.map: 19.8ms\n' + 'grid.map with forEach: 38.7ms\n');
            return results.join('\n');
        }
    };
    var interval = exports.interval = {
        isInterval: function (object) {
            return Array.isArray(object) && object.length >= 2 && object[0] <= object[1];
        },
        sort: function (intervals) {
            return intervals.sort(interval.compare);
        },
        compare: function (a, b) {
            if (a[0] < b[0]) {
                if (a[1] < b[0])
                    return -3;
                if (a[1] === b[0])
                    return -2;
                return -1;
            }
            if (a[0] === b[0]) {
                if (a[1] === b[1])
                    return 0;
                return a[1] < b[1] ? -1 : 1;
            }
            return -1 * interval.compare(b, a);
        },
        coalesce: function (interval1, interval2, optMergeCallback) {
            var cmpResult = this.compare(interval1, interval2);
            switch (cmpResult) {
            case -3:
            case 3:
                return null;
            case 0:
                optMergeCallback && optMergeCallback(interval1, interval2, interval1);
                return interval1;
            case 2:
            case 1:
                var temp = interval1;
                interval1 = interval2;
                interval2 = temp;
            case -2:
            case -1:
                var coalesced = [
                    interval1[0],
                    Math.max(interval1[1], interval2[1])
                ];
                optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
                return coalesced;
            default:
                throw new Error('Interval compare failed');
            }
        },
        coalesceOverlapping: function (intervals, mergeFunc) {
            var condensed = [], len = intervals.length;
            while (len > 0) {
                var ival = intervals.shift();
                len--;
                for (var i = 0; i < len; i++) {
                    var otherInterval = intervals[i], coalesced = interval.coalesce(ival, otherInterval, mergeFunc);
                    if (coalesced) {
                        ival = coalesced;
                        intervals.splice(i, 1);
                        len--;
                        i--;
                    }
                }
                condensed.push(ival);
            }
            return this.sort(condensed);
        },
        mergeOverlapping: function (intervalsA, intervalsB, mergeFunc) {
            var result = [];
            while (intervalsA.length > 0) {
                var intervalA = intervalsA.shift();
                var toMerge = intervalsB.map(function (intervalB) {
                    var cmp = interval.compare(intervalA, intervalB);
                    return cmp === -1 || cmp === 0 || cmp === 1;
                });
                result.push(mergeFunc(intervalA, toMerge[0]));
                result.push(intervalA);
            }
            return result;
        },
        intervalsInRangeDo: function (start, end, intervals, iterator, mergeFunc, context) {
            context = context || (typeof window !== 'undefined' ? window : global);
            intervals = this.sort(intervals);
            var free = [], nextInterval, collected = [];
            while (nextInterval = intervals.shift()) {
                if (nextInterval[1] < start)
                    continue;
                if (nextInterval[0] < start) {
                    nextInterval = Array.prototype.slice.call(nextInterval);
                    nextInterval[0] = start;
                }
                ;
                var nextStart = end < nextInterval[0] ? end : nextInterval[0];
                if (start < nextStart) {
                    collected.push(iterator.call(context, [
                        start,
                        nextStart
                    ], true));
                }
                ;
                if (end < nextInterval[1]) {
                    nextInterval = Array.prototype.slice.call(nextInterval);
                    nextInterval[1] = end;
                }
                if (nextInterval[0] === nextInterval[1]) {
                    var prevInterval;
                    if (mergeFunc && (prevInterval = collected.slice(-1)[0])) {
                        mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
                    }
                } else {
                    collected.push(iterator.call(context, nextInterval, false));
                }
                start = nextInterval[1];
                if (start >= end)
                    break;
            }
            if (start < end)
                collected.push(iterator.call(context, [
                    start,
                    end
                ], true));
            return collected;
        },
        intervalsInbetween: function (start, end, intervals) {
            return interval.intervalsInRangeDo(start, end, interval.coalesceOverlapping(Array.prototype.slice.call(intervals)), function (interval, isNew) {
                return isNew ? interval : null;
            }).filter(function (ea) {
                return !!ea;
            });
        },
        mapToMatchingIndexes: function (intervals, intervalsToFind) {
            var startIntervalIndex = 0, endIntervalIndex, currentInterval;
            return intervalsToFind.map(function (toFind) {
                while (currentInterval = intervals[startIntervalIndex]) {
                    if (currentInterval[0] < toFind[0]) {
                        startIntervalIndex++;
                        continue;
                    }
                    ;
                    break;
                }
                if (currentInterval && currentInterval[0] === toFind[0]) {
                    endIntervalIndex = startIntervalIndex;
                    while (currentInterval = intervals[endIntervalIndex]) {
                        if (currentInterval[1] < toFind[1]) {
                            endIntervalIndex++;
                            continue;
                        }
                        ;
                        break;
                    }
                    if (currentInterval && currentInterval[1] === toFind[1]) {
                        return arr.range(startIntervalIndex, endIntervalIndex);
                    }
                }
                return [];
            });
        },
        benchmark: function () {
            function benchmarkFunc(name, args, n) {
                return Strings.format('%s: %sms', name, Functions.timeToRunN(function () {
                    interval[name].apply(interval, args, 100000);
                }, n));
            }
            return [
                'Friday, 20. July 2012:',
                'coalesceOverlapping: 0.0003ms',
                'intervalsInbetween: 0.002ms',
                'mapToMatchingIndexes: 0.02ms',
                'vs.\n' + new Date() + ':',
                benchmarkFunc('coalesceOverlapping', [[
                        [
                            9,
                            10
                        ],
                        [
                            1,
                            8
                        ],
                        [
                            3,
                            7
                        ],
                        [
                            15,
                            20
                        ],
                        [
                            14,
                            21
                        ]
                    ]], 100000),
                benchmarkFunc('intervalsInbetween', [
                    0,
                    10,
                    [
                        [
                            8,
                            10
                        ],
                        [
                            0,
                            2
                        ],
                        [
                            3,
                            5
                        ]
                    ]
                ], 100000),
                benchmarkFunc('mapToMatchingIndexes', [
                    Array.range(0, 1000).collect(function (n) {
                        return [
                            n,
                            n + 1
                        ];
                    }),
                    [
                        [
                            4,
                            8
                        ],
                        [
                            500,
                            504
                        ],
                        [
                            900,
                            1004
                        ]
                    ]
                ], 1000)
            ].join('\n');
        }
    };
    var arrayProjection = exports.arrayProjection = {
        create: function (array, length, optStartIndex) {
            var startIndex = optStartIndex || 0;
            if (startIndex + length > array.length)
                startIndex -= startIndex + length - array.length;
            return {
                array: array,
                from: startIndex,
                to: startIndex + length
            };
        },
        toArray: function (projection) {
            return projection.array.slice(projection.from, projection.to);
        },
        originalToProjectedIndex: function (projection, index) {
            if (index < projection.from || index >= projection.to)
                return null;
            return index - projection.from;
        },
        projectedToOriginalIndex: function (projection, index) {
            if (index < 0 || index > projection.to - projection.from)
                return null;
            return projection.from + index;
        },
        transformToIncludeIndex: function (projection, index) {
            if (!(index in projection.array))
                return null;
            var delta = 0;
            if (index < projection.from)
                delta = -projection.from + index;
            if (index >= projection.to)
                delta = index - projection.to + 1;
            if (delta === 0)
                return projection;
            return arrayProjection.create(projection.array, projection.to - projection.from, projection.from + delta);
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var seq = exports.seq = {
        take: function (gen, n) {
            var it = gen(), vals = [];
            for (var i = 0; i < n; i++) {
                var step = it.next();
                if (step.done)
                    break;
                vals.push(step.value);
            }
            return vals;
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var tree = exports.tree = {
        prewalk: function (treeNode, iterator, childGetter) {
            iterator(treeNode);
            (childGetter(treeNode) || []).forEach(function (ea) {
                tree.prewalk(ea, iterator, childGetter);
            });
        },
        postwalk: function (treeNode, iterator, childGetter) {
            (childGetter(treeNode) || []).forEach(function (ea) {
                tree.postwalk(ea, iterator, childGetter);
            });
            iterator(treeNode);
        },
        detect: function (treeNode, testFunc, childGetter) {
            if (testFunc(treeNode))
                return treeNode;
            var found;
            exports.arr.detect(childGetter(treeNode) || [], function (ea) {
                return found = tree.detect(ea, testFunc, childGetter);
            });
            return found;
        },
        filter: function (treeNode, testFunc, childGetter) {
            var result = [];
            if (testFunc(treeNode))
                result.push(treeNode);
            return result.concat(exports.arr.flatten((childGetter(treeNode) || []).map(function (n) {
                return tree.filter(n, testFunc, childGetter);
            })));
        },
        map: function (treeNode, mapFunc, childGetter) {
            var result = [mapFunc(treeNode)];
            return result.concat(exports.arr.flatten((childGetter(treeNode) || []).map(function (n) {
                return tree.map(n, mapFunc, childGetter);
            })));
        },
        mapTree: function (treeNode, mapFunc, childGetter) {
            var mappedNodes = (childGetter(treeNode) || []).map(function (n) {
                return tree.mapTree(n, mapFunc, childGetter);
            });
            return mapFunc(treeNode, mappedNodes);
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var fun = exports.fun = {
        get Empty() {
            return function () {
            };
        },
        get K() {
            return function (arg) {
                return arg;
            };
        },
        get Null() {
            return function () {
                return null;
            };
        },
        get False() {
            return function () {
                return false;
            };
        },
        get True() {
            return function () {
                return true;
            };
        },
        get notYetImplemented() {
            return function () {
                throw new Error('Not yet implemented');
            };
        },
        all: function (object) {
            var a = [];
            for (var name in object) {
                if (!object.__lookupGetter__(name) && typeof object[name] === 'function')
                    a.push(name);
            }
            return a;
        },
        own: function (object) {
            var a = [];
            for (var name in object) {
                if (!object.__lookupGetter__(name) && object.hasOwnProperty(name) && typeof object[name] === 'function')
                    a.push(name);
            }
            return a;
        },
        argumentNames: function (f) {
            if (f.superclass)
                return [];
            var src = f.toString(), names = '', arrowMatch = src.match(/(?:\(([^\)]*)\)|([^\(\)-+!]+))\s*=>/);
            if (arrowMatch)
                names = arrowMatch[1] || arrowMatch[2] || '';
            else {
                var headerMatch = src.match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
                if (headerMatch && headerMatch[1])
                    names = headerMatch[1];
            }
            return names.replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').replace(/\s+/g, '').split(',').map(function (ea) {
                return ea.trim();
            }).filter(function (name) {
                return !!name;
            });
        },
        qualifiedMethodName: function (f) {
            var objString = '';
            if (f.declaredClass) {
                objString += f.declaredClass + '>>';
            } else if (f.declaredObject) {
                objString += f.declaredObject + '.';
            }
            return objString + (f.methodName || f.displayName || f.name || 'anonymous');
        },
        extractBody: function (func) {
            var codeString = String(func).replace(/^function[^\{]+\{\s*/, '').replace(/\}$/, '').trim(), lines = codeString.split(/\n|\r/), indent = undefined;
            for (var i = 0; i < lines.length; i++) {
                var m = lines[i].match(/^(\s+)[^\s]/);
                if (m && (indent === undefined || m[1].length < indent.length))
                    indent = m[1];
            }
            return indent ? codeString.replace(new RegExp('^' + indent, 'gm'), '') : codeString;
        },
        timeToRun: function (func) {
            var startTime = Date.now();
            func();
            return Date.now() - startTime;
        },
        timeToRunN: function (func, n) {
            var startTime = Date.now();
            for (var i = 0; i < n; i++)
                func();
            return (Date.now() - startTime) / n;
        },
        delay: function (func, timeout) {
            var args = Array.prototype.slice.call(arguments), __method = args.shift(), timeout = args.shift() * 1000;
            return setTimeout(function delayed() {
                return __method.apply(__method, args);
            }, timeout);
        },
        throttle: function (func, wait) {
            var context, args, timeout, throttling, more, result, whenDone = fun.debounce(wait, function () {
                    more = throttling = false;
                });
            return function () {
                context = this;
                args = arguments;
                var later = function () {
                    timeout = null;
                    if (more)
                        func.apply(context, args);
                    whenDone();
                };
                if (!timeout)
                    timeout = setTimeout(later, wait);
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
        debounce: function (wait, func, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate)
                        func.apply(context, args);
                };
                if (immediate && !timeout)
                    func.apply(context, args);
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        throttleNamed: function (name, wait, func) {
            var store = fun._throttledByName || (fun._throttledByName = {});
            if (store[name])
                return store[name];
            function throttleNamedWrapper() {
                fun.debounceNamed(name, wait, function () {
                    delete store[name];
                })();
                func.apply(this, arguments);
            }
            return store[name] = fun.throttle(throttleNamedWrapper, wait);
        },
        debounceNamed: function (name, wait, func, immediate) {
            var store = fun._debouncedByName || (fun._debouncedByName = {});
            if (store[name])
                return store[name];
            function debounceNamedWrapper() {
                delete store[name];
                func.apply(this, arguments);
            }
            return store[name] = fun.debounce(wait, debounceNamedWrapper, immediate);
        },
        createQueue: function (id, workerFunc) {
            var store = fun._queues || (fun._queues = {});
            var queue = store[id] || (store[id] = {
                _workerActive: false,
                worker: workerFunc,
                tasks: [],
                drain: null,
                push: function (task) {
                    queue.tasks.push(task);
                    queue.activateWorker();
                },
                pushAll: function (tasks) {
                    tasks.forEach(function (ea) {
                        queue.tasks.push(ea);
                    });
                    queue.activateWorker();
                },
                pushNoActivate: function (task) {
                    queue.tasks.push(task);
                },
                handleError: function (err) {
                    err && console.error('Error in queue: ' + err);
                },
                activateWorker: function () {
                    function callback(err) {
                        queue.handleError(err);
                        queue.activateWorker();
                    }
                    var tasks = queue.tasks, active = queue._workerActive;
                    if (tasks.length === 0) {
                        if (active) {
                            queue._workerActive = false;
                            if (typeof queue.drain === 'function')
                                queue.drain();
                        }
                        delete store[id];
                    } else {
                        if (!active)
                            queue._workerActive = true;
                        try {
                            queue.worker(tasks.shift(), callback);
                        } catch (err) {
                            callback(err);
                        }
                    }
                }
            });
            return queue;
        },
        workerWithCallbackQueue: function (id, workerFunc, optTimeout) {
            var store = fun._queueUntilCallbacks || (fun._queueUntilCallbacks = {}), queueCallbacks = store[id], isRunning = !!queueCallbacks;
            if (isRunning)
                return queueCallbacks;
            var callbacksRun = false, canceled = false;
            function cleanup() {
                if (timeoutProc)
                    clearTimeout(timeoutProc);
                callbacksRun = true;
                delete store[id];
            }
            function runCallbacks(args) {
                if (callbacksRun)
                    return;
                cleanup();
                queueCallbacks.callbacks.forEach(function (cb) {
                    try {
                        cb.apply(null, args);
                    } catch (e) {
                        console.error('Error when invoking callbacks in queueUntil [' + id + ']:\n' + String(e.stack || e));
                    }
                });
            }
            if (optTimeout) {
                var timeoutProc = setTimeout(function () {
                    if (callbacksRun)
                        return;
                    runCallbacks([new Error('timeout')]);
                }, optTimeout);
            }
            queueCallbacks = store[id] = {
                callbacks: [],
                cancel: function () {
                    canceled = true;
                    cleanup();
                },
                whenDone: function (cb) {
                    queueCallbacks.callbacks.push(cb);
                    return queueCallbacks;
                }
            };
            setTimeout(function () {
                if (canceled)
                    return;
                try {
                    workerFunc(function () {
                        runCallbacks(arguments);
                    });
                } catch (e) {
                    runCallbacks([e]);
                }
            }, 0);
            return queueCallbacks;
        },
        _composeAsyncDefaultEndCallback: function _composeAsyncDefaultEndCallback(err, arg1) {
            if (err)
                console.error('lively.lang.fun.composeAsync error', err);
        },
        composeAsync: function () {
            var toArray = Array.prototype.slice, functions = toArray.call(arguments), defaultEndCb = fun._composeAsyncDefaultEndCallback, endCallback = defaultEndCb, endSuccess, endFailure, endPromise = new Promise(function (resolve, reject) {
                    endSuccess = resolve;
                    endFailure = reject;
                });
            return functions.reverse().reduce(function (prevFunc, funcOrPromise, i) {
                var nextActivated = false;
                return function () {
                    var args = toArray.call(arguments);
                    if (endCallback === defaultEndCb && i === functions.length - 1) {
                        while (args.length && typeof args[args.length - 1] !== 'function')
                            args.pop();
                        if (typeof args[args.length - 1] === 'function')
                            endCallback = args.pop();
                    }
                    function next() {
                        nextActivated = true;
                        var args = toArray.call(arguments), err = args.shift();
                        if (err) {
                            endCallback(err);
                            endFailure(err);
                        } else
                            prevFunc.apply(null, args);
                    }
                    if (typeof funcOrPromise === 'function') {
                        try {
                            var result = funcOrPromise.apply(this, args.concat([next]));
                            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                                result.then(function (value) {
                                    return next(null, value);
                                }).catch(function (err) {
                                    return next(err);
                                });
                            }
                        } catch (e) {
                            console.error('composeAsync: ', e.stack || e);
                            if (!nextActivated) {
                                endCallback(e);
                                endFailure(e);
                            }
                        }
                    } else if (funcOrPromise && typeof funcOrPromise.then === 'function' && typeof funcOrPromise.catch === 'function') {
                        funcOrPromise.then(function (value) {
                            next(null, value);
                        }).catch(function (err) {
                            next(err);
                        });
                    } else {
                        var err = new Error('Invalid argument to composeAsync: ' + funcOrPromise);
                        endCallback(err);
                        endFailure(err);
                    }
                    return endPromise;
                };
            }, function () {
                var args = toArray.call(arguments);
                endCallback.apply(null, [null].concat(args));
                endSuccess(args[0]);
            });
        },
        compose: function () {
            var functions = Array.prototype.slice.call(arguments);
            return functions.reverse().reduce(function (prevFunc, func) {
                return function () {
                    return prevFunc(func.apply(this, arguments));
                };
            }, function (x) {
                return x;
            });
        },
        flip: function (f) {
            return function flipped() {
                var args = Array.prototype.slice.call(arguments), flippedArgs = [
                        args[1],
                        args[0]
                    ].concat(args.slice(2));
                return f.apply(null, flippedArgs);
            };
        },
        withNull: function (func) {
            func = func || function () {
            };
            return function () {
                var args = lively.lang.arr.from(arguments);
                func.apply(null, [null].concat(args));
            };
        },
        waitFor: function (timeoutMs, waitTesterFunc, thenDo) {
            var start = Date.now();
            var timeStep = 50;
            if (!thenDo) {
                thenDo = waitTesterFunc;
                waitTesterFunc = timeoutMs;
                timeoutMs = undefined;
            }
            (function test() {
                if (waitTesterFunc())
                    return thenDo();
                if (timeoutMs) {
                    var duration = Date.now() - start, timeLeft = timeoutMs - duration;
                    if (timeLeft <= 0)
                        return thenDo(new Error('timeout'));
                    if (timeLeft < timeStep)
                        timeStep = timeLeft;
                }
                setTimeout(test, timeStep);
            }());
        },
        waitForAll: function (options, funcs, thenDo) {
            if (!thenDo) {
                thenDo = funcs;
                funcs = options;
                options = null;
            }
            options = options || {};
            var results = funcs.map(function () {
                return null;
            });
            if (!funcs.length) {
                thenDo(null, results);
                return;
            }
            var leftFuncs = Array.prototype.slice.call(funcs);
            funcs.forEach(function (f, i) {
                try {
                    f(function () {
                        var args = Array.prototype.slice.call(arguments);
                        var err = args.shift();
                        markAsDone(f, i, err, args);
                    });
                } catch (e) {
                    markAsDone(f, i, e, null);
                }
            });
            if (options.timeout) {
                setTimeout(function () {
                    if (!leftFuncs.length)
                        return;
                    var missing = results.map(function (ea, i) {
                        return ea === null && i;
                    }).filter(function (ea) {
                        return typeof ea === 'number';
                    }).join(', ');
                    var err = new Error('waitForAll timed out, functions at ' + missing + ' not done');
                    markAsDone(null, null, err, null);
                }, options.timeout);
            }
            function markAsDone(f, i, err, result) {
                if (!leftFuncs.length)
                    return;
                var waitForAllErr = null;
                var fidx = leftFuncs.indexOf(f);
                fidx > -1 && leftFuncs.splice(fidx, 1);
                if (err) {
                    leftFuncs.length = 0;
                    waitForAllErr = new Error('in waitForAll at' + (typeof i === 'number' ? ' ' + i : '') + ': \n' + (err.stack || String(err)));
                } else if (result)
                    results[i] = result;
                if (!leftFuncs.length)
                    setTimeout(function () {
                        thenDo(waitForAllErr, results);
                    }, 0);
            }
        },
        curry: function (func, arg1, arg2, argN) {
            if (arguments.length <= 1)
                return arguments[0];
            var args = Array.prototype.slice.call(arguments), func = args.shift();
            function wrappedFunc() {
                return func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
            }
            wrappedFunc.isWrapper = true;
            wrappedFunc.originalFunction = func;
            return wrappedFunc;
        },
        wrap: function (func, wrapper) {
            var __method = func;
            var wrappedFunc = function wrapped() {
                var args = Array.prototype.slice.call(arguments);
                var wrapperArgs = wrapper.isWrapper ? args : [__method.bind(this)].concat(args);
                return wrapper.apply(this, wrapperArgs);
            };
            wrappedFunc.isWrapper = true;
            wrappedFunc.originalFunction = __method;
            return wrappedFunc;
        },
        getOriginal: function (func) {
            while (func.originalFunction)
                func = func.originalFunction;
            return func;
        },
        wrapperChain: function (method) {
            var result = [];
            do {
                result.push(method);
                method = method.originalFunction;
            } while (method);
            return result;
        },
        replaceMethodForOneCall: function (obj, methodName, replacement) {
            replacement.originalFunction = obj[methodName];
            var reinstall = obj.hasOwnProperty(methodName);
            obj[methodName] = function () {
                if (reinstall)
                    obj[methodName] = replacement.originalFunction;
                else
                    delete obj[methodName];
                return replacement.apply(this, arguments);
            };
            return obj;
        },
        once: function (func) {
            if (!func)
                return undefined;
            if (typeof func !== 'function')
                throw new Error('fun.once() expecting a function');
            var invoked = false, result;
            return function () {
                if (invoked)
                    return result;
                invoked = true;
                return result = func.apply(this, arguments);
            };
        },
        either: function () {
            var funcs = Array.prototype.slice.call(arguments), wasCalled = false;
            return funcs.map(function (func) {
                return function () {
                    if (wasCalled)
                        return undefined;
                    wasCalled = true;
                    return func.apply(this, arguments);
                };
            });
        },
        eitherNamed: function (name, func) {
            var funcs = Array.prototype.slice.call(arguments);
            var registry = fun._eitherNameRegistry || (fun._eitherNameRegistry = {});
            var name = funcs.shift();
            var eitherCall = registry[name] || (registry[name] = {
                wasCalled: false,
                callsLeft: 0
            });
            eitherCall.callsLeft++;
            return function () {
                eitherCall.callsLeft--;
                if (eitherCall.callsLeft <= 0)
                    delete registry[name];
                if (eitherCall.wasCalled)
                    return undefined;
                eitherCall.wasCalled = true;
                return func.apply(this, arguments);
            };
        },
        evalJS: function (src) {
            return eval(src);
        },
        fromString: function (funcOrString) {
            return fun.evalJS('(' + funcOrString.toString() + ');');
        },
        asScript: function (func, optVarMapping) {
            return Closure.fromFunction(func, optVarMapping).recreateFunc();
        },
        asScriptOf: function (f, obj, optName, optMapping) {
            var name = optName || f.name;
            if (!name) {
                throw Error('Function that wants to be a script needs a name: ' + this);
            }
            var proto = Object.getPrototypeOf(obj), mapping = { 'this': obj };
            if (optMapping)
                mapping = exports.obj.merge([
                    mapping,
                    optMapping
                ]);
            if (proto && proto[name]) {
                var superFunc = function () {
                    try {
                        return Object.getPrototypeOf(obj)[name].apply(obj, arguments);
                    } catch (e) {
                        if (typeof $world !== undefined)
                            $world.logError(e, 'Error in $super call');
                        else
                            alert('Error in $super call: ' + e + '\n' + e.stack);
                        return null;
                    }
                };
                mapping['$super'] = Closure.fromFunction(superFunc, {
                    'obj': obj,
                    name: name
                }).recreateFunc();
            }
            return fun.addToObject(fun.asScript(f, mapping), obj, name);
        },
        addToObject: function (f, obj, name) {
            f.displayName = name;
            var methodConnections = obj.attributeConnections ? obj.attributeConnections.filter(function (con) {
                return con.getSourceAttrName() === 'update';
            }) : [];
            if (methodConnections)
                methodConnections.forEach(function (ea) {
                    ea.disconnect();
                });
            obj[name] = f;
            if (typeof exports.obj)
                f.declaredObject = exports.obj.safeToString(obj);
            if (typeof lively !== 'undefined' && exports.obj && lively.Tracing && lively.Tracing.stackTracingEnabled) {
                lively.Tracing.instrumentMethod(obj, name, { declaredObject: exports.obj.safeToString(obj) });
            }
            if (methodConnections)
                methodConnections.forEach(function (ea) {
                    ea.connect();
                });
            return f;
        },
        binds: function (f, varMapping) {
            return Closure.fromFunction(f, varMapping || {}).recreateFunc();
        },
        setLocalVarValue: function (f, name, value) {
            if (f.hasLivelyClosure)
                f.livelyClosure.funcProperties[name] = value;
        },
        getVarMapping: function (f) {
            if (f.hasLivelyClosure)
                return f.livelyClosure.varMapping;
            if (f.isWrapper)
                return f.originalFunction.varMapping;
            if (f.varMapping)
                return f.varMapping;
            return {};
        },
        setProperty: function (func, name, value) {
            func[name] = value;
            if (func.hasLivelyClosure)
                func.livelyClosure.funcProperties[name] = value;
        },
        functionNames: function (klass) {
            var result = [], lookupObj = klass.prototype;
            while (lookupObj) {
                result = Object.keys(lookupObj).reduce(function (result, name) {
                    if (typeof lookupObj[name] === 'function' && result.indexOf(name) === -1)
                        result.push(name);
                    return result;
                }, result);
                lookupObj = Object.getPrototypeOf(lookupObj);
            }
            return result;
        },
        localFunctionNames: function (func) {
            return Object.keys(func.prototype).filter(function (name) {
                return typeof func.prototype[name] === 'function';
            });
        },
        logErrors: function (func, prefix) {
            var advice = function logErrorsAdvice(proceed) {
                var args = Array.prototype.slice.call(arguments);
                args.shift();
                try {
                    return proceed.apply(func, args);
                } catch (er) {
                    if (typeof lively !== 'undefined' && lively.morphic && lively.morphic.World && lively.morphic.World.current()) {
                        lively.morphic.World.current().logError(er);
                        throw er;
                    }
                    if (prefix)
                        console.warn('ERROR: %s.%s(%s): err: %s %s', func, prefix, args, er, er.stack || '');
                    else
                        console.warn('ERROR: %s %s', er, er.stack || '');
                    if (typeof logStack !== 'undefined')
                        logStack();
                    if (typeof printObject !== 'undefined')
                        console.warn('details: ' + printObject(er));
                    throw er;
                }
            };
            advice.methodName = '$logErrorsAdvice';
            var result = fun.wrap(func, advice);
            result.originalFunction = func;
            result.methodName = '$logErrorsWrapper';
            return result;
        },
        logCompletion: function (func, module) {
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
            };
            advice.methodName = '$logCompletionAdvice::' + module;
            var result = fun.wrap(func, advice);
            result.methodName = '$logCompletionWrapper::' + module;
            result.originalFunction = func;
            return result;
        },
        logCalls: function (func, isUrgent) {
            var original = func, advice = function logCallsAdvice(proceed) {
                    var args = Array.prototype.slice.call(arguments);
                    args.shift(), result = proceed.apply(func, args);
                    if (isUrgent) {
                        console.warn('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
                    } else {
                        console.log('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
                    }
                    return result;
                };
            advice.methodName = '$logCallsAdvice::' + fun.qualifiedMethodName(func);
            var result = fun.wrap(func, advice);
            result.originalFunction = func;
            result.methodName = '$logCallsWrapper::' + fun.qualifiedMethodName(func);
            return result;
        },
        traceCalls: function (func, stack) {
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
        webkitStack: function () {
            try {
                throw new Error();
            } catch (e) {
                return String(e.stack).split(/\n/).slice(2).map(function (line) {
                    return line.replace(/^\s*at\s*([^\s]+).*/, '$1');
                }).join('\n');
            }
        }
    };
    function Closure() {
        this.initialize.apply(this, arguments);
    }
    exports.Closure = Closure;
    exports.obj.extend(Closure, {
        superclass: Object,
        type: 'Closure',
        categories: {}
    });
    Closure.prototype.isLivelyClosure = true;
    Closure.prototype.doNotSerialize = ['originalFunc'];
    Closure.prototype.initialize = function (func, varMapping, source, funcProperties) {
        this.originalFunc = func;
        this.varMapping = varMapping || {};
        this.source = source;
        this.setFuncProperties(func || funcProperties);
    };
    Closure.prototype.setFuncSource = function (src) {
        this.source = src;
    };
    Closure.prototype.getFuncSource = function () {
        return this.source || String(this.originalFunc);
    };
    Closure.prototype.hasFuncSource = function () {
        return this.source && true;
    };
    Closure.prototype.getFunc = function () {
        return this.originalFunc || this.recreateFunc();
    };
    Closure.prototype.getFuncProperties = function () {
        if (!this.funcProperties)
            this.funcProperties = {};
        return this.funcProperties;
    };
    Closure.prototype.setFuncProperties = function (obj) {
        var props = this.getFuncProperties();
        for (var name in obj) {
            if (obj.hasOwnProperty(name) && name != '_cachedAst') {
                props[name] = obj[name];
            }
        }
    };
    Closure.prototype.lookup = function (name) {
        return this.varMapping[name];
    };
    Closure.prototype.parameterNames = function (methodString) {
        var parameterRegex = /function\s*\(([^\)]*)\)/, regexResult = parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1])
            return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0)
            return [];
        var parameters = parameterString.split(',').map(function (str) {
            return exports.string.removeSurroundingWhitespaces(str);
        }, this);
        return parameters;
    };
    Closure.prototype.firstParameter = function (src) {
        return this.parameterNames(src)[0] || null;
    };
    Closure.prototype.recreateFunc = function () {
        return this.recreateFuncFromSource(this.getFuncSource(), this.originalFunc);
    };
    Closure.prototype.recreateFuncFromSource = function (funcSource, optFunc) {
        var closureVars = [], thisFound = false, specificSuperHandling = this.firstParameter(funcSource) === '$super';
        for (var name in this.varMapping) {
            if (!this.varMapping.hasOwnProperty(name))
                continue;
            if (name == 'this') {
                thisFound = true;
                continue;
            }
            closureVars.push(name + '=this.varMapping["' + name + '"]');
        }
        var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
        if (specificSuperHandling)
            src += '(function superWrapperForClosure() { return ';
        src += '(' + funcSource + ')';
        if (specificSuperHandling)
            src += '.apply(this, [$super.bind(this)].concat(Array.from(arguments))) })';
        if (typeof lively !== 'undefined' && lively.Config && lively.Config.loadRewrittenCode) {
            module('lively.ast.Rewriting').load(true);
            var namespace = '[runtime]';
            if (optFunc && optFunc.sourceModule)
                namespace = new URL(optFunc.sourceModule.findUri()).relativePathFrom(URL.root);
            var fnAst = lively.ast.acorn.parse(src), rewrittenAst = lively.ast.Rewriting.rewrite(fnAst, lively.ast.Rewriting.getCurrentASTRegistry(), namespace), retVal = rewrittenAst.body[0].block.body.last();
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
                func._cachedAst.start++;
                func._cachedAst.end--;
            }
            return func;
        } catch (e) {
            var msg = 'Cannot create function ' + e + ' src: ' + src;
            console.error(msg);
            throw new Error(msg);
        }
    };
    Closure.prototype.addFuncProperties = function (func) {
        var props = this.getFuncProperties();
        for (var name in props) {
            if (props.hasOwnProperty(name))
                func[name] = props[name];
        }
        this.addClosureInformation(func);
    };
    Closure.prototype.couldNotCreateFunc = function (src) {
        var msg = 'Could not recreate closure from source: \n' + src;
        console.error(msg);
        return function () {
            throw new Error(msg);
        };
    };
    Closure.prototype.asFunction = function () {
        return this.recreateFunc();
    };
    Closure.prototype.addClosureInformation = function (f) {
        f.hasLivelyClosure = true;
        f.livelyClosure = this;
        return f;
    };
    Closure.fromFunction = function (func, varMapping) {
        return new Closure(func, varMapping || {});
    };
    Closure.fromSource = function (source, varMapping) {
        return new Closure(null, varMapping || {}, source);
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    var features = {
        repeat: !!String.prototype.repeat,
        includes: !!String.prototype.includes,
        startsWith: !!String.prototype.startsWith,
        endsWith: !!String.prototype.endsWith
    };
    var string = exports.string = {
        format: function strings$format() {
            return string.formatFromArray(Array.prototype.slice.call(arguments));
        },
        formatFromArray: function strings$formatFromArray(objects) {
            var self = objects.shift();
            if (!self) {
                console.log('Error in Strings>>formatFromArray, first arg is undefined');
            }
            ;
            function appendText(object, string) {
                return '' + object;
            }
            function appendInteger(value, string) {
                return value.toString();
            }
            function appendFloat(value, string, precision) {
                if (precision > -1)
                    return value.toFixed(precision);
                else
                    return value.toString();
            }
            function appendObject(value, string) {
                return exports.obj.inspect(value);
            }
            var appenderMap = {
                s: appendText,
                d: appendInteger,
                i: appendInteger,
                f: appendFloat,
                o: appendObject
            };
            var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;
            function parseFormat(fmt) {
                var oldFmt = fmt;
                var parts = [];
                for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
                    var type = m[8] || m[5], appender = type in appenderMap ? appenderMap[type] : appendObject, precision = m[3] ? parseInt(m[3]) : m[4] == '.' ? -1 : 0;
                    parts.push(fmt.substr(0, m[0][0] == '%' ? m.index : m.index + 1));
                    parts.push({
                        appender: appender,
                        precision: precision
                    });
                    fmt = fmt.substr(m.index + m[0].length);
                }
                if (fmt)
                    parts.push(fmt.toString());
                return parts;
            }
            ;
            var parts = parseFormat(self), str = '', objIndex = 0;
            for (var i = 0; i < parts.length; ++i) {
                var part = parts[i];
                if (part && typeof part == 'object') {
                    var object = objects[objIndex++];
                    str += (part.appender || appendText)(object, str, part.precision);
                } else {
                    str += appendText(part, str);
                }
            }
            return str;
        },
        indent: function (str, indentString, depth) {
            if (!depth || depth <= 0)
                return str;
            while (depth > 0) {
                depth--;
                str = indentString + str;
            }
            return str;
        },
        removeSurroundingWhitespaces: function (str) {
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
        quote: function (str) {
            return '"' + str.replace(/"/g, '\\"') + '"';
        },
        print: function print(obj) {
            if (obj && Array.isArray(obj))
                return '[' + obj.map(print) + ']';
            if (typeof obj !== 'string')
                return String(obj);
            var result = String(obj);
            result = result.replace(/\n/g, '\\n\\\n');
            result = result.replace(/(")/g, '\\$1');
            result = '"' + result + '"';
            return result;
        },
        printNested: function (list, depth) {
            depth = depth || 0;
            var s = '';
            list.forEach(function (ea) {
                if (ea instanceof Array) {
                    s += string.printNested(ea, depth + 1);
                } else {
                    s += string.indent(ea + '\n', '  ', depth);
                }
            });
            return s;
        },
        pad: function (string, n, left) {
            return left ? ' '.repeat(n) + string : string + ' '.repeat(n);
        },
        printTable: function (tableArray, options) {
            var columnWidths = [], separator = options && options.separator || ' ', alignLeftAll = !options || !options.align || options.align === 'left', alignRightAll = options && options.align === 'right';
            function alignRight(columnIndex) {
                if (alignLeftAll)
                    return false;
                if (alignRightAll)
                    return true;
                return options && Object.isArray(options.align) && options.align[columnIndex] === 'right';
            }
            tableArray.forEach(function (row) {
                row.forEach(function (cellVal, i) {
                    if (columnWidths[i] === undefined)
                        columnWidths[i] = 0;
                    columnWidths[i] = Math.max(columnWidths[i], String(cellVal).length);
                });
            });
            return tableArray.collect(function (row) {
                return row.collect(function (cellVal, i) {
                    var cellString = String(cellVal);
                    return string.pad(cellString, columnWidths[i] - cellString.length, alignRight(i));
                }).join(separator);
            }).join('\n');
        },
        printTree: function (rootNode, nodePrinter, childGetter, indent) {
            var nodeList = [];
            indent = indent || '  ';
            iterator(0, 0, rootNode);
            return nodeList.join('\n');
            function iterator(depth, index, node) {
                nodeList[index] = indent.repeat(depth) + nodePrinter(node, depth);
                var children = childGetter(node, depth), childIndex = index + 1;
                if (!children || !children.length)
                    return childIndex;
                var lastIndex = childIndex, lastI = children.length - 1;
                children.forEach(function (ea, i) {
                    childIndex = iterator(depth + 1, childIndex, ea);
                    var isLast = lastI === i, cs = nodeList[lastIndex].split(''), fromSlash = depth * indent.length + 1, toSlash = depth * indent.length + indent.length;
                    for (var i = fromSlash; i < toSlash; i++)
                        cs[i] = '-';
                    if (isLast)
                        cs[depth * indent.length] = '\\';
                    nodeList[lastIndex] = cs.join('');
                    if (!isLast)
                        nodeList.slice(lastIndex, childIndex).forEach(function (ea, i) {
                            var cs2 = ea.split('');
                            cs2[depth * indent.length] = '|';
                            nodeList[lastIndex + i] = cs2.join('');
                        });
                    lastIndex = childIndex;
                });
                return childIndex;
            }
        },
        toArray: function (s) {
            return s.split('');
        },
        lines: function (str) {
            return str.split(/\n\r?/);
        },
        paragraphs: function (string, options) {
            var sep = options ? options.sep : '\n\n';
            if (!options || !options.keepEmptyLines)
                return string.split(new RegExp(sep + '+'));
            function isWhiteSpace(s) {
                return /^\s*$/.test(s);
            }
            return string.split('\n').concat('').reduce(function (parasAndLast, line) {
                var paras = parasAndLast[0], last = parasAndLast[1];
                if (isWhiteSpace(last) === isWhiteSpace(line)) {
                    last += '\n' + line;
                } else {
                    last.length && paras.push(last);
                    last = line;
                }
                return [
                    paras,
                    last
                ];
            }, [
                [],
                ''
            ])[0];
        },
        nonEmptyLines: function (str) {
            return string.lines(str).compact();
        },
        tokens: function (str, regex) {
            return str.split(regex || /\s+/).filter(function (tok) {
                return !/^\s*$/.test(tok);
            });
        },
        tableize: function (s, options) {
            options = options || {};
            var splitter = options.cellSplitter || /\s+/, emptyStringRe = /^\s*$/, convertTypes = options.hasOwnProperty('convertTypes') ? !!options.convertTypes : true, lines = string.lines(s), table = [];
            for (var i = 0; i < lines.length; i++) {
                var tokens = string.tokens(lines[i], splitter);
                if (convertTypes) {
                    tokens = tokens.map(function (tok) {
                        if (tok.match(emptyStringRe))
                            return tok;
                        var num = Number(tok);
                        if (!isNaN(num))
                            return num;
                        var date = new Date(tok);
                        if (!isNaN(+date))
                            return date;
                        return tok.trim();
                    });
                }
                if (tokens.length > 0)
                    table.push(tokens);
            }
            return table;
        },
        unescapeCharacterEntities: function (s) {
            if (typeof document === 'undefined')
                throw new Error('Cannot unescapeCharacterEntities');
            var div = document.createElement('div');
            div.innerHTML = s;
            return div.textContent;
        },
        toQueryParams: function (s, separator) {
            var match = s.trim().match(/([^?#]*)(#.*)?$/);
            if (!match)
                return {};
            var hash = match[1].split(separator || '&').inject({}, function (hash, pair) {
                if ((pair = pair.split('='))[0]) {
                    var key = decodeURIComponent(pair.shift());
                    var value = pair.length > 1 ? pair.join('=') : pair[0];
                    if (value != undefined)
                        value = decodeURIComponent(value);
                    if (key in hash) {
                        if (!Array.isArray(hash[key]))
                            hash[key] = [hash[key]];
                        hash[key].push(value);
                    } else
                        hash[key] = value;
                }
                return hash;
            });
            return hash;
        },
        joinPath: function () {
            var args = Array.prototype.slice.call(arguments);
            return args.reduce(function (path, ea) {
                return typeof ea === 'string' ? path.replace(/\/*$/, '') + '/' + ea.replace(/^\/*/, '') : path;
            });
        },
        newUUID: function () {
            var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 3 | 8;
                return v.toString(16);
            }).toUpperCase();
            return id;
        },
        createDataURI: function (content, mimeType) {
            mimeType = mimeType || 'text/plain';
            return 'data:' + mimeType + ';base64,' + btoa(content);
        },
        hashCode: function (s) {
            var hash = 0, len = s.length;
            if (len == 0)
                return hash;
            for (var i = 0; i < len; i++) {
                var c = s.charCodeAt(i);
                hash = (hash << 5) - hash + c;
                hash = hash & hash;
            }
            return hash;
        },
        md5: function (string) {
            var add32 = function add32(x, y) {
                var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return msw << 16 | lsw & 65535;
            };
            function cmn(q, a, b, x, s, t) {
                a = add32(add32(a, q), add32(x, t));
                return add32(a << s | a >>> 32 - s, b);
            }
            function ff(a, b, c, d, x, s, t) {
                return cmn(b & c | ~b & d, a, b, x, s, t);
            }
            function gg(a, b, c, d, x, s, t) {
                return cmn(b & d | c & ~d, a, b, x, s, t);
            }
            function hh(a, b, c, d, x, s, t) {
                return cmn(b ^ c ^ d, a, b, x, s, t);
            }
            function ii(a, b, c, d, x, s, t) {
                return cmn(c ^ (b | ~d), a, b, x, s, t);
            }
            function md5cycle(x, k) {
                var a = x[0], b = x[1], c = x[2], d = x[3];
                a = ff(a, b, c, d, k[0], 7, -680876936);
                d = ff(d, a, b, c, k[1], 12, -389564586);
                c = ff(c, d, a, b, k[2], 17, 606105819);
                b = ff(b, c, d, a, k[3], 22, -1044525330);
                a = ff(a, b, c, d, k[4], 7, -176418897);
                d = ff(d, a, b, c, k[5], 12, 1200080426);
                c = ff(c, d, a, b, k[6], 17, -1473231341);
                b = ff(b, c, d, a, k[7], 22, -45705983);
                a = ff(a, b, c, d, k[8], 7, 1770035416);
                d = ff(d, a, b, c, k[9], 12, -1958414417);
                c = ff(c, d, a, b, k[10], 17, -42063);
                b = ff(b, c, d, a, k[11], 22, -1990404162);
                a = ff(a, b, c, d, k[12], 7, 1804603682);
                d = ff(d, a, b, c, k[13], 12, -40341101);
                c = ff(c, d, a, b, k[14], 17, -1502002290);
                b = ff(b, c, d, a, k[15], 22, 1236535329);
                a = gg(a, b, c, d, k[1], 5, -165796510);
                d = gg(d, a, b, c, k[6], 9, -1069501632);
                c = gg(c, d, a, b, k[11], 14, 643717713);
                b = gg(b, c, d, a, k[0], 20, -373897302);
                a = gg(a, b, c, d, k[5], 5, -701558691);
                d = gg(d, a, b, c, k[10], 9, 38016083);
                c = gg(c, d, a, b, k[15], 14, -660478335);
                b = gg(b, c, d, a, k[4], 20, -405537848);
                a = gg(a, b, c, d, k[9], 5, 568446438);
                d = gg(d, a, b, c, k[14], 9, -1019803690);
                c = gg(c, d, a, b, k[3], 14, -187363961);
                b = gg(b, c, d, a, k[8], 20, 1163531501);
                a = gg(a, b, c, d, k[13], 5, -1444681467);
                d = gg(d, a, b, c, k[2], 9, -51403784);
                c = gg(c, d, a, b, k[7], 14, 1735328473);
                b = gg(b, c, d, a, k[12], 20, -1926607734);
                a = hh(a, b, c, d, k[5], 4, -378558);
                d = hh(d, a, b, c, k[8], 11, -2022574463);
                c = hh(c, d, a, b, k[11], 16, 1839030562);
                b = hh(b, c, d, a, k[14], 23, -35309556);
                a = hh(a, b, c, d, k[1], 4, -1530992060);
                d = hh(d, a, b, c, k[4], 11, 1272893353);
                c = hh(c, d, a, b, k[7], 16, -155497632);
                b = hh(b, c, d, a, k[10], 23, -1094730640);
                a = hh(a, b, c, d, k[13], 4, 681279174);
                d = hh(d, a, b, c, k[0], 11, -358537222);
                c = hh(c, d, a, b, k[3], 16, -722521979);
                b = hh(b, c, d, a, k[6], 23, 76029189);
                a = hh(a, b, c, d, k[9], 4, -640364487);
                d = hh(d, a, b, c, k[12], 11, -421815835);
                c = hh(c, d, a, b, k[15], 16, 530742520);
                b = hh(b, c, d, a, k[2], 23, -995338651);
                a = ii(a, b, c, d, k[0], 6, -198630844);
                d = ii(d, a, b, c, k[7], 10, 1126891415);
                c = ii(c, d, a, b, k[14], 15, -1416354905);
                b = ii(b, c, d, a, k[5], 21, -57434055);
                a = ii(a, b, c, d, k[12], 6, 1700485571);
                d = ii(d, a, b, c, k[3], 10, -1894986606);
                c = ii(c, d, a, b, k[10], 15, -1051523);
                b = ii(b, c, d, a, k[1], 21, -2054922799);
                a = ii(a, b, c, d, k[8], 6, 1873313359);
                d = ii(d, a, b, c, k[15], 10, -30611744);
                c = ii(c, d, a, b, k[6], 15, -1560198380);
                b = ii(b, c, d, a, k[13], 21, 1309151649);
                a = ii(a, b, c, d, k[4], 6, -145523070);
                d = ii(d, a, b, c, k[11], 10, -1120210379);
                c = ii(c, d, a, b, k[2], 15, 718787259);
                b = ii(b, c, d, a, k[9], 21, -343485551);
                x[0] = add32(a, x[0]);
                x[1] = add32(b, x[1]);
                x[2] = add32(c, x[2]);
                x[3] = add32(d, x[3]);
            }
            function md51(s) {
                var n = s.length, state = [
                        1732584193,
                        -271733879,
                        -1732584194,
                        271733878
                    ], i;
                for (i = 64; i <= n; i += 64) {
                    md5cycle(state, md5blk(s.substring(i - 64, i)));
                }
                s = s.substring(i - 64);
                var tail = [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ], sl = s.length;
                for (i = 0; i < sl; i++)
                    tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
                tail[i >> 2] |= 128 << (i % 4 << 3);
                if (i > 55) {
                    md5cycle(state, tail);
                    i = 16;
                    while (i--) {
                        tail[i] = 0;
                    }
                }
                tail[14] = n * 8;
                md5cycle(state, tail);
                return state;
            }
            function md5blk(s) {
                var md5blks = [], i;
                for (i = 0; i < 64; i += 4) {
                    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
                }
                return md5blks;
            }
            var hex_chr = '0123456789abcdef'.split('');
            function rhex(n) {
                var s = '', j = 0;
                for (; j < 4; j++)
                    s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
                return s;
            }
            function hex(x) {
                var l = x.length;
                for (var i = 0; i < l; i++)
                    x[i] = rhex(x[i]);
                return x.join('');
            }
            return hex(md51(string));
        },
        reMatches: function (string, re) {
            var matches = [];
            string.replace(re, function (match, idx) {
                matches.push({
                    match: match,
                    start: idx,
                    end: idx + match.length
                });
            });
            return matches;
        },
        stringMatch: function (s, patternString, options) {
            options = options || {};
            if (!!options.normalizeWhiteSpace)
                s = s.replace(/\s+/g, ' ');
            if (!!options.ignoreIndent) {
                s = s.replace(/^\s+/gm, '');
                patternString = patternString.replace(/^\s+/gm, '');
            }
            return s == patternString ? { matched: true } : embeddedReMatch(s, patternString);
            function splitInThree(string, start, end, startGap, endGap) {
                startGap = startGap || 0;
                endGap = endGap || 0;
                return [
                    string.slice(0, start),
                    string.slice(start + startGap, end - endGap),
                    string.slice(end)
                ];
            }
            function matchStringForward(s, pattern) {
                if (pattern.constructor !== RegExp) {
                    var idx = s.indexOf(pattern);
                    if (idx === 0)
                        return {
                            match: pattern,
                            rest: s.slice(pattern.length)
                        };
                    for (var i = 0; i < pattern.length; i++)
                        if (pattern[i] != s[i])
                            return {
                                match: null,
                                pos: i
                            };
                    return { match: null };
                }
                var matches = string.reMatches(s, pattern);
                return !matches || !matches.length || matches[0].start !== 0 ? { match: null } : {
                    match: matches[0].match,
                    rest: s.slice(matches[0].end)
                };
            }
            function matchStringForwardWithAllPatterns(s, patterns) {
                var pos = 0;
                for (var i = 0; i < patterns.length; i++) {
                    var p = patterns[i], result = matchStringForward(s, p);
                    if (!result.match)
                        return {
                            matched: false,
                            pos: pos + (result.pos || 0),
                            pattern: p
                        };
                    pos += result.match.length;
                    s = result.rest;
                }
                return s.length ? {
                    matched: false,
                    pos: pos
                } : { matched: true };
            }
            function splitIntoPatterns(matcher) {
                var starts = string.reMatches(matcher, /__\//g), ends = string.reMatches(matcher, /\/__/g);
                if (starts.length !== ends.length) {
                    throw new Error('pattern invalid: ' + matcher + ' cannot be split into __/.../__ embedded RegExps' + '\nstarts: ' + JSON.stringify(starts) + '\nvs ends:\n' + JSON.stringify(ends));
                }
                var consumed = 0;
                return starts.reduce(function (patterns, start, i) {
                    var end = ends[i];
                    var matcher = patterns.pop();
                    var splitted = splitInThree(matcher, start.start - consumed, end.end - consumed, 3, 3);
                    if (splitted[0].length) {
                        patterns.push(splitted[0]);
                        consumed += splitted[0].length;
                    }
                    try {
                        if (splitted[1].length) {
                            patterns.push(new RegExp(splitted[1]));
                            consumed += splitted[1].length + 3 + 3;
                        }
                    } catch (e) {
                        throw new Error('Cannot create pattern re from: ' + exports.obj.inspect(splitted));
                    }
                    if (splitted[2].length) {
                        patterns.push(splitted[2]);
                    }
                    return patterns;
                }, [matcher]);
            }
            function embeddedReMatch(s, patternString) {
                var patterns = splitIntoPatterns(patternString);
                var result = matchStringForwardWithAllPatterns(s, patterns);
                if (result.matched)
                    return result;
                result.error = s.slice(0, result.pos) + '<--UNMATCHED-->' + s.slice(result.pos);
                return result;
            }
        },
        peekRight: function (s, start, needle) {
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
        peekLeft: function (s, start, needle) {
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
        lineIndexComputer: function (s) {
            var lineRanges = string.lines(s).reduce(function (lineIndexes, line) {
                var lastPos = lineIndexes.slice(-1)[0] || -1;
                return lineIndexes.concat([
                    lastPos + 1,
                    lastPos + 1 + line.length
                ]);
            }, []);
            return function (pos) {
                for (var line = 0; line < lineRanges.length; line += 2)
                    if (pos >= lineRanges[line] && pos <= lineRanges[line + 1])
                        return line / 2;
                return -1;
            };
        },
        lineNumberToIndexesComputer: function (s) {
            var lineRanges = string.lines(s).reduce(function (akk, line) {
                var start = akk.indexCount, end = akk.indexCount + line.length + 1;
                akk.lineRanges.push([
                    start,
                    end
                ]);
                akk.indexCount = end;
                return akk;
            }, {
                lineRanges: [],
                indexCount: 0
            }).lineRanges;
            return function (lineNo) {
                return lineRanges[lineNo];
            };
        },
        diff: function (s1, s2) {
            if (typeof JsDiff === 'undefined')
                return 'diff not supported';
            return JsDiff.convertChangesToXML(JsDiff.diffWordsWithSpace(s1, s2));
        },
        empty: function (s) {
            return s == '';
        },
        include: features.includes ? function (s, pattern) {
            return s.includes(pattern);
        } : function (s, pattern) {
            return s.indexOf(pattern) > -1;
        },
        startsWith: features.startsWith ? function (s, pattern) {
            return s.startsWith(pattern);
        } : function (s, pattern) {
            return s.indexOf(pattern) === 0;
        },
        startsWithVowel: function (s) {
            var c = s[0];
            return c === 'A' || c === 'E' || c === 'I' || c === 'O' || c === 'U' || c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u' || false;
        },
        endsWith: features.endsWith ? function (s, pattern) {
            return s.endsWith(pattern);
        } : function (s, pattern) {
            var d = s.length - pattern.length;
            return d >= 0 && s.lastIndexOf(pattern) === d;
        },
        withDecimalPrecision: function (str, precision) {
            var floatValue = parseFloat(str);
            return isNaN(floatValue) ? str : floatValue.toFixed(precision);
        },
        capitalize: function (s) {
            return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
        },
        camelCaseString: function (s) {
            return s.split(' ').invoke('capitalize').join('');
        },
        camelize: function (s) {
            var parts = s.split('-'), len = parts.length;
            if (len == 1)
                return parts[0];
            var camelized = s.charAt(0) == '-' ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];
            for (var i = 1; i < len; i++)
                camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
            return camelized;
        },
        truncate: function (s, length, truncation) {
            length = length || 30;
            truncation = truncation === undefined ? '...' : truncation;
            return s.length > length ? s.slice(0, length - truncation.length) + truncation : String(s);
        },
        regExpEscape: function (s) {
            return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
        },
        succ: function (s) {
            return s.slice(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) + 1);
        },
        digitValue: function (s) {
            return s.charCodeAt(0) - '0'.charCodeAt(0);
        },
        times: features.repeat ? function (s, count) {
            return s.repeat(count);
        } : function (s, count) {
            return count < 1 ? '' : new Array(count + 1).join(s);
        },
        applyChange: function (string, change) {
            if (change.action === 'insert') {
                return string.slice(0, change.start) + change.lines.join('\n') + string.slice(change.start);
            } else if (change.action === 'remove') {
                return string.slice(0, change.start) + string.slice(change.end);
            }
            return string;
        },
        applyChanges: function (s, changes) {
            return changes.reduce(function (result, change) {
                return string.applyChange(s, change);
            }, s);
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var num = exports.num = {
        random: function (min, max) {
            min = min || 0;
            max = max || 100;
            return Math.round(Math.random() * (max - min) + min);
        },
        normalRandom: function (mean, stdDev) {
            var spare, isSpareReady = false;
            return function (mean, stdDev) {
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
                    var mul = Math.sqrt(-2 * Math.log(s) / s);
                    spare = v * mul;
                    isSpareReady = true;
                    return mean + stdDev * u * mul;
                }
            };
        }(),
        randomSmallerInteger: function (n) {
            return Math.floor(Math.random() * n);
        },
        humanReadableByteSize: function (n) {
            function round(n) {
                return Math.round(n * 100) / 100;
            }
            if (n < 1000)
                return String(round(n)) + 'B';
            n = n / 1024;
            if (n < 1000)
                return String(round(n)) + 'KB';
            n = n / 1024;
            return String(round(n)) + 'MB';
        },
        average: function (numbers) {
            return numbers.reduce(function (sum, n) {
                return sum + n;
            }, 0) / numbers.length;
        },
        median: function (numbers) {
            var sorted = numbers.sort(function (a, b) {
                    return b - a;
                }), len = numbers.length;
            return len % 2 === 0 ? 0.5 * (sorted[len / 2 - 1] + sorted[len / 2]) : sorted[(len - 1) / 2];
        },
        between: function (x, a, b, eps) {
            eps = eps || 0;
            var min, max;
            if (a < b) {
                min = a, max = b;
            } else {
                max = a, min = b;
            }
            return max - x + eps >= 0 && min - x - eps <= 0;
        },
        sort: function (arr) {
            return arr.sort(function (a, b) {
                return a - b;
            });
        },
        parseLength: function (string, toUnit) {
            toUnit = toUnit || 'px';
            var match = string.match(/([0-9\.]+)\s*(.*)/);
            if (!match || !match[1])
                return undefined;
            var length = parseFloat(match[1]), fromUnit = match[2];
            return exports.num.convertLength(length, fromUnit, toUnit);
        },
        convertLength: function () {
            function toCm(n, unit) {
                if (unit === 'cm')
                    return n;
                else if (unit === 'mm')
                    return n * 0.1;
                else if (unit === 'in')
                    return n * 2.54;
                else if (unit === 'px')
                    return n * toCm(1 / 96, 'in');
                else if (unit === 'pt')
                    return n * toCm(1 / 72, 'in');
                else if (unit === 'pc')
                    return n * toCm(12, 'pt');
            }
            return function to(length, fromUnit, toUnit) {
                if (fromUnit === toUnit)
                    return length;
                else if (toUnit === 'cm')
                    return toCm(length, fromUnit);
                else if (fromUnit === 'cm')
                    return length / toCm(1, toUnit);
                else
                    return to(to(length, fromUnit, 'cm'), 'cm', toUnit);
            };
        }(),
        roundTo: function (n, quantum) {
            quantum = 1 / quantum;
            return Math.round(n * quantum) / quantum;
        },
        detent: function (n, detent, grid, snap) {
            var r1 = exports.num.roundTo(n, grid);
            if (Math.abs(n - r1) < detent / 2)
                return r1;
            if (snap)
                return n;
            var r2 = n < r1 ? r1 - detent / 2 : r1 + detent / 2;
            return r1 + (n - r2) * grid / (grid - detent);
        },
        toDegrees: function (n) {
            return n * 180 / Math.PI % 360;
        },
        toRadians: function (n) {
            return n / 180 * Math.PI;
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var dateFormat = function setupDateFormat() {
        var dateFormat = function () {
            var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g, timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g, timezoneClip = /[^-+\dA-Z]/g, pad = function (val, len) {
                    val = String(val);
                    len = len || 2;
                    while (val.length < len)
                        val = '0' + val;
                    return val;
                };
            return function (date, mask, utc) {
                var dF = dateFormat;
                if (arguments.length == 1 && Object.prototype.toString.call(date) == '[object String]' && !/\d/.test(date)) {
                    mask = date;
                    date = undefined;
                }
                date = date ? new Date(date) : new Date();
                if (isNaN(date))
                    throw SyntaxError('invalid date');
                mask = String(dF.masks[mask] || mask || dF.masks['default']);
                if (mask.slice(0, 4) == 'UTC:') {
                    mask = mask.slice(4);
                    utc = true;
                }
                var _ = utc ? 'getUTC' : 'get', d = date[_ + 'Date'](), D = date[_ + 'Day'](), m = date[_ + 'Month'](), y = date[_ + 'FullYear'](), H = date[_ + 'Hours'](), M = date[_ + 'Minutes'](), s = date[_ + 'Seconds'](), L = date[_ + 'Milliseconds'](), o = utc ? 0 : date.getTimezoneOffset(), flags = {
                        d: d,
                        dd: pad(d),
                        ddd: dF.i18n.dayNames[D],
                        dddd: dF.i18n.dayNames[D + 7],
                        m: m + 1,
                        mm: pad(m + 1),
                        mmm: dF.i18n.monthNames[m],
                        mmmm: dF.i18n.monthNames[m + 12],
                        yy: String(y).slice(2),
                        yyyy: y,
                        h: H % 12 || 12,
                        hh: pad(H % 12 || 12),
                        H: H,
                        HH: pad(H),
                        M: M,
                        MM: pad(M),
                        s: s,
                        ss: pad(s),
                        l: pad(L, 3),
                        L: pad(L > 99 ? Math.round(L / 10) : L),
                        t: H < 12 ? 'a' : 'p',
                        tt: H < 12 ? 'am' : 'pm',
                        T: H < 12 ? 'A' : 'P',
                        TT: H < 12 ? 'AM' : 'PM',
                        Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
                        o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                        S: [
                            'th',
                            'st',
                            'nd',
                            'rd'
                        ][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                    };
                return mask.replace(token, function ($0) {
                    return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
                });
            };
        }();
        dateFormat.masks = {
            'default': 'ddd mmm dd yyyy HH:MM:ss',
            shortDate: 'm/d/yy',
            mediumDate: 'mmm d, yyyy',
            longDate: 'mmmm d, yyyy',
            fullDate: 'dddd, mmmm d, yyyy',
            shortTime: 'h:MM TT',
            mediumTime: 'h:MM:ss TT',
            longTime: 'h:MM:ss TT Z',
            isoDate: 'yyyy-mm-dd',
            isoTime: 'HH:MM:ss',
            isoDateTime: 'yyyy-mm-dd\'T\'HH:MM:ss',
            isoUtcDateTime: 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\''
        };
        dateFormat.i18n = {
            dayNames: [
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ],
            monthNames: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ]
        };
        return dateFormat;
    }();
    exports.date = {
        format: function (date, mask, utc) {
            return dateFormat;
        }(),
        equals: function (date, otherDate) {
            return otherDate && otherDate instanceof Date && otherDate.getTime() === date.getTime();
        },
        relativeTo: function (date, otherDate) {
            if (!(otherDate instanceof Date))
                return '';
            if (otherDate < date)
                return '';
            if (otherDate === date)
                return 'now';
            var minuteString = 'min', secondString = 'sec', hourString = 'hour', dayString = 'day', diff = otherDate - date, totalSecs = Math.round(diff / 1000), secs = totalSecs % 60, mins = Math.floor(totalSecs / 60) % 60, hours = Math.floor(totalSecs / 60 / 60) % 24, days = Math.floor(totalSecs / 60 / 60 / 24), parts = [];
            if (days > 0) {
                parts.push(days);
                if (days > 1)
                    dayString += 's';
                parts.push(dayString);
            }
            if (hours > 0 && days < 2) {
                parts.push(hours);
                if (hours > 1)
                    hourString += 's';
                parts.push(hourString);
            }
            if (mins > 0 && hours < 3 && days === 0) {
                parts.push(mins);
                if (mins > 1)
                    minuteString += 's';
                parts.push(minuteString);
            }
            if (secs > 0 && mins < 3 && hours === 0 && days === 0) {
                parts.push(secs);
                if (secs > 1)
                    secondString += 's';
                parts.push(secondString);
            }
            return parts.join(' ');
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var arr = exports.arr, obj = exports.obj;
    exports.promise = function promise(obj) {
        return typeof obj === 'function' ? promise.convertCallbackFun(obj) : Promise.resolve(obj);
    };
    obj.extend(exports.promise, {
        delay: function (ms, resolveVal) {
            return new Promise(function (resolve) {
                setTimeout(resolve, ms, resolveVal);
            });
        },
        delayReject: function (ms, rejectVal) {
            return new Promise(function (_, reject) {
                setTimeout(reject, ms, rejectVal);
            });
        },
        timeout: function (ms, promise) {
            return new Promise(function (resolve, reject) {
                var done = false;
                setTimeout(function () {
                    return !done && (done = true) && reject(new Error('Promise timed out'));
                }, ms);
                promise.then(function (val) {
                    return !done && (done = true) && resolve(val);
                }, function (err) {
                    return !done && (done = true) && reject(err);
                });
            });
        },
        waitFor: function (ms, tester) {
            return new Promise(function (resolve, reject) {
                if (typeof ms === 'function') {
                    tester = ms;
                    ms = undefined;
                }
                var stopped = false, error = null, value = undefined, i = setInterval(function () {
                        if (stopped) {
                            clearInterval(i);
                            return;
                        }
                        try {
                            value = tester();
                        } catch (e) {
                            error = e;
                        }
                        if (value || error) {
                            stopped = true;
                            clearInterval(i);
                            error ? reject(error) : resolve(value);
                        }
                    }, 10);
                if (typeof ms === 'number') {
                    setTimeout(function () {
                        error = new Error('timeout');
                    }, ms);
                }
            });
        },
        deferred: function () {
            var resolve, reject, promise = new Promise(function (_resolve, _reject) {
                    resolve = _resolve;
                    reject = _reject;
                });
            return {
                resolve: resolve,
                reject: reject,
                promise: promise
            };
        },
        convertCallbackFun: function (func) {
            return function promiseGenerator() {
                var args = arr.from(arguments), self = this;
                return new Promise(function (resolve, reject) {
                    args.push(function (err, result) {
                        return err ? reject(err) : resolve(result);
                    });
                    func.apply(self, args);
                });
            };
        },
        convertCallbackFunWithManyArgs: function (func) {
            return function promiseGenerator() {
                var args = arr.from(arguments), self = this;
                return new Promise(function (resolve, reject) {
                    args.push(function () {
                        var args = arr.from(arguments), err = args.shift();
                        return err ? reject(err) : resolve(args);
                    });
                    func.apply(self, args);
                });
            };
        },
        _chainResolveNext: function resolveNext(promiseFuncs, prevResult, akku, resolve, reject) {
            var next = promiseFuncs.shift();
            if (!next)
                resolve(prevResult);
            else {
                try {
                    Promise.resolve(next(prevResult, akku)).then(function (result) {
                        resolveNext(promiseFuncs, result, akku, resolve, reject);
                    }).catch(function (err) {
                        reject(err);
                    });
                } catch (err) {
                    reject(err);
                }
            }
        },
        chain: function (promiseFuncs) {
            return new Promise(function (resolve, reject) {
                exports.promise._chainResolveNext(promiseFuncs.slice(), undefined, {}, resolve, reject);
            });
        }
    });
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    var events = exports.events = {
        makeEmitter: isNode ? function (obj) {
            if (obj.on && obj.removeListener)
                return obj;
            var events = require('events');
            require('util')._extend(obj, events.EventEmitter.prototype);
            events.EventEmitter.call(obj);
            return obj;
        } : function (obj) {
            if (obj.on && obj.removeListener)
                return obj;
            obj.listeners = {};
            obj.on = function (type, handler) {
                if (!handler)
                    return;
                if (!obj.listeners[type])
                    obj.listeners[type] = [];
                obj.listeners[type].push(handler);
            };
            obj.once = function (type, handler) {
                if (!handler)
                    return;
                function onceHandler() {
                    obj.removeListener(type, onceHandler);
                    handler.apply(this, arguments);
                }
                obj.on(type, onceHandler);
            };
            obj.removeListener = function (type, handler) {
                if (!obj.listeners[type])
                    return;
                obj.listeners[type] = obj.listeners[type].filter(function (h) {
                    return h !== handler;
                });
            };
            obj.removeAllListeners = function (type) {
                if (!obj.listeners[type])
                    return;
                obj.listeners[type] = [];
            };
            obj.emit = function () {
                var args = Array.prototype.slice.call(arguments);
                var type = args.shift();
                var handlers = obj.listeners[type];
                if (!handlers || !handlers.length)
                    return;
                handlers.forEach(function (handler) {
                    try {
                        handler.apply(null, args);
                    } catch (e) {
                        console.error('Error in event handler: %s', e.stack || String(e));
                    }
                });
            };
            return obj;
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var obj = exports.obj;
    var arr = exports.arr;
    var graph = exports.graph = {
        clone: function (graph) {
            var cloned = {};
            for (var id in graph)
                cloned[id] = graph[id].slice();
            return cloned;
        },
        without: function (graph, ids) {
            var cloned = {};
            for (var id in graph) {
                if (ids.indexOf(id) > -1)
                    continue;
                cloned[id] = graph[id].filter(function (id) {
                    return ids.indexOf(id) === -1;
                });
            }
            return cloned;
        },
        hull: function (graphMap, id, ignore, maxDepth) {
            return arr.uniq(arr.flatten(obj.values(graph.subgraphReachableBy(graphMap, id, ignore, maxDepth))));
        },
        subgraphReachableBy: function (graphMap, id, ignore, maxDepth) {
            maxDepth = maxDepth || 10;
            if (ignore)
                graphMap = graph.without(graphMap, ignore);
            var ids = [id], step = 0, subgraph = {};
            while (ids.length && step++ < maxDepth) {
                ids = ids.reduce(function (ids, id) {
                    return subgraph[id] ? ids : ids.concat(subgraph[id] = graphMap[id] || []);
                }, []);
            }
            return subgraph;
        },
        invert: function (g) {
            return Object.keys(g).reduce(function (inverted, k) {
                g[k].forEach(function (k2) {
                    if (!inverted[k2])
                        inverted[k2] = [k];
                    else
                        inverted[k2].push(k);
                });
                return inverted;
            }, {});
        },
        sortByReference: function (depGraph, startNode) {
            var all = [startNode].concat(graph.hull(depGraph, startNode)), seen = [], groups = [];
            while (seen.length !== all.length) {
                var depsRemaining = arr.withoutAll(all, seen).reduce(function (depsRemaining, node) {
                        depsRemaining[node] = arr.withoutAll(depGraph[node] || [], seen).length;
                        return depsRemaining;
                    }, {}), min = arr.withoutAll(all, seen).reduce(function (minNode, node) {
                        return depsRemaining[node] <= depsRemaining[minNode] ? node : minNode;
                    });
                if (depsRemaining[min] === 0) {
                    groups.push(Object.keys(depsRemaining).filter(function (key) {
                        return depsRemaining[key] === 0;
                    }));
                } else {
                    groups.push([min]);
                }
                seen = arr.flatten(groups);
            }
            return groups;
        },
        reduce: function (doFunc, graph, rootNode, carryOver, ignore, context) {
            var visitedNodes = ignore || [], index = 0;
            iterator(rootNode);
            return carryOver;
            function iterator(currentNode) {
                if (visitedNodes.indexOf(currentNode) > -1)
                    return;
                carryOver = doFunc.call(context, carryOver, currentNode, index++);
                visitedNodes = visitedNodes.concat([currentNode]);
                var next = arr.withoutAll(graph[currentNode] || [], visitedNodes);
                next.forEach(function (ea) {
                    return iterator(ea);
                });
            }
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var arr = exports.arr;
    if (!arr)
        throw new Error('messenger.js needs collection.js!');
    var fun = exports.fun;
    if (!fun)
        throw new Error('messenger.js needs function.js!');
    var string = exports.string;
    if (!string)
        throw new Error('messenger.js needs string.js!');
    var events = exports.events;
    if (!events)
        throw new Error('messenger.js needs events.js!');
    var obj = exports.obj;
    if (!obj)
        throw new Error('messenger.js needs object.js!');
    var OFFLINE = 'offline';
    var ONLINE = 'online';
    var CONNECTING = 'connecting';
    var messenger = exports.messenger = {
        OFFLINE: OFFLINE,
        ONLINE: ONLINE,
        CONNECTING: CONNECTING,
        create: function (spec) {
            var expectedMethods = [
                {
                    name: 'send',
                    args: [
                        'msg',
                        'callback'
                    ]
                },
                {
                    name: 'listen',
                    args: [
                        'messenger',
                        'callback'
                    ]
                },
                {
                    name: 'close',
                    args: [
                        'messenger',
                        'callback'
                    ]
                },
                {
                    name: 'isOnline',
                    args: []
                }
            ];
            var ignoredAttributes = expectedMethods.map(function (ea) {
                return ea.name;
            }).concat([
                'id',
                'sendHeartbeat',
                'heartbeatInterval',
                'ignoreUnknownMessages',
                'allowConcurrentSends',
                'sendTimeout',
                'services'
            ]);
            expectedMethods.forEach(function (exp) {
                if (spec[exp.name])
                    return;
                var msg = 'message implementation needs function ' + exp.name + '(' + exp.args.join(',') + ')';
                throw new Error(msg);
            });
            var heartbeatInterval = spec.sendHeartbeat && (spec.heartbeatInterval || 1000);
            var ignoreUnknownMessages = spec.hasOwnProperty('ignoreUnknownMessages') ? spec.ignoreUnknownMessages : false;
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
                _runWhenOnlineCallbacks: function () {
                    var cbs = arr.clone(messenger._whenOnlineCallbacks);
                    messenger._whenOnlineCallbacks = [];
                    cbs.forEach(function (ea) {
                        try {
                            ea.call(null, null, messenger);
                        } catch (e) {
                            console.error('error in _runWhenOnlineCallbacks: %s', e);
                        }
                    });
                },
                _ensureStatusWatcher: function () {
                    if (messenger._statusWatcherProc)
                        return;
                    messenger._statusWatcherProc = setInterval(function () {
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
                _addMissingData: function (msg) {
                    if (!msg.target)
                        throw new Error('Message needs target!');
                    if (!msg.action)
                        throw new Error('Message needs action!');
                    if (!msg.data)
                        msg.data = null;
                    if (!msg.messageId)
                        msg.messageId = string.newUUID();
                    msg.sender = messenger.id();
                    msg.messageIndex = messenger._messageCounter++;
                    return msg;
                },
                _queueSend: function (msg, onReceiveFunc) {
                    if (onReceiveFunc && typeof onReceiveFunc !== 'function')
                        throw new Error('Expecing a when send callback, got: ' + onReceiveFunc);
                    messenger._outgoing.push([
                        msg,
                        onReceiveFunc
                    ]);
                },
                _deliverMessageQueue: function () {
                    if (!spec.allowConcurrentSends && messenger._inflight.length)
                        return;
                    var queued = messenger._outgoing.shift();
                    if (!queued)
                        return;
                    messenger._inflight.push(queued);
                    if (messenger.isOnline())
                        deliver(queued);
                    else
                        messenger.whenOnline(function () {
                            deliver(queued);
                        });
                    startTimeoutProc(queued);
                    if (spec.allowConcurrentSends && messenger._outgoing.length)
                        messenger._deliverMessageQueue();
                    function deliver(queued) {
                        if (messenger._inflight.indexOf(queued) === -1)
                            return;
                        var msg = queued[0], callback = queued[1];
                        if (callback)
                            messenger._messageResponseCallbacks[msg.messageId] = callback;
                        spec.send.call(messenger, msg, function (err) {
                            arr.remove(messenger._inflight, queued);
                            if (err)
                                onSendError(err, queued);
                            messenger._deliverMessageQueue();
                        });
                    }
                    function startTimeoutProc(queued) {
                        if (typeof spec.sendTimeout !== 'number')
                            return;
                        setTimeout(function () {
                            if (messenger._inflight.indexOf(queued) === -1)
                                return;
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
                _startHeartbeatProcess: function () {
                    if (messenger._startHeartbeatProcessProc)
                        return;
                    messenger._startHeartbeatProcessProc = setTimeout(function () {
                        spec.sendHeartbeat.call(messenger, function (err, result) {
                            messenger._startHeartbeatProcessProc = null;
                            messenger._startHeartbeatProcess();
                        });
                    }, messenger._heartbeatInterval);
                },
                id: function () {
                    return messenger._id;
                },
                isOnline: function () {
                    return spec.isOnline.call(messenger);
                },
                heartbeatEnabled: function () {
                    return typeof messenger._heartbeatInterval === 'number';
                },
                listen: function (thenDo) {
                    if (messenger._listenInProgress)
                        return;
                    messenger._listenInProgress = true;
                    messenger._ensureStatusWatcher();
                    return spec.listen.call(messenger, function (err) {
                        messenger._listenInProgress = null;
                        thenDo && thenDo(err);
                        if (messenger.heartbeatEnabled())
                            messenger._startHeartbeatProcess();
                    });
                    return messenger;
                },
                reconnect: function () {
                    if (messenger._status === ONLINE)
                        return;
                    messenger.listen();
                    return messenger;
                },
                send: function (msg, onReceiveFunc) {
                    messenger._addMissingData(msg);
                    messenger._queueSend(msg, onReceiveFunc);
                    messenger._deliverMessageQueue();
                    return msg;
                },
                sendTo: function (target, action, data, onReceiveFunc) {
                    var msg = {
                        target: target,
                        action: action,
                        data: data
                    };
                    return messenger.send(msg, onReceiveFunc);
                },
                onMessage: function (msg) {
                    messenger.emit('message', msg);
                    if (msg.inResponseTo) {
                        var cb = messenger._messageResponseCallbacks[msg.inResponseTo];
                        if (cb && !msg.expectMoreResponses)
                            delete messenger._messageResponseCallbacks[msg.inResponseTo];
                        if (cb)
                            cb(null, msg);
                    } else {
                        var action = messenger._services[msg.action];
                        if (action) {
                            try {
                                action.call(null, msg, messenger);
                            } catch (e) {
                                var errmMsg = String(e.stack || e);
                                console.error('Error invoking service: ' + errmMsg);
                                messenger.answer(msg, { error: errmMsg });
                            }
                        } else if (!messenger._ignoreUnknownMessages) {
                            var err = new Error('messageNotUnderstood: ' + msg.action);
                            messenger.answer(msg, { error: String(err) });
                        }
                    }
                },
                answer: function (msg, data, expectMore, whenSend) {
                    if (typeof expectMore === 'function') {
                        whenSend = expectMore;
                        expectMore = false;
                    }
                    var answer = {
                        target: msg.sender,
                        action: msg.action + 'Result',
                        inResponseTo: msg.messageId,
                        data: data
                    };
                    if (expectMore)
                        answer.expectMoreResponses = true;
                    return messenger.send(answer, whenSend);
                },
                close: function (thenDo) {
                    clearInterval(messenger._statusWatcherProc);
                    messenger._statusWatcherProc = null;
                    spec.close.call(messenger, function (err) {
                        messenger._status = OFFLINE;
                        thenDo && thenDo(err);
                    });
                    return messenger;
                },
                whenOnline: function (thenDo) {
                    messenger._whenOnlineCallbacks.push(thenDo);
                    if (messenger.isOnline())
                        messenger._runWhenOnlineCallbacks();
                    return messenger;
                },
                outgoingMessages: function () {
                    return arr.pluck(messenger._inflight.concat(messenger._outgoing), 0);
                },
                addServices: function (serviceSpec) {
                    obj.extend(messenger._services, serviceSpec);
                    return messenger;
                }
            };
            if (spec.services)
                messenger.addServices(spec.services);
            events.makeEmitter(messenger);
            for (var name in spec) {
                if (ignoredAttributes.indexOf(name) === -1 && spec.hasOwnProperty(name)) {
                    messenger[name] = spec[name];
                }
            }
            return messenger;
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));

;
(function (exports) {
    'use strict';
    var isNodejs = typeof require !== 'undefined' && typeof process !== 'undefined';
    var WorkerSetup = {
        loadDependenciesBrowser: function loadDependenciesBrowser(options) {
            var me = typeof self !== 'undefined' ? self : this;
            importScripts.apply(me, options.scriptsToLoad || []);
        },
        loadDependenciesNodejs: function loadDependenciesNodejs(options) {
            var lv = global.lively || (global.lively = {});
            lv.lang = require(require('path').join(options.libLocation, 'index'));
        },
        initBrowserGlobals: function initBrowserGlobals(options) {
            remoteWorker.send = function (msg) {
                postMessage(msg);
            };
            var me = typeof self !== 'undefined' ? self : this;
            var Global = me.Global = me;
            Global.window = Global;
            Global.console = Global.console || function () {
                var c = {};
                [
                    'log',
                    'error',
                    'warn'
                ].forEach(function (name) {
                    c[name] = function () {
                        var string = arguments[0];
                        for (var i = 1; i < arguments.length; i++)
                            string = string.replace('%s', arguments[i]);
                        remoteWorker.send({
                            type: name,
                            message: [
                                '[',
                                name.toUpperCase(),
                                '] ',
                                string
                            ].join('')
                        });
                    };
                });
                return c;
            }();
        },
        initOnMessageHandler: function initOnMessageHandler(options) {
            if (remoteWorker.on)
                remoteWorker.on('message', onMessage);
            else
                remoteWorker.onmessage = onMessage;
            function onMessage(msg) {
                msg = msg.data.data ? msg.data : msg;
                if (remoteWorker.messenger)
                    remoteWorker.messenger.onMessage(msg);
                else if (msg.action == 'close') {
                    remoteWorker.send({
                        type: 'closed',
                        workerReady: false
                    });
                    remoteWorker.close();
                    return;
                }
            }
        },
        initWorkerInterface: function initWorkerInterface(options) {
            remoteWorker.callStringifiedFunction = function (stringifiedFunc, args, thenDo) {
                var func;
                try {
                    func = eval('(' + stringifiedFunc + ')');
                } catch (e) {
                    thenDo(new Error('Cannot create function from string: ' + e.stack || e));
                    return;
                }
                var usesCallback = func.length === args.length + 1;
                var whenDone = lively.lang.fun.once(function (err, result) {
                    remoteWorker.isBusy = false;
                    thenDo(err, result);
                });
                remoteWorker.isBusy = true;
                if (usesCallback)
                    args.push(whenDone);
                try {
                    var result = func.apply(remoteWorker, args.concat([whenDone]));
                } catch (e) {
                    whenDone(e, null);
                    return;
                }
                if (!usesCallback)
                    whenDone(null, result);
            };
            remoteWorker.httpRequest = function (options) {
                if (!options.url) {
                    console.log('Error, httpRequest needs url');
                    return;
                }
                var req = new XMLHttpRequest(), method = options.method || 'GET';
                function handleStateChange() {
                    if (req.readyState === 4) {
                        options.done && options.done(req);
                    }
                }
                req.onreadystatechange = handleStateChange;
                req.open(method, options.url);
                req.send();
            };
            remoteWorker.terminateIfNotBusyIn = function (ms) {
                setTimeout(function () {
                    if (remoteWorker.isBusy) {
                        remoteWorker.terminateIfNotBusyIn(ms);
                        return;
                    }
                    remoteWorker.send({
                        type: 'closed',
                        workerReady: false
                    });
                    remoteWorker.close();
                }, ms);
            };
        },
        initWorkerMessenger: function initWorkerMessenger(options) {
            if (!options.useMessenger)
                return null;
            if (!lively.lang.messenger)
                throw new Error('worker.create requires messenger.js to be loaded!');
            if (!lively.lang.events)
                throw new Error('worker.create requires events.js to be loaded!');
            return remoteWorker.messenger = lively.lang.messenger.create({
                services: {
                    remoteEval: function (msg, messenger) {
                        var result;
                        try {
                            result = eval(msg.data.expr);
                        } catch (e) {
                            result = e.stack || e;
                        }
                        messenger.answer(msg, { result: String(result) });
                    },
                    run: function (msg, messenger) {
                        var funcString = msg.data.func, args = msg.data.args;
                        if (!funcString) {
                            messenger.answer(msg, { error: 'no funcString' });
                            return;
                        }
                        remoteWorker.callStringifiedFunction(funcString, args, function (err, result) {
                            messenger.answer(msg, {
                                error: err ? String(err) : null,
                                result: result
                            });
                        });
                    },
                    close: function (msg, messenger) {
                        messenger.answer(msg, { status: 'OK' });
                        remoteWorker.send({
                            type: 'closed',
                            workerReady: false
                        });
                        remoteWorker.close();
                    }
                },
                isOnline: function () {
                    return true;
                },
                send: function (msg, whenSend) {
                    remoteWorker.send(msg);
                    whenSend();
                },
                listen: function (whenListening) {
                    whenListening();
                },
                close: function (whenClosed) {
                    remoteWorker.send({
                        type: 'closed',
                        workerReady: false
                    });
                    remoteWorker.close();
                }
            });
        }
    };
    var BrowserWorker = {
        create: function (options) {
            options = options || {};
            if (!options.libLocation && !options.scriptsToLoad) {
                var workerScript = document.querySelector('script[src$="worker.js"]');
                if (!workerScript)
                    throw new Error('Cannot find library path to start worker. Use worker.create({libLocation: "..."}) to explicitly define the path!');
                options.libLocation = workerScript.src.replace(/worker.js$/, '');
            }
            var workerSetupCode = String(workerSetupFunction).replace('__FUNCTIONDECLARATIONS__', [
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
                        'worker.js'
                    ].map(function (ea) {
                        return options.libLocation + ea;
                    });
                }
                var workerOptions = Object.keys(options).reduce(function (opts, key) {
                    if (typeof options[key] !== 'function')
                        opts[key] = options[key];
                    return opts;
                }, {});
                worker.onmessage = function (evt) {
                    if (evt.data.workerReady !== undefined) {
                        worker.ready = !!evt.data.workerReady;
                        if (worker.ready)
                            worker.emit('ready');
                        else
                            worker.emit('close');
                    } else
                        worker.emit('message', evt.data);
                };
                worker.errors = [];
                worker.onerror = function (evt) {
                    console.error(evt);
                    worker.errors.push(evt);
                    worker.emit('error', evt);
                };
                worker.postMessage({
                    action: 'setup',
                    options: workerOptions
                });
            }
            function workerSetupFunction() {
                var remoteWorker = self;
                remoteWorker.onmessage = function (evt) {
                    if (evt.data.action !== 'setup') {
                        throw new Error('expected setup to be first message but got ' + JSON.stringify(evt.data));
                    }
                    var options = evt.data.options || {};
                    initBrowserGlobals(options);
                    loadDependenciesBrowser(options);
                    initOnMessageHandler(options);
                    initWorkerInterface(options);
                    initWorkerMessenger(options);
                    postMessage({ workerReady: true });
                };
                __FUNCTIONDECLARATIONS__;
            }
            function makeDataURI(codeToInclude) {
                var blob;
                try {
                    blob = new Blob([codeToInclude], { type: 'text/javascript' });
                } catch (e) {
                    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                    blob = new BlobBuilder();
                    blob.append(codeToInclude);
                    blob = blob.getBlob();
                }
                var urlInterface = typeof webkitURL !== 'undefined' ? webkitURL : URL;
                return urlInterface.createObjectURL(blob);
            }
        }
    };
    var NodejsWorker = {
        debug: false,
        initCodeFileCreated: false,
        create: function (options) {
            options = options || {};
            var workerProc;
            var worker = exports.events.makeEmitter({
                ready: false,
                errors: [],
                postMessage: function (msg) {
                    if (!workerProc) {
                        worker.emit('error', new Error('nodejs worker process not yet created'));
                        return;
                    }
                    if (!worker.ready) {
                        worker.emit('error', new Error('nodejs worker process not ready or already closed'));
                        return;
                    }
                    workerProc.send(msg);
                }
            });
            NodejsWorker.startWorker(options, function (err, _workerProc) {
                if (err) {
                    worker.ready = false;
                    worker.emit('error', err);
                    return;
                }
                workerProc = _workerProc;
                workerProc.on('message', function (m) {
                    NodejsWorker.debug && console.log('[WORKER PARENT] got message:', m);
                    worker.emit('message', m);
                });
                workerProc.on('close', function () {
                    console.log('[WORKER PARENT] worker closed');
                    worker.emit('close');
                });
                workerProc.on('error', function (err) {
                    console.log('[WORKER PARENT] error ', err);
                    worker.errors.push(err);
                    worker.emit('error', err);
                });
                worker.ready = true;
                worker.emit('ready');
            });
            return worker;
        },
        workerSetupFunction: function workerSetupFunction() {
            var remoteWorker = process;
            var debug = true;
            var close = false;
            debug && console.log('[WORKER] Starting init');
            remoteWorker.on('message', function (msg) {
                if (msg.action !== 'setup') {
                    throw new Error('expected setup to be first message but got ' + JSON.stringify(msg.data));
                }
                remoteWorker.removeAllListeners('message');
                var options = msg.data.options || {};
                debug && console.log('[WORKER] running setup with options', options);
                loadDependenciesNodejs(options);
                initOnMessageHandler(options);
                initWorkerInterface(options);
                initWorkerMessenger(options);
                remoteWorker.send({ workerReady: true });
            });
            __FUNCTIONDECLARATIONS__;
        },
        ensureInitCodeFile: function (options, initCode, thenDo) {
            var path = require('path');
            var os = require('os');
            var fs = require('fs');
            var workerTmpDir = path.join(os.tmpDir(), 'lively-nodejs-workers/');
            var fn = path.join(workerTmpDir, 'nodejs-worker-init.js');
            if (!NodejsWorker.initCodeFileCreated)
                NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
            else
                fs.exists(fn, function (exists) {
                    if (exists)
                        thenDo(null, fn);
                    else
                        NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
                });
        },
        createWorkerCodeFile: function (options, fileName, initCode, thenDo) {
            var path = require('path');
            var fs = require('fs');
            var exec = require('child_process').exec;
            exec('mkdir -p ' + path.dirname(fileName), function (code, out, err) {
                if (code) {
                    thenDo(new Error([
                        '[WORKER PARENT] Could not create worker temp dir:',
                        out,
                        err
                    ].join('\n')));
                    return;
                }
                fs.writeFile(fileName, initCode, function (err) {
                    NodejsWorker.debug && console.log('worker code file %s created', fileName);
                    NodejsWorker.initCodeFileCreated = true;
                    thenDo(err, fileName);
                });
            });
        },
        startWorker: function (options, thenDo) {
            var util = require('util');
            var fork = require('child_process').fork;
            var workerSetupCode = String(NodejsWorker.workerSetupFunction).replace('__FUNCTIONDECLARATIONS__', [
                WorkerSetup.loadDependenciesNodejs,
                WorkerSetup.initOnMessageHandler,
                WorkerSetup.initWorkerInterface,
                WorkerSetup.initWorkerMessenger
            ].join('\n'));
            var initCode = util.format('(%s)();\n', workerSetupCode);
            NodejsWorker.ensureInitCodeFile(options, initCode, function (err, codeFileName) {
                if (err)
                    return thenDo(err);
                var worker = fork(codeFileName, {});
                NodejsWorker.debug && console.log('worker forked');
                worker.on('message', function (m) {
                    if (m.action === 'pong')
                        console.log('[WORKER pong] ', m);
                    else if (m.action === 'log')
                        console.log('[Message from WORKER] ', m.data);
                });
                worker.once('message', function (m) {
                    NodejsWorker.debug && console.log('worker setup done');
                    thenDo(null, worker, m);
                });
                worker.on('close', function () {
                    NodejsWorker.debug && console.log('[WORKER PARENT] worker closed');
                });
                worker.send({
                    action: 'setup',
                    data: { options: options }
                });
                global.WORKER = worker;
            });
        }
    };
    var worker = exports.worker = {
        fork: function (options, workerFunc, thenDo) {
            if (!thenDo) {
                thenDo = workerFunc;
                workerFunc = options;
                options = null;
            }
            options = options || {};
            var args = options.args || [];
            var w = worker.create(options);
            w.run.apply(w, [workerFunc].concat(args).concat(thenDo));
            return w;
        },
        create: function (options) {
            options = options || {};
            options.useMessenger = true;
            if (!exports.messenger)
                throw new Error('worker.create requires messenger.js to be loaded!');
            if (!exports.events)
                throw new Error('worker.create requires events.js to be loaded!');
            if (!exports.obj)
                throw new Error('worker.create requires object.js to be loaded!');
            var workerId = options.workerId || exports.string.newUUID();
            var messenger = exports.messenger.create({
                sendTimeout: 5000,
                send: function (msg, whenSend) {
                    messenger.worker.postMessage(msg);
                    whenSend();
                },
                listen: function (whenListening) {
                    var w = messenger.worker = isNodejs ? NodejsWorker.create(options) : BrowserWorker.create(options);
                    w.on('message', function (msg) {
                        messenger.onMessage(msg);
                    });
                    w.on('ready', function () {
                        NodejsWorker.debug && console.log('WORKER READY!!!');
                    });
                    w.on('close', function () {
                        NodejsWorker.debug && console.log('WORKER CLOSED...!!!');
                    });
                    w.once('ready', whenListening);
                },
                close: function (whenClosed) {
                    if (!messenger.worker.ready)
                        return whenClosed(null);
                    return messenger.sendTo(workerId, 'close', {}, function (err, answer) {
                        err = err || answer.data.error;
                        err && console.error('Error in worker messenger close: ' + err.stack || err);
                        if (err)
                            whenClosed(err);
                        else {
                            var closed = false;
                            messenger.worker.once('close', function () {
                                closed = true;
                            });
                            exports.fun.waitFor(1000, function () {
                                return !!closed;
                            }, whenClosed);
                        }
                    });
                },
                isOnline: function () {
                    return messenger.worker && messenger.worker.ready;
                }
            });
            exports.obj.extend(messenger, {
                eval: function (code, thenDo) {
                    messenger.sendTo(workerId, 'remoteEval', { expr: code }, function (err, answer) {
                        thenDo(err, answer ? answer.data.result : null);
                    });
                },
                run: function () {
                    var args = Array.prototype.slice.call(arguments), workerFunc = args.shift(), thenDo = args.pop();
                    if (typeof workerFunc !== 'function')
                        throw new Error('run: no function that should run in worker passed');
                    if (typeof thenDo !== 'function')
                        throw new Error('run: no callback passed');
                    return messenger.sendTo(workerId, 'run', {
                        func: String(workerFunc),
                        args: args
                    }, function (err, answer) {
                        thenDo(err || answer.data.error, answer ? answer.data.result : null);
                    });
                }
            });
            messenger.listen();
            return messenger;
        }
    };
}(typeof lively !== 'undefined' && lively.lang ? lively.lang : {}));
})();