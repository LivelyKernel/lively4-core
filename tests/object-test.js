/*global beforeEach, afterEach, describe, it*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;

var obj = jsext.obj;

describe('object', function() {

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
