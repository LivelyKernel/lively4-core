/*global mocha, beforeEach, afterEach, describe, it*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;

var obj = jsext.obj;

describe('obj', function() {

  var obj1 = {
    foo: 23, bar: [2, {x: "'test'"}],
    get baz() { return "--baz getter--"; },
    method: function(arg1, arg2) { return arg1 + arg2; },
  }

  var obj2 = {
    foo: 24,
    zork: "test",
    method2: function(arg) { return arg + 1; },
  }

  obj1.__proto__ = obj2;

  describe('type testing', function() {

    it("isElement", function() {
      if (typeof document === "undefined") return;
      var el = document.createElement("div");
      expect(obj.isElement(el)).to.be(true);
      expect(obj.isElement({})).to.be(false);
    });

    it("isArray", function() {
      expect(obj.isArray([1,2,3])).to.be(true);  
      expect(obj.isArray([])).to.be(true);  
      expect(obj.isArray({})).to.be(false);
    });

    it("isFunction", function() {
      expect(obj.isFunction(function() {})).to.be(true);
      expect(obj.isFunction({})).to.be(false);
    });

    it("isBoolean", function() {
      expect(obj.isBoolean(false)).to.be(true);
      expect(obj.isBoolean({})).to.be(false);
    });

    it("isString", function() {
      expect(obj.isString("bla bla")).to.be(true);
      expect(obj.isString({})).to.be(false);
    });

    it("isNumber", function() {
      expect(obj.isNumber(23)).to.be(true);
      expect(obj.isNumber({})).to.be(false);
    });

    it("isUndefined", function() {
      expect(obj.isUndefined(undefined)).to.be(true);
      expect(obj.isUndefined(null)).to.be(false);
      expect(obj.isUndefined("")).to.be(false);
      expect(obj.isUndefined({})).to.be(false);
    });

    it("isRegExp", function() {
      expect(obj.isRegExp(/fooo/)).to.be(true);
      expect(obj.isRegExp({})).to.be(false);
      expect(obj.isRegExp(function() {})).to.be(false);
    });

    it("isObject", function() {
      expect(obj.isObject({})).to.be(true);
      expect(obj.isObject("foo")).to.be(false);
      expect(obj.isObject(/123/)).to.be(true);
      expect(obj.isObject([])).to.be(true);
      expect(obj.isObject(function() {})).to.be(false);
    });

    it("isEmpty", function() {
      expect(obj.isEmpty({})).to.be(true);
      expect(obj.isEmpty({fOO: 23})).to.be(false);
      expect(obj.isEmpty(Object.create(obj1))).to.be(true);
    });

  });

  describe('accessing', function() {
    it('enumerates keys', function() {
      expect(obj.keys(obj1)).to.eql(['foo', 'bar', 'baz', 'method']);
    });

    it('enumerates values', function() {
      expect(obj.values(obj1)).to.eql([obj1.foo, obj1.bar, obj1.baz, obj1.method]);
    });
  });

  describe('extend', function() {
    
    it("adds and overwrites properties", function() {
      var o = {baz: 99, bar: 66};
      var extended = obj.extend(o, {foo: 23, bar: {x: 3}});
      expect(extended).to.be(o, "identity issue");
      expect(extended).to.eql({baz: 99, foo: 23, bar: {x: 3}});
    });

    it("is getter/setter aware", function() {
      var o = obj.extend({}, {
        get foo() { return this._foo; },
        set foo(v) { return this._foo = v + 1; }
      });
      o.foo = 3;
      expect(o.foo).to.be(4);
    });

    it("sets display name", function() {
      var o = obj.extend({}, {foo: function() { return "bar"; }});
      expect(o.foo.displayName).to.be("foo");
    });

    it("does not override existing function names", function() {
      var o = obj.extend({}, {foo: function myFoo() { return "bar"; }});
      expect(o.foo.name).to.be("myFoo");
      expect(o.foo).to.not.have.property("displayName");
    });

    describe("when lively present", function() {

      var Global = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this;
      mocha.globals(["lively"]);

      beforeEach(function() {
        Global.lively = {Module: {current: function() { return "bar"; }}};
      });

      afterEach(function() {
        delete Global.lively;
        mocha.options.globals.pop();
      });

      it("adds a sourceModule field", function() {
        var o = obj.extend(obj, {foo: function() { return "bar"; }});
        expect(o.foo).to.have.property("sourceModule");
      });
    });


  });

  describe("inspect", function() {
    it("prints object representation", function() {
      expect(obj.inspect(obj1)).to.be(
           "{\n"
         + "  bar: [2,{\n"
         + "    x: \"'test'\"\n"
         + "  }],\n"
         + "  baz: \"--baz getter--\",\n"
         + "  foo: 23,\n"
         + "  method: function(arg1,arg2) {/*...*/}\n"
         + "}");
    });

    it("observes maxDepth when printing", function() {
      expect(obj.inspect(obj1, {maxDepth: 1})).to.be(
           "{\n"
         + "  bar: [/*...*/],\n"
         + "  baz: \"--baz getter--\",\n"
         + "  foo: 23,\n"
         + "  method: function(arg1,arg2) {/*...*/}\n"
         + "}");
    });
  });

  describe("merge", function() {

    it("merges objects", function() {
      var obj1 = {foo: 23, bar: [2, {x: "'test'"}]};
      var obj2 = {foo: 24, zork: "test"};
      var merged = obj.merge(obj1, obj2);
      expect(merged.foo).to.be(24);
      expect(obj1.foo).to.be(23);
      expect(obj2.foo).to.be(24);
      expect(merged).to.have.property("bar");
      expect(merged).to.have.property("zork");
    });

    it("merges arrays", function() {
      expect(obj.merge([1,2], [6,7])).to.eql([1,2,6,7]);
    });

    it("merges hierarchies", function() {
      // mergePropertyInHierarchy
      expect(false).to.be(true);
    });

    it("can read values in hierarchies", function() {
      // valuesInPropertyHierarchy
      expect(false).to.be(true);
    });

    it("can merge values in hierarchies", function() {
      // mergePropertyInHierarchy
      expect(false).to.be(true);
    });

  });

  describe("inherit", function() {

    it("sets prototype pointer", function() {
      // ...
      expect(false).to.be(true);
    });

  });

  describe("cloning and copying", function() {

    it("clones objects", function() {
      var clone = obj.clone(obj1);
      clone.foo = 24;
      clone.oink = "!";
      expect(clone.foo).to.be(24);
      expect(obj1.foo).to.be(23);
      expect(clone.oink).to.be("!");
      expect(obj1).to.not.have.property("oink");
    });

    it("clones arrays", function() {
      var arr1 = [1,2,3], arr2 = obj.clone(arr1);
      arr1.push(4);
      arr2.push(5);
      expect(arr1).to.eql([1,2,3,4]);
      expect(arr2).to.eql([1,2,3,5]);
    });

    it("can deep copy", function() {
      var o = {a: 3, b: {c: [{}],d: undefined}, e: null, f: function(){}, g: "string"};
      var copy = obj.deepCopy(obj);
      expect(obj).to.eql(copy);
      expect(copy).to.eql(obj);
      expect(obj).to.not.equal(copy);
      expect(obj.b).to.not.equal(copy.b);
      expect(obj.b.c).to.not.equal(copy.b.c);
      expect(obj.b.c[0]).to.not.equal(copy.b.c[0]);

    });

    it("can proto copy", function() {
      // ...
      // protoCopy
      expect(false).to.be(true);
    });

  });

  describe("stringify types", function() {

    it("typeStringOf", function() {
      expect(obj.typeStringOf('some string')).to.be('String');
      expect(obj.typeStringOf(0)).to.be('Number');
      expect(obj.typeStringOf(null)).to.be('null');
      expect(obj.typeStringOf(undefined)).to.be('undefined');
      expect(obj.typeStringOf([])).to.be('Array');
      expect(obj.typeStringOf({a: 2})).to.be('Object');
      expect(obj.typeStringOf(new lively.morphic.Morph())).to.be('Morph');
    });

    it("shortPrintStringOf", function() {
      expect(obj.shortPrintStringOf([1,2])).to.equal( '[...]', 'filled arrays should be displayed as [...]');
      expect(obj.shortPrintStringOf([])).to.equal( '[]', 'empty arrays should be displayed as []');
      expect(obj.shortPrintStringOf(0)).to.equal( '0', 'numbers should be displayed as values');
      expect(obj.shortPrintStringOf(new lively.morphic.Morph())).to.equal( 'Morph', 'short typestring of a morph is still Morph');
    });

    it("isMutableType", function() {
      expect(obj.isMutableType([1,2])).to.be(true,'arrays are mutable');
      expect(obj.isMutableType({})).to.be(true,'empty objects are mutable');
      expect(obj.isMutableType(new lively.morphic.Morph()).to.be(true), 'complex objects are mutable');
      expect(obj.isMutableType(2)).to.be(false,'numbers are immutable');
    });

    it("safeToString", function() {
      expect(obj.safeToString(null)).to.be('null');
      expect(obj.safeToString(undefined)).to.be('undefined');
      expect(obj.safeToString(2)).to.be('2');
    });
  });

});

