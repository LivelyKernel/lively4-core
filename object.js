/*global*/

// serveral methods in lib/object.js are inspired or derived from
// Prototype JavaScript framework, version 1.6.0_rc1
// (c) 2005-2007 Sam Stephenson
// Prototype is freely distributable under the terms of an MIT-style license.
// For details, see the Prototype web site: http://www.prototypejs.org/

;(function(exports) {
"use strict";

// -=-=-=-=-=-=-=-=-
// internal helper
// -=-=-=-=-=-=-=-=-

function print(obj) {
  if (obj && Array.isArray(obj)) {
    return '[' + obj.map(function(ea) { return print(ea); }) + ']';
  }
  if (typeof obj !== "string") {
    return String(obj);
  }
  var result = String(obj);
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


// -=-=-
// obj
// -=-=-
var obj = exports.obj = {

  // -=-=-=-=-
  // testing
  // -=-=-=-=-
  isArray: function(obj) {
    return obj && Array.isArray(obj);
  },

  isElement: function(object) {
      return object && object.nodeType == 1;
  },

  isFunction: function(object) {
      return object instanceof Function;
  },

  isBoolean: function(object) {
      return typeof object == "boolean";
  },

  isString: function(object) {
      return typeof object == "string";
  },

  isNumber: function(object) {
      return typeof object == "number";
  },

  isUndefined: function(object) {
      return typeof object == "undefined";
  },

  isRegExp: function(object) {
      return object instanceof RegExp;
  },

  isObject: function(object) {
      return typeof object == "object";
  },

  isEmpty: function(object) {
      for (var key in object)
          if (object.hasOwnProperty(key)) return false;
      return true;
  },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-

  keys: Object.keys || function(object) {
    var keys = [];
    for (var property in object) keys.push(property);
    return keys;
  },

  values: function(object) {
    return Object.keys(object).map(function(k) { return object[k]; });
  },

  // -=-=-=-=-
  // mutation
  // -=-=-=-=-
  extend: function(destination, source) {
    for (var property in source) {
      var getter = source.__lookupGetter__(property),
          setter = source.__lookupSetter__(property);
      if (getter) destination.__defineGetter__(property, getter);
      if (setter) destination.__defineSetter__(property, setter);
      if (getter || setter) continue;
      var sourceObj = source[property];
      destination[property] = sourceObj;
      if (typeof sourceObj === "function") {
        if (!sourceObj.name && !sourceObj.displayName)
            sourceObj.displayName = property;
        // remember the module that contains the definition
        if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
          sourceObj.sourceModule = lively.Module.current();
      }
    }
    return destination;
  },

  // -=-=-=-=-
  // clone
  // -=-=-=-=-

  clone: function(object) {
      return Array.isArray(object) ?
        Array.prototype.slice.call(object) : exports.obj.extend({}, object);
  },

  // -=-=-=-=-=-
  // inspection
  // -=-=-=-=-=-
  inspect: function inspect(obj, options, depth) {
    options = options || {};
    depth = depth || 0;
    if (!obj) return print(obj);

    // print function
    if (typeof obj === 'function') {
      return options.printFunctionSource ? String(obj) :
        'function' + (obj.name ? ' ' + obj.name : '')
        + '(' + argumentNames(obj).join(',') + ') {/*...*/}';
    }

    // print "primitive"
    switch (obj.constructor) {
      case String:
      case Boolean:
      case RegExp:
      case Number: return print(obj);
    };

    if (typeof obj.serializeExpr === 'function')
      return obj.serializeExpr();

    var isArray = obj && Array.isArray(obj),
      openBr = isArray ? '[' : '{', closeBr = isArray ? ']' : '}';
    if (options.maxDepth && depth >= options.maxDepth) return openBr + '/*...*/' + closeBr;

    var printedProps = [];
    if (isArray) {
      printedProps = obj.map(function(ea) { return inspect(ea, options, depth); });
    } else {
      printedProps = Object.keys(obj)
        .sort(function(a, b) {
          var aIsFunc = typeof obj[a] === 'function',
              bIsFunc = typeof obj[b] === 'function';
          if (aIsFunc === bIsFunc) {
            if (a < b)  return -1;
            if (a > b) return 1;
            return 0;
          };
          return aIsFunc ? 1 : -1;
        })
        .map(function(key, i) {
          if (isArray) inspect(obj[key], options, depth + 1);
          var printedVal = inspect(obj[key], options, depth + 1);
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
    // // if objs are arrays just concat them
    // // if objs are real objs then merge propertdies
    if (arguments.length > 1) {
      return exports.obj.merge(Array.prototype.slice.call(arguments));
    }

    if (exports.obj.isArray(objs[0])) { // test for all?
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
  inherit: function(obj) {
    var constructor = function ProtoConstructor() { return this; }
    constructor.prototype = obj;
    var newInstance = new constructor();
    newInstance.constructor = constructor;
    return newInstance;
  },

  valuesInPropertyHierarchy: function(obj, name) {
    // lookup all properties named name in the proto hierarchy of obj
    // also uses Lively's class structure
    var result = [],
      lookupObj = obj;
    while (true) {
      if (lookupObj.hasOwnProperty(name)) result.push(lookupObj[name])
      var proto = Object.getPrototypeOf(lookupObj);
      var superclass = lookupObj.constructor.superclass;
      if (!proto || proto === lookupObj) proto = superclass && Object.getPrototypeOf(superclass);
      if (!proto) return result.reverse();
      lookupObj = proto;
    }

    Object.getPrototypeOf(this)
    function Class$getPrototype(object) {
        return this.getConstructor(object).prototype;
    }
  },

  mergePropertyInHierarchy: function(obj, propName) {
    return this.merge(this.valuesInPropertyHierarchy(obj, propName));
  },

  deepCopy: function (o) {
    if (!o || typeof o !== "object") return o;
    var result = Array.isArray(o) ? Array(o.length) : {};
    for (var key in o) {
      if (o.hasOwnProperty(key))
        result[key] = obj.deepCopy(o[key]);
    }
    return result;
  },

  // -=-=-=-=-=-=-=-=-
  // stringification
  // -=-=-=-=-=-=-=-=-
  typeStringOf: function(obj) {
    if (obj === null) return "null";
    if (typeof obj === "undefined") return "undefined";
    return obj.constructor.name;
  },

  shortPrintStringOf: function(obj) {
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
    var immutableTypes = ["null", "undefined", "Boolean", "Number", "String"];
    return immutableTypes.indexOf(this.typeStringOf(obj)) === -1;
  },

  safeToString: function(obj) {
    try {
      return (obj ? obj.toString() : String(obj)).replace('\n','');
    } catch (e) {
      return '<error printing object>';
    }
  },

};

})(typeof jsext !== 'undefined' ? jsext : this);


// ///////////////////////////////////////////////////////////////////////////////
// // Global Helper - Objects and Properties
// ///////////////////////////////////////////////////////////////////////////////


// Global.Properties = {
//     all: function(object, predicate) {
//         var a = [];
//         for (var name in object) {
//             if ((object.__lookupGetter__(name) || !Object.isFunction(object[name]))
//               && (predicate ? predicate(name, object) : true))
//               a.push(name);
//         }
//         return a;
//     },

//     allOwnPropertiesOrFunctions: function(obj, predicate) {
//         var result = [];
//         Object.getOwnPropertyNames(obj).forEach(function(name) {
//             if (predicate ? predicate(obj, name) : true)
//                 result.push(name);
//         });
//         return result;
//     },

//     own: function(object) {
//         var a = [];
//         for (var name in object) {
//             if (object.hasOwnProperty(name) && (object.__lookupGetter__(name)
//                 || !Object.isFunction(object[name])))
//                 a.push(name);
//         }
//         return a;
//     },

//     forEachOwn: function(object, func, context) {
//         var result = [];
//         for (var name in object) {
//             if (!object.hasOwnProperty(name)) continue;
//             var value = object[name];
//             if (!Object.isFunction(value)) {
//                 result.push(func.call(context || this, name, value));
//             }
//         }
//         return result;
//     },

//     nameFor: function(object, value) {
//         for (var name in object) {
//             if (object[name] === value)
//                 return name;
//         }
//         return undefined;
//     },

//     values: function(obj) {
//         var values = [];
//         for (var name in obj)
//             values.push(obj[name]);
//         return values;
//     },

//     ownValues: function(obj) {
//         var values = [];
//         for (var name in obj) {
//             if (obj.hasOwnProperty(name))
//                 values.push(obj[name]);
//         }
//         return values;
//     },

//     printObjectSize: function(obj) {
//         return Numbers.humanReadableByteSize(JSON.stringify(obj).length);
//     },

//     any: function(obj, predicate) {
//         for (var name in obj) {
//             if (predicate(obj, name))
//                 return true;
//         }
//         return false;
//     },

//     allProperties: function(obj, predicate) {
//         var result = [];
//         for (var name in obj) {
//             if (predicate ? predicate(obj, name) : true)
//                 result.push(name);
//         }
//         return result;
//     },

//     hash: function(obj) {
//         return Object.keys(obj).sort().join('').hashCode();
//     }

// };

// Object.extend(lively, {
//     PropertyPath: function PropertyPath(path, splitter) {
//         if (path instanceof Global.lively.PropertyPath) return path;
//         if (!(this instanceof Global.lively.PropertyPath)) return new Global.lively.PropertyPath(path, splitter);
//         if (splitter) this.setSplitter(splitter);
//         return this.fromPath(path);
//     }
// });

// Object.extend(lively.PropertyPath, {
//     superclass: Object,
//     type: 'lively.PropertyPath',
//     categories: {}
// });

// Object.extend(lively.PropertyPath.prototype, {

//     isPathAccessor: true,
//     splitter: '.',

//     fromPath: function(path) {
//         if (Object.isString(path) && path !== '' && path !== this.splitter) {
//             this._parts = path.split(this.splitter);
//             this._path = path;
//         } else if (Object.isArray(path)) {
//             this._parts = [].concat(path);
//             this._path = path.join(this.splitter);
//         } else {
//             this._parts = [];
//             this._path = '';
//         }
//         return this;
//     },

//     setSplitter: function(splitter) {
//         if (splitter) this.splitter = splitter;
//         return this;
//     },

//     parts: function() { return this._parts; },

//     size: function() { return this._parts.length; },

//     slice: function(n, m) { return lively.PropertyPath(this.parts().slice(n, m)); },

//     normalizePath: function() {
//         // FIXME: define normalization
//         return this._path;
//     },

//     isRoot: function(obj) { return this._parts.length === 0; },

//     isIn: function(obj) {
//         if (this.isRoot()) return true;
//         var parent = this.get(obj, -1);
//         return parent && parent.hasOwnProperty(this._parts[this._parts.length-1]);
//     },

//     equals: function(obj) {
//         return obj && obj.isPathAccessor && this.parts().equals(obj.parts());
//     },

//     isParentPathOf: function(otherPath) {
//         otherPath = otherPath && otherPath.isPathAccessor ? otherPath : lively.PropertyPath(otherPath);
//         var parts = this.parts(),
//             otherParts = otherPath.parts();
//         for(var i = 0; i < parts.length; i ++){
//             if (parts[i] != otherParts[i]) return false
//         }
//         return true
//     },

//     relativePathTo: function(otherPath) {
//         otherPath = lively.PropertyPath(otherPath);
//         return this.isParentPathOf(otherPath) ? otherPath.slice(this.size(), otherPath.size()) : undefined;
//     },

//     set: function(obj, val, ensure) {
//         if (this.isRoot()) return undefined;
//         var parent = obj
//         for (var i = 0; i < this._parts.length-1; i++) {
//             var part = this._parts[i];
//             if (parent.hasOwnProperty(part)) {
//                 parent = parent[part];
//             } else if (ensure) {
//                 parent = parent[part] = {};
//             } else {
//                 return undefined;
//             }
//         }
//         return parent[this._parts[this._parts.length-1]] = val;
//     },

//     get: function(obj, n) {
//         var parts = n ? this._parts.slice(0, n) : this._parts;
//         return parts.reduce(function(current, pathPart) {
//             return current ? current[pathPart] : current; }, obj);
//     },

//     concat: function(path, splitter) {
//         return lively.PropertyPath(this.parts().concat(lively.PropertyPath(path, splitter).parts()));
//     },

//     toString: function() { return this.normalizePath(); },

//     serializeExpr: function() {
//         return 'lively.PropertyPath(' + Objects.inspect(this.parts()) + ')';
//     },

//     watch: function(options) {
//         // options: target, haltWhenChanged, uninstall, onGet, onSet, verbose
//         if (!options || this.isRoot()) return;
//         var target = options.target,
//             parent = this.get(target, -1),
//             propName = this.parts().last(),
//             newPropName = 'livelyPropertyWatcher$' + propName,
//             watcherIsInstalled = parent && parent.hasOwnProperty(newPropName),
//             uninstall = options.uninstall,
//             haltWhenChanged = options.haltWhenChanged,
//             showStack = options.showStack,
//             getter = parent.__lookupGetter__(propName),
//             setter = parent.__lookupSetter__(propName);
//         if (!target || !propName || !parent) return;
//         if (uninstall) {
//             if (!watcherIsInstalled) return;
//             delete parent[propName];
//             parent[propName] = parent[newPropName];
//             delete parent[newPropName];
//             var msg = Strings.format('Uninstalled watcher for %s.%s', parent, propName);
//             show(msg);
//             return;
//         }
//         if (watcherIsInstalled) {
//             var msg = Strings.format('Watcher for %s.%s already installed.', parent, propName);
//             show(msg);
//             return;
//         }
//         if (getter || setter) {
//             var msg = Strings.format('%s["%s"] is a getter/setter, watching not support', parent, propName);
//             show(msg);
//             return;
//         }
//         // observe slots, for debugging
//         parent[newPropName] = parent[propName];
//         parent.__defineSetter__(propName, function(v) {
//             var oldValue = parent[newPropName];
//             if (options.onSet) options.onSet(v, oldValue);
//             var msg = Strings.format('%s.%s changed: %s -> %s',
//                 parent, propName, oldValue, v);
//             if (showStack) msg += '\n' + lively.printStack();
//             if (options.verbose) show(msg);
//             if (haltWhenChanged) debugger;
//             return parent[newPropName] = v;
//         });
//         parent.__defineGetter__(propName, function() {
//             if (options.onGet) options.onGet(parent[newPropName]);
//             return parent[newPropName];
//         });
//         var msg = Strings.format('Watcher for %s.%s installed', parent, propName);
//         show(msg);
//     },

//     debugFunctionWrapper: function(options) {
//         // options = {target, [haltWhenChanged, showStack, verbose, uninstall]}
//         var target = options.target,
//             parent = this.get(target, -1),
//             funcName = this.parts().last(),
//             uninstall = options.uninstall,
//             haltWhenChanged = options.haltWhenChanged === undefined ? true : options.haltWhenChanged,
//             showStack = options.showStack,
//             func = parent && funcName && parent[funcName],
//             debuggerInstalled = func && func.isDebugFunctionWrapper;
//         if (!target || !funcName || !func || !parent) return;
//         if (uninstall) {
//             if (!debuggerInstalled) return;
//             parent[funcName] = parent[funcName].debugTargetFunction;
//             var msg = Strings.format('Uninstalled debugFunctionWrapper for %s.%s', parent, funcName);
//             show(msg);
//             return;
//         }
//         if (debuggerInstalled) {
//             var msg = Strings.format('debugFunctionWrapper for %s.%s already installed.', parent, funcName);
//             show(msg);
//             return;
//         }
//         var debugFunc = parent[funcName] = func.wrap(function(proceed) {
//             var args = Array.from(arguments);
//             if (haltWhenChanged) debugger;
//             if (showStack) show(lively.printStack());
//             if (options.verbose) show(funcName + ' called');
//             return args.shift().apply(parent, args);
//         });
//         debugFunc.isDebugFunctionWrapper = true;
//         debugFunc.debugTargetFunction = func;
//         var msg = Strings.format('debugFunctionWrapper for %s.%s installed', parent, funcName);
//         show(msg);
//     }

// });
