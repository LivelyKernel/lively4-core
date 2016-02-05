/*global beforeEach, afterEach, describe, it*/

var Global = typeof window !== 'undefined' ? window : global;
var expect = Global.expect ||  require('expect.js');
var lively = Global.lively || {}; lively.lang = lively.lang || require('../index');

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
