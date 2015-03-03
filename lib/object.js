/*global*/

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

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
