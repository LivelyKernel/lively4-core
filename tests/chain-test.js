/*global beforeEach, afterEach, describe, it*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;


describe('chaining', function() {

  function add1(x) { return x+1; }

  describe("for collections", function() {

    it("provides lively.lang array methods", function() {
      expect(jsext.chain(["a", "b", "c"])
        .map(add1)
        .invoke('toUpperCase')
        .value()).to.eql(["A1", "B1", "C1"]);
    });

  });

  describe("for objects", function() {

    it("provides lively.lang methods", function() {
      expect(jsext.chain({foo: 123})
        .keys()
        .map(add1)
        .value()).to.eql(["foo1"]);
    });

  });

  describe("for strings", function() {

    it("provides lively.lang methods", function() {
      expect(jsext.chain("%s %s")
        .format(1, 2)
        .value()).to.equal("1 2");
    });

  });

  describe("for numbers", function() {

    it("provides lively.lang methods", function() {
      expect(jsext.chain(Math.pow(2,12))
        .humanReadableByteSize().value()).to.equal("4KB");
    });

  });

  describe("for dates", function() {

    it("provides lively.lang methods", function() {
      expect(jsext.chain(new Date("Wed Oct 22 2014 23:43:50 GMT-0700 (PDT)"))
        .format("yy-dd HH:MM", true)
        .value()).to.equal("14-23 06:43");
    });

  });

  describe("for functions", function() {

    it("provides lively.lang methods", function() {
      expect(jsext.chain(function(a, b) { return a+b; })
        .curry(3)
        .value()(4)).to.equal(7);
    });

  });
});
