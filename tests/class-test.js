/*global beforeEach, afterEach, describe, it*/

var isNodejs = typeof module !== 'undefined' && typeof require !== 'undefined';
var Global = typeof window !== 'undefined' ? window : global;
var expect = Global.expect || require('expect.js');
var mocha = Global.mocha || require('mocha');

var lively = Global.lively || {};
lively.lang = lively.lang || require('../index');

var clazz = lively.lang.class;

var tests = describe('class', function() {

  if (!isNodejs) mocha.globals(["TestClass","Dummy1","Dummy2","Dummy23", "foo", "A", "B"]);

  it("creates a named class", function() {
    var Class = clazz.create("TestClass", {
      x: 23,
      foo: function() { return this.x + this.y; }
    });
    var instance = new Class();
    instance.y = 2;
    expect(instance.foo()).to.equal(25);
    expect(Class.prototype).to.not.have.property("y");
  });

  it("creates a class in a namespace", function() {
    Global.foo = {bar: {}};
    clazz.create("foo.bar.TestClass", {foo: function() { return 23; }});
    var instance = new Global.foo.bar.TestClass();
    expect(instance.foo()).to.equal(23);
  });

  describe("inheritance", function() {

    var TestKlass = lively.lang.class.create("TestKlass");
    // lively.lang.class.remove(TestKlass);
    // lively.lang.class.remove(Dummy1);

  	it("isSuperclass", function() {
  		lively.lang.class.create(TestKlass, 'Dummy1', {});
  		expect(lively.lang.class.isSubclassOf(Dummy1, TestKlass)).to.be(true);
  		expect(Global).to.have.property("Dummy1");
  		expect(Global["Dummy1"]).to.be(Dummy1);
  	});

  	it("isSuperclassDeep", function() {
  		lively.lang.class.create(TestKlass, 'Dummy1', {});
  		lively.lang.class.create(Dummy1, 'Dummy2', {});
  		expect(lively.lang.class.isSubclassOf(Dummy2, Dummy1)).to.be(true);
  		expect(lively.lang.class.isSubclassOf(Dummy2, TestKlass)).to.be(true);
  	});

  // 	it("allSubclasses", function() {
  // 		lively.lang.class.create(TestKlass, 'DummyClass', {});
  // 		lively.lang.class.create(DummyClass, 'SubDummyClass1', {});
  // 		expect(lively.lang.class.isSubclassOf(SubDummyClass1, DummyClass)).to.be(true);
  // 		lively.lang.class.create(DummyClass, 'SubDummyClass2', {});
  // 		lively.lang.class.create(SubDummyClass1, 'SubSubDummyClass', {});
  // 		expect(lively.Class.isClass(DummyClass)).to.be(true);
  // 		expect(DummyClass.allSubclasses().length).to.equal(3);
  // 	});

  // 	it("allSubclassesWithNamespace", function() {
  // 		lively.lang.class.create(TestKlass, 'OtherDummyClass', {});
  // 		Global.dummyNamespace = {subDummyNamespace: {}};
  // 		lively.lang.class.create(OtherDummyClass, 'dummyNamespace.subDummyNamespace.SubDummyClass', {});
  // 		expect(lively.lang.class.isSubclassOf(
  // 		  dummyNamespace.subDummyNamespace.SubDummyClass,
  // 		  OtherDummyClass)).to.be(true);
  // 		expect(OtherDummyClass.allSubclasses().length).to.equal(1);
  // 	});

  	it("getSuperClasses", function() {
	    lively.lang.class.create(TestKlass, 'A', {});
  		lively.lang.class.create(A, 'B', {});
  		var result = lively.lang.class.superclasses(A);
  		expect(result).to.eql([Object, TestKlass]);
  	});

  	it("superMethodsAreAssignedCorrectly", function() {
  	    var className = 'DummyTestSuperMethods';
  	    expect(!Global[className]).to.be(true); // 'Test already there';
  		var f1 = function ($super) { 1; };

  	    lively.lang.class.create(Object, className, {
              a: f1,
              b: function($super) { 2; }
          });
          var aSource = Global[className].prototype.a.toString();
          delete Global[className];
          expect(aSource).to.equal(f1.toString());
  	});

  	it("subclassingDoesNotReplaceExistingClass", function() {
  		try {
    		var className = 'DummyTestOverrideSubclass';
  	    expect(!Global[className]).to.be(true);
  			lively.lang.class.create(Object, className, {a: function () { return 1; }});
  	    expect(!!Global[className]).to.be(true);
  			var oldClass = Global[className];
  			lively.lang.class.create(Object, className, {b: function() { return 2; }});
  			var newClass = Global[className];
  			expect(oldClass).to.be(newClass);
  		} finally {
  			delete Global[className];
  		}
  	});

  	it("newClassDefinitionOfExistingClass", function() {
  		lively.lang.class.create(TestKlass, 'Dummy23', { m: function() { return 1 }});
  		var instance = new Dummy23();
  		lively.lang.class.create(TestKlass, 'Dummy23', { m: function() { return 2 }});
  		expect(instance.m()).to.equal(2);
  	});

  	it("can call $super", function() {
      var Class1 = clazz.create("Dummy1", {
        x: 1, y: 2, z: 3,
        foo: function(a) { return this.x + this.y + this.z + a + 1; }
      });
      var Class2 = clazz.create(Class1, "Dummy2", {
        x: 4,
        foo: function($super, z) { return $super(z) + 1; }
      });
      var instance = new Class2();
      instance.y = 5;
      expect(instance.foo(42)).to.equal(4+5+3+42+1+1);
    });

  });

});
