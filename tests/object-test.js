/*global beforeEach, afterEach, describe, it*/

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

});

describe('properties', function() {

});

// TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectTest',
// 'testing', {
//     testExtendSetsDisplayName: function() {
//         var obj = {};
//         Object.extend(obj, {foo: function() {return "bar"}})
//         this.assertEquals(obj.foo.displayName, "foo")
//     },

//     testExtendDoesNotOverrideExistingName: function() {
//         var obj = {};
//         Object.extend(obj, {foo: function myFoo() {return "bar"}})
//         this.assertEquals(obj.foo.name, "myFoo", "name changed")
//         this.assert(!obj.foo.displayName, "displayName is set")
//     },

//     testExtendDoesNotOverrideExistingDisplayName: function() {
//         var obj = {};
//         var f = function() {return "bar"};
//         f.displayName = "myDisplayFoo"
//         Object.extend(obj, {foo: f})
//         this.assertEquals(obj.foo.name, "", "function has a name")
//         this.assertEquals(obj.foo.displayName, "myDisplayFoo", "displayName was overridden")
//     },

//     testExtendDoesSourceModule: function() {
//         var obj = {};
//         var f = function() {return "bar"};
//         f.displayName = "myDisplayFoo"
//         Object.extend(obj, {foo: f})
//         this.assert(obj.foo.sourceModule, "source module not set")
//     },
//     testIsEmpty: function() {
//         var obj1 = {}, obj2 = {a:3}, obj3 = Object.create(obj2);
//         this.assertEquals(Object.isEmpty(obj1), true);
//         this.assertEquals(Object.isEmpty(obj2), false);
//         this.assertEquals(Object.isEmpty(obj3), true);
//     },
//     testDeepCopy: function() {
//         var obj = {a: 3, b: {c: [{}],d: undefined}, e: null, f: function(){}, g: "string"};
//         var copy = Object.deepCopy(obj);
//         this.assertMatches(obj, copy);
//         this.assertMatches(copy, obj);
//         this.assert(obj !== copy);
//         this.assert(obj.b !== copy.b);
//         this.assert(obj.b.c !== copy.b.c);
//         this.assert(obj.b.c[0] !== copy.b.c[0]);
//     }
// });

// TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectsTest',
// 'testing', {
//     testTypeStringOf: function() {
//         this.assertEquals(Objects.typeStringOf('some string'), 'String');
//         this.assertEquals(Objects.typeStringOf(0), 'Number');
//         this.assertEquals(Objects.typeStringOf(null), 'null');
//         this.assertEquals(Objects.typeStringOf(undefined), 'undefined');
//         this.assertEquals(Objects.typeStringOf([]), 'Array');
//         this.assertEquals(Objects.typeStringOf({a: 2}), 'Object');
//         this.assertEquals(Objects.typeStringOf(new lively.morphic.Morph()), 'Morph');
//     },
//     testShortPrintStringOf: function() {
//         this.assertEquals(Objects.shortPrintStringOf([1,2]), '[...]', 'filled arrays should be displayed as [...]');
//         this.assertEquals(Objects.shortPrintStringOf([]), '[]', 'empty arrays should be displayed as []');
//         this.assertEquals(Objects.shortPrintStringOf(0), '0', 'numbers should be displayed as values');
//         this.assertEquals(Objects.shortPrintStringOf(new lively.morphic.Morph()), 'Morph', 'short typestring of a morph is still Morph');
//     },
//     testIsMutableType: function() {
//         this.assert(Objects.isMutableType([1,2]), 'arrays are mutable');
//         this.assert(Objects.isMutableType({}), 'empty objects are mutable');
//         this.assert(Objects.isMutableType(new lively.morphic.Morph()), 'complex objects are mutable');
//         this.assert(!Objects.isMutableType(2), 'numbers are immutable');
//     },
//     testSafeToString: function() {
//         this.assertEquals(Objects.safeToString(null), 'null');
//         this.assertEquals(Objects.safeToString(undefined), 'undefined');
//         this.assertEquals(Objects.safeToString(2), '2');
//     }
// });

