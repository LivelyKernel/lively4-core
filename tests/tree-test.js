/*global beforeEach, afterEach, describe, it*/

var expect = this.expect ||  module.require('expect.js');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');

describe('tree', function() {

  var tree = lively.lang.tree;
  var testTree = {
    x: 1, children: [
      {x:2, children: [{x: 3, children: [{x:4}]}, {x: 5, children: [{x:6}]}]},
      {x: 7}]
  }

  function getChildren(n) { return n.children; }

  it('prewalks', function() {
    var log = []
    tree.prewalk(testTree, function(n) { log.push(n.x); }, getChildren);
    expect(log).to.eql([1,2,3,4,5,6,7]);
  });

  it('poswalks', function() {
    var log = []
    tree.postwalk(testTree, function(n) { log.push(n.x); }, getChildren);
    expect(log).to.eql([4,3,6,5,2,7,1]);
  });

  it('detects nodes', function() {
    var result = tree.detect(testTree,
      function(n) { return n.x === 5; },
      getChildren);
    expect(result).to.eql({x: 5, children: [{x:6}]});
  });

  it('filters nodes', function() {
    var result = tree.filter(testTree,
      function(n) { return n.x >= 5; },
      getChildren);
    expect(result).to.eql([{x: 5, children: [{x:6}]}, {x:6}, {x:7}]);
  });

  it('maps nodes', function() {
    var result = tree.map(testTree,
      function(n) { return n.x; },
      getChildren);
    expect(result).to.eql([1,2,3,4,5,6,7]);
  });

  it('maps trees', function() {
    var result = tree.mapTree(testTree,
      function(n, children) { return children.length ? [n.x, children] : n.x; },
      getChildren);
      console.log(lively.lang.string.print(result));
    expect(result).to.eql([1,[[2,[[3,[4]],[5,[6]]]],7]]);
  });

});
