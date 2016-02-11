## lib/promise.js

Methods helping with promises (Promise/A+ model). Not a promise shim.


- [exports](#exports)
  - [promise](#exports-promise)
- [exports.promise](#exports.promise)
  - [delay](#exports.promise-delay)
  - [delayReject](#exports.promise-delayReject)
  - [timeout](#exports.promise-timeout)
  - [deferred](#exports.promise-deferred)
  - [convertCallbackFun](#exports.promise-convertCallbackFun)
  - [convertCallbackFunWithManyArgs](#exports.promise-convertCallbackFunWithManyArgs)
  - [chain](#exports.promise-chain)

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

#### <a name="exports.promise-delay"></a>exports.promise.delay(ms, resolveVal)

 Like `Promise.resolve(resolveVal)` but waits for `ms` milliseconds
 before resolving

#### <a name="exports.promise-delayReject"></a>exports.promise.delayReject(ms, rejectVal)

 like `promise.delay` but rejects

#### <a name="exports.promise-timeout"></a>exports.promise.timeout(ms, promise)

 Takes a promise and either resolves to the value of the original promise
 when it succeeds before `ms` milliseconds passed or fails with a timeout
 error

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

#### <a name="exports.promise-chain"></a>exports.promise.chain(promiseFuncs)

 Similar to Promise.all but takes a list of promise-producing functions
 (instead of Promises directly) that are run sequentially. Each function
 gets the result of the previous promise and a shared "state" object passed
 in. The function should return either a value or a promise. The result of
 the entire chain call is a promise itself that either resolves to the last
 returned value or rejects with an error that appeared somewhere in the
 promise chain. In case of an error the chain stops at that point.
 

```js
lively.lang.promise.chain([
  () => Promise.resolve(23),
  (prevVal, state) => { state.first = prevVal; return prevVal + 2 },
  (prevVal, state) => { state.second = prevVal; return state }
]).then(result => console.log(result));
// => prints {first: 23,second: 25}
```