// TestCase.subclass('lively.lang.tests.ExtensionTests.PropertiesTest',
// 'running', {
//     setUp: function() {
//         var Foo = function() {
//             this.a = 1;
//             this.aa = 1;
//             this.b = Functions.True;
//         };
//         Foo.prototype.c = 2;
//         Foo.prototype.cc = 2;
//         Foo.prototype.d = Functions.False;
//         this.sut = new Foo();
//     }
// },
// 'testing', {
//     testAll: function() {
//         var expected, result;
//         expected = ["a", "c"];
//         result = Properties.all(this.sut, function (name, object) {
//             return name.length == 1;
//         });
//         this.assertMatches(expected, result);
//         expected = ["aa", "cc"];
//         result = Properties.all(this.sut, function (name, object) {
//             return name.length == 2;
//         });
//         this.assertMatches(expected, result);
//     },
//     testOwn: function() {
//         var expected = ["a", "aa"];
//         var result = Properties.own(this.sut);
//         this.assertMatches(expected, result);
//     },
//     testAllProperties: function() {
//         var expected, result;
//         expected = ["a", "b", "c", "d"];
//         result = Properties.allProperties(this.sut, function (object, name) {
//             return name.length == 1;
//         });
//         this.assertMatches(expected, result);
//         expected = ["aa", "cc"];
//         result = Properties.allProperties(this.sut, function (object, name) {
//             return name.length == 2;
//         });
//         this.assertMatches(expected, result);
//     }
// });

// TestCase.subclass('lively.lang.tests.ExtensionTests.PropertyPath',
// // todo:
// // - listen? wrap? watch?
// 'testing', {
//     testParsePath: function() {
//         this.assertEquals([], lively.PropertyPath(undefined).parts());
//         this.assertEquals([], lively.PropertyPath('').parts());
//         this.assertEquals([], lively.PropertyPath('.').parts());
//         this.assertEquals(['foo'], lively.PropertyPath('foo').parts());
//         this.assertEquals(['foo', 'bar'], lively.PropertyPath('foo.bar').parts());
//     },
//     testPathAccesor: function() {
//         var obj = {foo: {bar: 42}, baz: {zork: {'x y z z y': 23}}};
//         this.assertEquals(obj, lively.PropertyPath('').get(obj));
//         this.assertEquals(42, lively.PropertyPath('foo.bar').get(obj));
//         this.assertEquals(obj.baz.zork, lively.PropertyPath('baz.zork').get(obj));
//         this.assertEquals(23, lively.PropertyPath('baz.zork.x y z z y').get(obj));
//         this.assertEquals(undefined, lively.PropertyPath('non.ex.is.tan.t').get(obj));
//     },
//     testPathIncludes: function() {
//         var base = lively.PropertyPath('foo.bar');
//         this.assert(base.isParentPathOf('foo.bar'), 'equal paths should be "parents"');
//         this.assert(base.isParentPathOf(base), 'equal paths should be "parents" 2');
//         this.assert(base.isParentPathOf('foo.bar.baz'), 'foo.bar.baz');
//         this.assert(!base.isParentPathOf('foo.baz'), 'foo.baz');
//         this.assert(!base.isParentPathOf('.'), '.');
//         this.assert(!base.isParentPathOf(''), 'empty string');
//         this.assert(!base.isParentPathOf(), 'undefined');
//     },
//     testRelativePath: function() {
//         var base = lively.PropertyPath('foo.bar');
//         this.assertEquals([], base.relativePathTo('foo.bar').parts(), 'foo.bar');
//         this.assertEquals(['baz', 'zork'], base.relativePathTo('foo.bar.baz.zork').parts(), 'foo.bar.baz.zork');
//     },
//     testConcat: function() {
//         var p1 = lively.PropertyPath('foo.bar'),
//             p2 = lively.PropertyPath('baz.zork');
//         this.assertEquals('baz.zork.foo.bar', p2.concat(p1));
//         this.assertEquals('foo.bar.baz.zork', p1.concat(p2));
//     },
//     testSet: function() {
//         var obj = {foo:[{},{bar:{}}]}, p = lively.PropertyPath('foo.1.bar.baz');
//         p.set(obj, 3);
//         this.assertEquals(3, obj.foo[1].bar.baz);
//     },
//     testEnsure: function() {
//         var obj = {}, p = lively.PropertyPath('foo.bar.baz');
//         p.set(obj, 3, true);
//         this.assertEquals(3, obj.foo.bar.baz);
//     },
//     testSplitter: function() {
//         var obj = {}, p = lively.PropertyPath('foo/bar/baz', '/');
//         p.set(obj, 3, true);
//         this.assertEquals(3, obj.foo.bar.baz);
//     },
//     testParentPathOf: function() {
//         var pp = lively.PropertyPath,
//             p1 = pp("a.b")
//         this.assert(p1.isParentPathOf(p1));
//         this.assert(pp("a").isParentPathOf(p1))
//         this.assert(pp("").isParentPathOf(pp("")))
//         this.assert(!p1.isParentPathOf(pp("a")))
//         this.assert(!p1.isParentPathOf(pp("b.a")))
//     }
// });
