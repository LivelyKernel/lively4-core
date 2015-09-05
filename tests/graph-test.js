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
      expect(graph.hull(testGraph, "d")).to.eql(["c", "f"])
    });

  });
});
