## object.js

Utility functions that help to inspect, enumerate, and create JS objects


- [obj](#obj)
  - [isArray](#obj-isArray)
  - [isElement](#obj-isElement)
  - [isFunction](#obj-isFunction)
  - [isBoolean](#obj-isBoolean)
  - [isString](#obj-isString)
  - [isNumber](#obj-isNumber)
  - [isUndefined](#obj-isUndefined)
  - [isRegExp](#obj-isRegExp)
  - [isObject](#obj-isObject)
  - [isEmpty](#obj-isEmpty)
  - [equals](#obj-equals)
  - [values](#obj-values)
  - [extend](#obj-extend)
  - [clone](#obj-clone)
  - [inspect](#obj-inspect)
  - [merge](#obj-merge)
  - [valuesInPropertyHierarchy](#obj-valuesInPropertyHierarchy)
  - [mergePropertyInHierarchy](#obj-mergePropertyInHierarchy)
  - [deepCopy](#obj-deepCopy)
  - [shortPrintStringOf](#obj-shortPrintStringOf)
  - [isMutableType](#obj-isMutableType)
  - [safeToString](#obj-safeToString)
- [Path](#Path)
- [Path.prototype](#Path.prototype)
  - [parts](#Path.prototype-parts)
  - [size](#Path.prototype-size)
  - [slice](#Path.prototype-slice)
  - [isIn](#Path.prototype-isIn)
  - [equals](#Path.prototype-equals)
  - [isParentPathOf](#Path.prototype-isParentPathOf)
  - [relativePathTo](#Path.prototype-relativePathTo)
  - [set](#Path.prototype-set)
  - [get](#Path.prototype-get)
  - [concat](#Path.prototype-concat)
  - [watch](#Path.prototype-watch)

### <a name="obj"></a>obj



#### <a name="obj-isArray"></a>obj.isArray(obj)



#### <a name="obj-isElement"></a>obj.isElement(object)



#### <a name="obj-isFunction"></a>obj.isFunction(object)



#### <a name="obj-isBoolean"></a>obj.isBoolean(object)



#### <a name="obj-isString"></a>obj.isString(object)



#### <a name="obj-isNumber"></a>obj.isNumber(object)



#### <a name="obj-isUndefined"></a>obj.isUndefined(object)



#### <a name="obj-isRegExp"></a>obj.isRegExp(object)



#### <a name="obj-isObject"></a>obj.isObject(object)



#### <a name="obj-isEmpty"></a>obj.isEmpty(object)



#### <a name="obj-equals"></a>obj.equals(a, b)

 Is object `a` structurally equivalent to object `b`? Deep comparison.

#### <a name="obj-values"></a>obj.values(object)

 

```js
var obj1 = {x: 22}, obj2 = {x: 23, y: {z: 3}};
obj2.__proto__ = obj1;
obj.values(obj1) // => [22]
obj.values(obj2) // => [23,{z: 3}]
```

#### <a name="obj-extend"></a>obj.extend(destination, source)

 Add all properties of `source` to `destination`.
 

```js
var dest = {x: 22}, src = {x: 23, y: 24}
obj.extend(dest, src);
dest // => {x: 23,y: 24}
```

#### <a name="obj-clone"></a>obj.clone(object)

 Shallow copy

#### <a name="obj-inspect"></a>obj.inspect(object, options, depth)

 Prints a human-readable representation of `obj`. The printed
 representation will be syntactically correct JavaScript but will not
 necessarily evaluate to a structurally identical object. `inspect` is
 meant to be used while interactivively exploring JavaScript programs and
 state.

 `options` can be {printFunctionSource: BOOLEAN, escapeKeys: BOOLEAN, maxDepth: NUMBER}

#### <a name="obj-merge"></a>obj.merge(objs)

 `objs` can be a list of objects. The return value will be a new object,
 containing all properties of all objects. If the same property exist in
 multiple objects, the right-most property takes precedence.

 Like `extend` but will not mutate objects in `objs`.

#### <a name="obj-valuesInPropertyHierarchy"></a>obj.valuesInPropertyHierarchy(obj, name)

 Lookup all properties named name in the proto hierarchy of obj.
 

```js
var a = {foo: 3}, b = Object.create(a), c = Object.create(b);
c.foo = 4;
obj.valuesInPropertyHierarchy(c, "foo") // => [3,4]
```

#### <a name="obj-mergePropertyInHierarchy"></a>obj.mergePropertyInHierarchy(obj, propName)

 like `merge` but automatically gets all definitions of the value in the
 prototype chain and merges those.
 

```js
var o1 = {x: {foo: 23}}, o2 = {x: {foo: 24, bar: 15}}, o3 = {x: {baz: "zork"}};
o2.__proto__ = o1; o3.__proto__ = o2;
obj.mergePropertyInHierarchy(o3, "x");
// => {bar: 15, baz: "zork",foo: 24}
```

#### <a name="obj-deepCopy"></a>obj.deepCopy(object)

 Recursively traverses `object` and its properties to create a copy.

#### <a name="obj-shortPrintStringOf"></a>obj.shortPrintStringOf(obj)

 constructed objects

#### <a name="obj-isMutableType"></a>obj.isMutableType(obj)

 Is `obj` a value or mutable type?

#### <a name="obj-safeToString"></a>obj.safeToString(obj)

 Like `toString` but catches errors.

### <a name="Path"></a>Path

 A `Path` is an objectified chain of property names (kind of a "complex"
 getter and setter). Path objects can make access and writes into deeply nested
 structures more convenient. `Path` provide "safe" get and set operations and
 can be used for debugging by providing a hook that allows users to find out
 when get/set operations happen.

#### <a name="Path.prototype-parts"></a>Path>>parts()

key names as array

#### <a name="Path.prototype-size"></a>Path>>size()



#### <a name="Path.prototype-slice"></a>Path>>slice(n, m)



#### <a name="Path.prototype-isIn"></a>Path>>isIn(obj)

 Does the Path resolve to a value when applied to `obj`?

#### <a name="Path.prototype-equals"></a>Path>>equals(obj)

 

```js
var p1 = Path("foo.1.bar.baz"), p2 = Path(["foo", 1, "bar", "baz"]);
// Path's can be both created via strings or pre-parsed with keys in a list.
p1.equals(p2) // => true
```

#### <a name="Path.prototype-isParentPathOf"></a>Path>>isParentPathOf(otherPath)

 

```js
var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1.bar");
p2.isParentPathOf(p1) // => true
p1.isParentPathOf(p2) // => false
```

#### <a name="Path.prototype-relativePathTo"></a>Path>>relativePathTo(otherPath)

 

```js
var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1");
p2.relativePathTo(p1) // => Path(["bar","baz"])
p1.relativePathTo(p2) // => undefined
```

#### <a name="Path.prototype-set"></a>Path>>set(obj, val, ensure)

 Deeply resolve path in `obj` and set the resulting property to `val`. If
 `ensure` is true, create nested structure in between as necessary.
 

```js
var o1 = {foo: {bar: {baz: 42}}};
var path = Path("foo.bar.baz");
path.set(o1, 43)
o1 // => {foo: {bar: {baz: 43}}}
var o2 = {foo: {}};
path.set(o2, 43, true)
o2 // => {foo: {bar: {baz: 43}}}
```

#### <a name="Path.prototype-get"></a>Path>>get(obj, n)



#### <a name="Path.prototype-concat"></a>Path>>concat(p, splitter)



#### <a name="Path.prototype-watch"></a>Path>>watch(options)

 React or be notified on reads or writes to a path in a `target`. Options:
 ```js
 {
   target: OBJECT,
   uninstall: BOOLEAN,
   onGet: FUNCTION,
   onSet: FUNCTION,
   haltWhenChanged: BOOLEAN,
   verbose: BOOLEAN
 }
 ```
 

```js
// Quite useful for debugging to find out what call-sites change an object.
var o = {foo: {bar: 23}};
Path("foo.bar").watch({target: o, verbose: true});
o.foo.bar = 24; // => You should see: "[object Object].bar changed: 23 -> 24"
```