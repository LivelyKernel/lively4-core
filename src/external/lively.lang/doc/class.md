## lib/class.js

A lightweight class system that allows change classes at runtime.


- [exports.class](#exports.class)
  - [create](#exports.class-create)
  - [addMethods](#exports.class-addMethods)
  - [addCategorizedMethods](#exports.class-addCategorizedMethods)
  - [isSubclassOf](#exports.class-isSubclassOf)
  - [superclasses](#exports.class-superclasses)
  - [remove](#exports.class-remove)
- [hasSuperCall](#hasSuperCall)

#### <a name="exports.class-create"></a>exports.class.create()

 Main method of the class system.
 First argument can be the superclass or if no super class is specified
 Object is the superclass. Second arg is the class name. The following
 argument can be a JavaScript object whose keys and values will be
 installed as attributes/methods of the class.
 
 Note that when a class with the same name already exists it will be
 modified so that interactive development is possible. To completely
 remove a class use `lively.lang.class.remove(TheClass)`
 

```js
lively.lang.class.create("NewClass", {
  method: function() { return 23; }
});
var instance = new NewClass();
instance.method() // => 23
//
// Alternatively class with superclass as first argument
lively.lang.class.create(NewClass, "NewClass2", {
  method: function($super) { return $super() + 2; }
});
var instance = new NewClass2();
instance.method() // => 25
```

#### <a name="exports.class-addMethods"></a>exports.class.addMethods()

 Takes an exiting class and adds/replaces its methods by the supplied JS
 object.

#### <a name="exports.class-addCategorizedMethods"></a>exports.class.addCategorizedMethods(klass, categoryName, source)

 first parameter is a category name
 copy all the methods and properties from {source} into the
 prototype property of the receiver, which is intended to be
 a class constructor.    Method arguments named '$super' are treated
 specially, see Prototype.js documentation for "classHelper.create()" for details.
 derived from classHelper.Methods.addMethods() in prototype.js

### <a name="hasSuperCall"></a>hasSuperCall

 weirdly, RegExps are functions in Safari, so testing for
 Object.isFunction on regexp field values will return true.
 But they're not full-blown functions and don't
 inherit argumentNames from Function.prototype

#### <a name="exports.class-isSubclassOf"></a>exports.class.isSubclassOf(klassA, klassB)

 Is `klassA` a descendent of klassB?

#### <a name="exports.class-superclasses"></a>exports.class.superclasses(klass)



#### <a name="exports.class-remove"></a>exports.class.remove(klass)

 Remove `klass`, modifies the namespace the class is installed in.