describe('properties', function() {

  beforeEach(function() {
    var Foo = function() {
      this.a = 1;
      this.aa = 1;
      this.b = Functions.True;
    };
    Foo.prototype.c = 2;
    Foo.prototype.cc = 2;
    Foo.prototype.d = Functions.False;
    this.sut = new Foo();
  });

  it("can access all properties", function() {
    var expected, result;
    expected = ["a", "c"];
    result = Properties.all(this.sut, function (name, object) {
      return name.length == 1;
    });
    this.assertMatches(expected, result);
    expected = ["aa", "cc"];
    result = Properties.all(this.sut, function (name, object) {
      return name.length == 2;
    });
    this.assertMatches(expected, result);
  });

  it("can access own properties", function() {
    var expected = ["a", "aa"];
    var result = Properties.own(this.sut);
    this.assertMatches(expected, result);
  });

  it("allProperties again", function() {
    var expected, result;
    expected = ["a", "b", "c", "d"];
    result = Properties.allProperties(this.sut, function (object, name) {
      return name.length == 1;
    });
    this.assertMatches(expected, result);
    expected = ["aa", "cc"];
    result = Properties.allProperties(this.sut, function (object, name) {
      return name.length == 2;
    });
    this.assertMatches(expected, result);
  });

});


describe('properties', function() {

  it("parsePath", function() {
    expect([]).to.equal(lively.PropertyPath(undefined).parts());
    expect([]).to.equal(lively.PropertyPath('').parts());
    expect([]).to.equal(lively.PropertyPath('.').parts());
    expect(['foo']).to.equal(lively.PropertyPath('foo').parts());
    expect(['foo', 'bar']).to.equal(lively.PropertyPath('foo.bar').parts());
  });
  
  it("pathAccesor", function() {
    var obj = {foo: {bar: 42}, baz: {zork: {'x y z z y': 23}}};
    expect(obj).to.equal(lively.PropertyPath('').get(obj));
    expect(42).to.equal(lively.PropertyPath('foo.bar').get(obj));
    expect(obj.baz.zork).to.equal(lively.PropertyPath('baz.zork').get(obj));
    expect(23).to.equal(lively.PropertyPath('baz.zork.x y z z y').get(obj));
    expect(undefined).to.equal(lively.PropertyPath('non.ex.is.tan.t').get(obj));
  });
  
  it("pathIncludes", function() {
    var base = lively.PropertyPath('foo.bar');
    expect(base.isParentPathOf('foo.bar')).to.be(true); // 'equal paths should be "parents"'
    expect(base.isParentPathOf(base)).to.be(true); // 'equal paths should be "parents" 2'
    expect(base.isParentPathOf('foo.bar.baz')).to.be(true); // 'foo.bar.baz'
    expect(base.isParentPathOf('foo.baz')).to.be(false); // 'foo.baz'
    expect(base.isParentPathOf('.')).to.be(false); // '.'
    expect(base.isParentPathOf('')).to.be(false); // 'empty string'
    expect(base.isParentPathOf()).to.be(false); // 'undefined'
  });
  
  it("relativePath", function() {
    var base = lively.PropertyPath('foo.bar');
    expect([]).to.equal(base.relativePathTo('foo.bar').parts(), 'foo.bar');
    expect(['baz', 'zork']).to.equal(base.relativePathTo('foo.bar.baz.zork').parts(), 'foo.bar.baz.zork');
  });
  
  it("concat", function() {
    var p1 = lively.PropertyPath('foo.bar'),
      p2 = lively.PropertyPath('baz.zork');
    expect('baz.zork.foo.bar').to.equal(p2.concat(p1));
    expect('foo.bar.baz.zork').to.equal(p1.concat(p2));
  });
  
  it("set", function() {
    var obj = {foo:[{},{bar:{}}]}, p = lively.PropertyPath('foo.1.bar.baz');
    p.set(obj, 3);
    expect(3).to.equal(obj.foo[1].bar.baz);
  });
  
  it("ensure", function() {
    var obj = {}, p = lively.PropertyPath('foo.bar.baz');
    p.set(obj, 3, true);
    expect(3).to.equal(obj.foo.bar.baz);
  });
  
  it("splitter", function() {
    var obj = {}, p = lively.PropertyPath('foo/bar/baz', '/');
    p.set(obj, 3, true);
    expect(3).to.equal(obj.foo.bar.baz);
  });
  
  it("parentPathOf", function() {
    var pp = lively.PropertyPath,
        p1 = pp("a.b");
    expect(p1.isParentPathOf(p1)).to.be(true);
    expect(pp("a").isParentPathOf(p1)).to.be(true);
    expect(pp("").isParentPathOf(pp(""))).to.be(true);
    expect(!p1.isParentPathOf(pp("a"))).to.be(false);
    expect(!p1.isParentPathOf(pp("b.a"))).to.be(false);
  });

});
