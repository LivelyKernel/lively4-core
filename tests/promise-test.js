/*global beforeEach, afterEach, describe, it*/

var Global = typeof window !== 'undefined' ? window : global,
    expect = Global.expect ||  require('expect.js'),
    lively = Global.lively || {}; lively.lang = lively.lang || require('../index');

describe('promise', () => {

  var p = lively.lang.promise;

  describe("cb convertions", () => {
    
    it("resolves", () => 
      p.convertCallbackFun(function(a, b, thenDo) { thenDo(null, a + b); })(2,3)
        .then(result => expect(result).to.equal(5)));

    it("rejects", () => 
      p.convertCallbackFun(function(a, b, thenDo) { thenDo(new Error("Foo"), a + b); })(2,3)
        .then(result => expect().fail("should end in catch"))
        .catch(err => expect(err).to.match(/error.*foo/i)));

    it("rejects when cb throws", () => 
      p.convertCallbackFun(function(a, b, thenDo) { throw(new Error("Foo")); })(2,3)
        .then(result => expect().fail("should end in catch"))
        .catch(err => expect(err).to.match(/error.*foo/i)));

    it("deals with n args", () => 
      p.convertCallbackFunWithManyArgs(function(a, b, thenDo) { thenDo(null, b, a); })(2,3)
        .then(result => expect(result).to.eql([3, 2])));

  });

  describe("promise creation", () => {
    it("creates promise and resolve function", () => {
      var deferred = p.deferred();
      setTimeout(deferred.resolve, 100, 23);
      return deferred.promise.then(val => expect(val).to.equal(23));
    });

    it("creates promise and reject function", () => {
      var deferred = p.deferred();
      setTimeout(deferred.reject, 100, new Error("Foo"));
      return deferred.promise.catch(err => expect(err).to.match(/Foo/i));
    });
  });
});
