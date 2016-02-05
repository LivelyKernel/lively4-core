/*global beforeEach, afterEach, describe, it*/

var isNodejs = typeof module !== 'undefined' && typeof require !== 'undefined';
var Global = typeof window !== 'undefined' ? window : global;
var expect =  Global.expect || require('expect.js');
var lively = Global.lively || {};
lively.lang = lively.lang || require('../index');

describe("usage", function() {

  describe('chaining', function() {

    function add1(x) { return x+1; }

    describe("for collections", function() {

      it("provides lively.lang array methods", function() {
        expect(lively.lang.chain(["a", "b", "c"])
          .map(add1)
          .invoke('toUpperCase')
          .value()).to.eql(["A1", "B1", "C1"]);
      });

    });

    describe("for objects", function() {

      it("provides lively.lang methods", function() {
        expect(lively.lang.chain({foo: 123})
          .keys()
          .map(add1)
          .value()).to.eql(["foo1"]);
      });

    });

    describe("for strings", function() {

      it("provides lively.lang methods", function() {
        expect(lively.lang.chain("%s %s")
          .format(1, 2)
          .value()).to.equal("1 2");
      });

    });

    describe("for numbers", function() {

      it("provides lively.lang methods", function() {
        expect(lively.lang.chain(Math.pow(2,12))
          .humanReadableByteSize().value()).to.equal("4KB");
      });

    });

    describe("for dates", function() {

      it("provides lively.lang methods", function() {
        expect(lively.lang.chain(new Date("Wed Oct 22 2014 23:43:50 GMT-0700 (PDT)"))
          .format("yy-dd HH:MM", true)
          .value()).to.equal("14-23 06:43");
      });

    });

    describe("for functions", function() {

      it("provides lively.lang methods", function() {
        expect(lively.lang.chain(function(a, b) { return a+b; })
          .curry(3)
          .value()(4)).to.equal(7);
      });

    });
  });

  describe("noConflict", function() {

    var lv ;
    beforeEach(function() { lv = lively; });

    afterEach(function() {
      if (isNodejs) lively = lv;
      else window.lively = lv;
    });

    it("removes lively.lang object but returns reference", function() {
      var Global = typeof window !== "undefined" ? window : global;
      var ref = lively.lang.noConflict();
      expect(typeof Global.lively).to.be("undefined");
      expect(ref).to.be(lv.lang);
    });

  });

  describe("install globally", function() {

    it("adds methods to global objects", function() {
      lively.lang.installGlobals();
      try {
        var d = new Date("Thu Oct 23 2014 10:29:55 GMT-0700 (PDT)");
        expect(d.format("yyyy")).to.be("2014");
        expect(("foo bar").startsWith("foo")).to.be(true);
      } finally { lively.lang.uninstallGlobals(); }
    });

    it("install aliases to global objects", function() {
      lively.lang.installGlobals();
      try {
        expect([1,2,3,4,5].select(function(n) { return n % 2 === 0})).to.eql([2,4]);
      } finally { lively.lang.uninstallGlobals(); }
    });

    it("creates new global objects", function() {
      lively.lang.installGlobals();
      expect(typeof Strings).to.be("object");
      expect(Strings.format("%s %s", 1, 2)).to.be("1 2");
      lively.lang.uninstallGlobals();
    });

    it("can be uninstalled from globals", function() {
      lively.lang.installGlobals();
      expect(typeof Strings).to.be("object");
      lively.lang.uninstallGlobals();
      expect(typeof Strings).to.be("undefined");
    });

  });

});
