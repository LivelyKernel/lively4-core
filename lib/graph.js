/*global*/

/*
 * Computation over graphs. Unless otherwise specified a graph is a simple JS
 * object whose properties are interpreted as nodes that refer to arrays whose
 * elements describe edges. Example:
 * ```js
 * var testGraph = {
 *   "a": ["b", "c"],
 *   "b": ["c", "d", "e", "f"],
 *   "d": ["c", "f"],
 *   "e": ["a", "f"],
 *   "f": []
 * }
 * ```
 */
;(function(exports) {
"use strict";

var obj = exports.obj;
var arr = exports.arr;

function _hull(graphMap, id, ignore, result, depth, maxDepth) {
  if (depth >= maxDepth || result[id] || ignore.indexOf(id) > -1) return;
  var refs = arr.withoutAll(graphMap[id] || [], ignore);
  if (!refs) return;
  result[id] = refs;
  refs.forEach(function(id) { _hull(graphMap, id, ignore, result, depth+1, maxDepth); });
}

// show-in-doc
var graph = exports.graph = {

  hull: function(graphMap, id, ignore, maxDepth) {
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
    return arr.uniq(
            arr.flatten(
              obj.values(
                graph.subgraphReachableBy(
                  graphMap, id, ignore, maxDepth))))
  },

  subgraphReachableBy: function(graphMap, id, ignore, maxDepth) {
    var result = {};
    _hull(graphMap, id,
      arr.without(ignore || [], id),
      result, 0,
      obj.isNumber(maxDepth) ? maxDepth : 10);
    return result;
  }
};

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
