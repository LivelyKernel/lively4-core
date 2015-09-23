/*global beforeEach, afterEach, describe, it*/

var expect = this.expect ||  module.require('expect.js');
var lively = this.lively || {}; lively.lang = lively.lang || module.require('../index');

describe('seq', function() {

  var arr = lively.lang.arr;
  var seq = lively.lang.seq;

  it('take', function() {
    expect(
      lively.lang.seq.take(
        function*() { var x =0; while(true) yield x++; }, 10)
    ).eql(arr.range(0,9));
  });

});
