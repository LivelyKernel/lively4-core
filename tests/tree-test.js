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

  it('detects nodes', function() {
    var result = tree.detect(testTree,
      function(n) { return n.x === 5; },
      function(n) { return n.children; });
    expect(result).to.eql({x: 5, children: [{x:6}]});
  });

  it('filters nodes', function() {
    var result = tree.filter(testTree,
      function(n) { return n.x >= 5; },
      function(n) { return n.children; });
    expect(result).to.eql([{x: 5, children: [{x:6}]}, {x:6}, {x:7}]);
  });

  it('maps nodes', function() {
    var result = tree.map(testTree,
      function(n) { return n.x; },
      function(n) { return n.children; });
    expect(result).to.eql([1,2,3,4,5,6,7]);
  });

});
