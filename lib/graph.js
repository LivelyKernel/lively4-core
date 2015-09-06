/*global*/

/*
Computation over graphs. Unless otherwise specified a graph is a simple JS
object whose properties are interpreted as nodes that refer to arrays whose
elements describe edges. Example:

```js
var testGraph = {
  "a": ["b", "c"],
  "b": ["c", "d", "e", "f"],
  "d": ["c", "f"],
  "e": ["a", "f"],
  "f": []
}
```
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
    // Takes a graph in object format and a start id and then traverses the
    // graph and gathers all nodes that can be reached from that start id.
    // Returns a list of those nodes.
    // Optionally use `ignore` list to filter out certain nodes that shouldn't
    // be considered and maxDepth to stop early. By default a maxDepth of 20 is
    // used.
    // Example:
    // var testGraph = {
    // "a": ["b", "c"],
    // "b": ["c", "d", "e", "f"],
    // "d": ["c", "f"],
    // "e": ["a", "f"],
    // "f": []
    // }
    // graph.hull(testGraph, "d") // => ["c", "f"]
    // graph.hull(testGraph, "e") // => ['a', 'f', 'b', 'c', 'd', 'e']
    // graph.hull(testGraph, "e", ["b"]) // =? ["a", "f", "c"]
    return arr.uniq(
            arr.flatten(
              obj.values(
                graph.subgraphReachableBy(
                  graphMap, id, ignore, maxDepth))))
  },

  subgraphReachableBy: function(graphMap, id, ignore, maxDepth) {
    // show-in-doc
    // Like hull but returns subgraph map of `graphMap`
    // Example:
    // graph.subgraphReachableBy(testGraph, "e", [], 2);
    // // => {e: [ 'a', 'f' ], a: [ 'b', 'c' ], f: []}
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
