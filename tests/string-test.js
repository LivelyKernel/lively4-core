/*global beforeEach, afterEach, describe, it*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;


describe('string', function() {

  var string = jsext.string;

  it("tableize", function() {
    expect([["a", "b", "c"], ["d", "e", "f"]]).to.eql(string.tableize('a b c\nd e f'));
    expect([["a", 1, "c"], ["d", 2, "f"]]).to.eql(string.tableize('a 1 c\nd 2 f'));
    expect([["Date"], [new Date('06/11/2013')]]).to.eql(string.tableize('Date\n06/11/2013'));
  });

  it("lineLookupByIndex", function() {
    var s = 'test\n123\nfo\nbarbaz\nzork\n';
    var lookupFunc = string.lineIndexComputer(s);
    expect(0).to.equal(lookupFunc(0),"char pos: 0");
    expect(0).to.equal(lookupFunc(1),"char pos: 1");
    expect(0).to.equal(lookupFunc(4),"char pos: 4");
    expect(1).to.equal(lookupFunc(5),"char pos: 5");
    expect(1).to.equal(lookupFunc(7),"char pos: 7");
    expect(1).to.equal(lookupFunc(8),"char pos: 8");
    expect(2).to.equal(lookupFunc(9),"char pos: 9");
    expect(4).to.equal(lookupFunc(23),"char pos: 2");
    expect(5).to.equal(lookupFunc(24),"char pos: 2");
    expect(-1).to.equal(lookupFunc(99),"char pos: 9");
  });

  it("findParagraphs", function() {
    var tests = [
      {string: 'foo', expected: ['foo']},
      {string: 'foo\nbar', expected: ['foo\nbar']},
      {string: 'foo\n\nbar', expected: ['foo', 'bar']},
      {string: 'foo\n\n\n\nbar', expected: ['foo', 'bar']},
      {string: 'a\n\n\n\nb\nc', expected: ['a', '\n\n', 'b\nc'], options: {keepEmptyLines: true}}
    ];
    tests.forEach(function(test) {
      expect(test.expected).to.eql(string.paragraphs(test.string, test.options));
    });
  });

  it("printTree", function() {
    var tree = tree = {
      string: "root",
      children: [{
        string: "a",
        children: [{
          string: "b",
          children: [{string: "c"},{string: "d"}]
        }],
      },{
        string: "e",
        children: [{
          string: "f",
          children: [{ string: "g" },{ string: "h" }]
        }]
      }]
    };
    var expected = "root\n"
                 + "|---a\n"
                 + "|   \\---b\n"
                 + "|       |---c\n"
                 + "|       \\---d\n"
                 + "\\---e\n"
                 + "    \\---f\n"
                 + "        |---g\n"
                 + "        \\---h";
    var actual = string.printTree(tree,
        function(n) { return n.string; },
        function(n) { return n.children; }, '    ');
    expect(expected).to.equal(actual);
  });

  it("stringMatch", function() {
    var sucesses = [
      {string: "foo bar", pattern: "foo bar"},
      {string: "foo   bar", pattern: "foo bar", normalizeWhiteSpace: true},
      {string: "foo bar", pattern: "foo __/bar/__"},
      {string: "foo bar 123 baz", pattern: "foo bar __/[0-9]+/__ baz"},
      {string: "  foo\n   123\n bla", pattern: "foo\n __/[0-9]+/__\n     bla", ignoreIndent: true}];
    sucesses.forEach(function(ea) {
      debugger;
      var match = string.stringMatch(
        ea.string, ea.pattern,
        {normalizeWhiteSpace: ea.normalizeWhiteSpace, ignoreIndent: ea.ignoreIndent});
      if (!match.matched) expect().fail('stringMatch not matching:\n' + ea.string
        + '\nwith:\n'+ ea.pattern
        + '\nbecause:\n ' + JSON.stringify(match))
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    var failures = [
      {string: "foo bar 12x baz", pattern: "foo bar __/[0-9]+/__ baz"}];
    failures.forEach(function(ea) {
      var match = string.stringMatch(
        ea.string, ea.pattern,
        {normalizeWhiteSpace: ea.normalizeWhiteSpace});
      if (match.matched) expect().fail(
        'stringMatch unexpectedly matched:\n' + ea.string
        + '\nwith:\n'+ ea.pattern
        + '\nbecause:\n ' + JSON.stringify(match));
    });
  });

  it("reMatches", function() {
    var s = 'abc def abc xyz';
    var expected = [{start: 4, end: 11, match: "def abc"}];
    expect(expected).to.eql(string.reMatches(s, /def\s[^\s]+/));
  });

});
