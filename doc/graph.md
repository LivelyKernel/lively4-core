## lib/graph.js

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


- [graph](#graph)
  - [hull](#graph-hull)
  - [subgraphReachableBy](#graph-subgraphReachableBy)

### <a name="graph"></a>graph



#### <a name="graph-hull"></a>graph.hull(graphMap, id, ignore, maxDepth)

 Takes a graph in object format and a start id and then traverses the
 graph and gathers all nodes that can be reached from that start id.
 Returns a list of those nodes.
 Optionally use `ignore` list to filter out certain nodes that shouldn't
 be considered and maxDepth to stop early. By default a maxDepth of 20 is
 used.
 

```js
var testGraph = {
"a": ["b", "c"],
"b": ["c", "d", "e", "f"],
"d": ["c", "f"],
"e": ["a", "f"],
"f": []
}
graph.hull(testGraph, "d") // => ["c", "f"]
graph.hull(testGraph, "e") // => ['a', 'f', 'b', 'c', 'd', 'e']
graph.hull(testGraph, "e", ["b"]) // =? ["a", "f", "c"]
```

#### <a name="graph-subgraphReachableBy"></a>graph.subgraphReachableBy(graphMap, id, ignore, maxDepth)

Like hull but returns subgraph map of `graphMap`
 

```js
graph.subgraphReachableBy(testGraph, "e", [], 2);
// => {e: [ 'a', 'f' ], a: [ 'b', 'c' ], f: []}
```