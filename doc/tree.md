## lib/tree.js

Methods for traversing and transforming tree structures.


- [tree](#tree)
  - [detect](#tree-detect)
  - [filter](#tree-filter)
  - [map](#tree-map)
  - [mapTree](#tree-mapTree)

#### <a name="tree-detect"></a>tree.detect(treeNode, testFunc, childGetter)

 Traverses a `treeNode` recursively and returns the first node for which
 `testFunc` returns true. `childGetter` is a function to retrieve the
 children from a node.

#### <a name="tree-filter"></a>tree.filter(treeNode, testFunc, childGetter)

 Traverses a `treeNode` recursively and returns all nodes for which
 `testFunc` returns true. `childGetter` is a function to retrieve the
 children from a node.

#### <a name="tree-map"></a>tree.map(treeNode, mapFunc, childGetter)

 Traverses a `treeNode` recursively and call `mapFunc` on each node. The
 return values of all mapFunc calls is the result. `childGetter` is a
 function to retrieve the children from a node.

#### <a name="tree-mapTree"></a>tree.mapTree(treeNode, mapFunc, childGetter)

 Traverses the tree and creates a structurally identical tree but with
 mapped nodes