/*global beforeEach, afterEach, describe, it*/

var isNodejs = typeof module !== 'undefined' && module.require;
var Global = isNodejs ? global : window;
var expect = this.expect || module.require('expect.js');
var mocha = this.mocha || module.require('mocha');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');

var graph = lively.lang.graph;

describe('graph', function() {

  var testGraph = {
    "a": ["b", "c"],
    "b": ["c", "d", "e", "f"],
    "d": ["c", "f"],
    "e": ["a", "f"],
    "f": []
  }

  describe('hull', function() {

    it("can be computed", function() {
      expect(graph.hull(testGraph, "d")).to.eql(["c", "f"]);
      expect(graph.hull(testGraph, "e")).to.eql(['a', 'f', 'b', 'c', 'd', 'e']);
      expect(graph.hull(testGraph, "e", ["b"])).to.eql(["a", "f", "c"]);
      expect(graph.hull(testGraph, "e", [], 2)).to.eql(['a', 'f', 'b', 'c']);
    });

    it("reachable subgraph", function() {
      expect(graph.subgraphReachableBy(testGraph, "d", []))
        .to.eql({"d": ["c", "f"], "c": [], "f": []});
      expect(graph.subgraphReachableBy(testGraph, "e", [], 2))
        .to.eql({e: [ 'a', 'f' ], a: [ 'b', 'c' ], f: []});
      expect(graph.subgraphReachableBy(testGraph, "e", ["a"], 2))
        .to.eql({e: ['f' ], f: []});
    });

  });
});
