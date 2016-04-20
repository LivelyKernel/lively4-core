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

// show-in-doc
var graph = exports.graph = {

  clone: function(graph) {
    // return a copy of graph map
    var cloned = {};
    for (var id in graph)
      cloned[id] = graph[id].slice();
    return cloned;
  },

  without: function(graph, ids) {
    // return a copy of graph map with ids removed
    var cloned = {};
    for (var id in graph) {
      if (ids.indexOf(id) > -1) continue;
      cloned[id] = graph[id].filter(function(id) {
        return ids.indexOf(id) === -1; });
    }
    return cloned;
  },

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
    maxDepth = maxDepth || 10;
    if (ignore) graphMap = graph.without(graphMap, ignore);
    var ids = [id], step = 0, subgraph = {};
    while (ids.length && step++ < maxDepth) {
      ids = ids.reduce(function(ids, id) {
        return subgraph[id] ?
          ids : ids.concat(subgraph[id] = graphMap[id] || []);
      }, []);
    }
    return subgraph;
  },

  invert: function(g) {
    // inverts the references of graph object `g`.
    // Example:
    // graph.invert({a: ["b"], b: ["a", "c"]})
    //   // => {a: ["b"], b: ["a"], c: ["b"]}
    return Object.keys(g).reduce((inverted, k) => {
      g[k].forEach(k2 => {
        if (!inverted[k2]) inverted[k2] = [k];
        else inverted[k2].push(k)
      });
      return inverted;
    }, {});
  },


  sortByReference: function(depGraph, startNode) {
    // Sorts graph into an array of arrays. Each "bucket" contains the graph
    // nodes that have no other incoming nodes than those already visited. This
    // means, we start with the leaf nodes and then walk our way up.
    // This is useful for computing how to traverse a dependency graph: You get
    // a sorted list of dependencies that also allows circular references.
    // Example:
    // var depGraph = {a: ["b", "c"], b: ["c"], c: ["b"]};
    // graph.sortByReference(depGraph, "a");
    // // => [["c"], ["b"], ["a"]]

    var all = [startNode].concat(lively.lang.graph.hull(depGraph, startNode)),
        seen = [], groups = [];

    while (seen.length !== all.length) {
      var depsRemaining = lively.lang.arr.withoutAll(all, seen).reduce((depsRemaining, node) => {
        depsRemaining[node] = lively.lang.arr.withoutAll(depGraph[node] || [], seen).length;
        return depsRemaining;
      }, {}),
          min = lively.lang.arr.withoutAll(all, seen).reduce((minNode, node) =>
            depsRemaining[node] <= depsRemaining[minNode] ?
              node : minNode);

      if (depsRemaining[min] === 0) {
        groups.push(Object.keys(depsRemaining).filter(key => depsRemaining[key] === 0));
      } else {
        groups.push([min]);
      }

      seen = groups.flatten()
    }

    return groups;
  },

  reduce: function(doFunc, graph, rootNode, carryOver, ignore, context) {
    // Starts with `rootNode` and visits all (in)directly related nodes, calling
    // `doFunc` at each node. The result of `doFunc` is passed as first
    // argument to the next iterator call. For the first call the value
    // `carryOver` is used.
    // Example:
    // var depGraph = {a: ["b", "c"],b: ["c"]}
    // graphReduce((_, ea, i) => console.log("%s %s", ea, i), depGraph, "a")

    var visitedNodes = ignore || [], index = 0;
    iterator(rootNode);
    return carryOver;

    function iterator(currentNode) {
      if (visitedNodes.indexOf(currentNode) > -1) return;
      carryOver = doFunc.call(context, carryOver, currentNode, index++);
      visitedNodes = visitedNodes.concat([currentNode]);
      var next = lively.lang.arr.withoutAll(graph[currentNode] || [], visitedNodes);
      next.forEach(ea => iterator(ea));
    }
  }

};

})(typeof require !== "undefined" && typeof exports !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
