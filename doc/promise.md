## lib/promise.js

Methods helping with promises (Promise/A+ model). Not a promise shim.


- [exports](#exports)
  - [promise](#exports-promise)
- [exports.promise](#exports.promise)
  - [deferred](#exports.promise-deferred)
  - [convertCallbackFun](#exports.promise-convertCallbackFun)
  - [convertCallbackFunWithManyArgs](#exports.promise-convertCallbackFunWithManyArgs)

#### <a name="exports-promise"></a>exports.promise(obj)

 Promise object / function converter
 

```js
promise("foo");
  // => Promise({state: "fullfilled", value: "foo"})
lively.lang.promise({then: (resolve, reject) => resolve(23)})
  // => Promise({state: "fullfilled", value: 23})
lively.lang.promise(function(val, thenDo) { thenDo(null, val + 1) })(3)
  // => Promise({state: "fullfilled", value: 4})
```

#### <a name="exports.promise-deferred"></a>exports.promise.deferred()

 returns an object
 `{resolve: FUNCTION, reject: FUNCTION, promise: PROMISE}`
 that separates the resolve/reject handling from the promise itself
 Similar to the deprecated `Promise.defer()`

#### <a name="exports.promise-convertCallbackFun"></a>exports.promise.convertCallbackFun(func)

 Takes a function that accepts a nodejs-style callback function as a last
 parameter and converts it to a function *not* taking the callback but
 producing a promise instead. The promise will be resolved with the
 *first* non-error argument.
 nodejs callback convention: a function that takes as first parameter an
 error arg and second+ parameters are the result(s).
 

```js
var fs = require("fs"),
    readFile = promise.convertCallbackFun(fs.readFile);
readFile("./some-file.txt")
  .then(content => console.log(String(content)))
  .catch(err => console.error("Could not read file!", err));
```

#### <a name="exports.promise-convertCallbackFunWithManyArgs"></a>exports.promise.convertCallbackFunWithManyArgs(func)

 like convertCallbackFun but the promise will be resolved with the
 all non-error arguments wrapped in an array.