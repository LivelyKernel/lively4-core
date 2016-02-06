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
  
  describe("chain", () => {

    it("runs promises consecutively", () => {
      var order = [], prevResults = [];
      return lively.lang.promise.chain([
        (prevResult, state) => { state.first = 1; order.push(1); prevResults.push(prevResult); return new Promise(resolve => setTimeout(() => resolve(1), 100)); },
        (prevResult, state) => { state.second = 2; order.push(2); prevResults.push(prevResult); return new Promise(resolve => setTimeout(() => resolve(2), 10)); },
        (prevResult, state) => { state.third = 3; order.push(3); prevResults.push(prevResult); return new Promise(resolve => setTimeout(() => resolve(state), 50)); },
      ]).then(result => {
        expect(order).to.eql([1,2,3]);
        expect(result).to.eql({first: 1, second: 2, third: 3});
        expect(prevResults).to.eql([undefined, 1,2]);
      });
    });

    it("deals with errors in chain funcs", () =>
      lively.lang.promise.chain([
        () => new Promise(resolve => setTimeout(() => resolve(1), 10)),
        () => { throw new Error("Foo"); }
      ]).catch(err => expect(err).to.match(/Foo/i)));

    it("deals with rejections", () =>
      lively.lang.promise.chain([
        () => Promise.reject(new Error("Bar")),
        () => { throw new Error("Foo"); }
      ]).catch(err => expect(err).to.match(/Bar/i)));

    it("chain function results are coerced into promises", () =>
      lively.lang.promise.chain([() => 23, (val) => 23+2])
        .then(results => expect(results).to.equal(25)));

  });

});
