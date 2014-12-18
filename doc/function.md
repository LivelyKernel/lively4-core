## lib/function.js

Abstractions around first class functions like augmenting and inspecting
functions as well as to control function calls like dealing with asynchronous
control flows.


- [fun](#fun)
  - [Empty](#fun-Empty)
  - [K](#fun-K)
  - [Null](#fun-Null)
  - [False](#fun-False)
  - [True](#fun-True)
  - [all](#fun-all)
  - [own](#fun-own)
  - [argumentNames](#fun-argumentNames)
  - [extractBody](#fun-extractBody)
  - [timeToRun](#fun-timeToRun)
  - [timeToRunN](#fun-timeToRunN)
  - [delay](#fun-delay)
  - [throttle](#fun-throttle)
  - [debounce](#fun-debounce)
  - [throttleNamed](#fun-throttleNamed)
  - [debounceNamed](#fun-debounceNamed)
  - [createQueue](#fun-createQueue)
  - [workerWithCallbackQueue](#fun-workerWithCallbackQueue)
  - [composeAsync](#fun-composeAsync)
  - [compose](#fun-compose)
  - [flip](#fun-flip)
  - [waitFor](#fun-waitFor)
  - [waitForAll](#fun-waitForAll)
  - [curry](#fun-curry)
  - [wrap](#fun-wrap)
  - [getOriginal](#fun-getOriginal)
  - [wrapperChain](#fun-wrapperChain)
  - [replaceMethodForOneCall](#fun-replaceMethodForOneCall)
  - [once](#fun-once)
  - [either](#fun-either)
  - [eitherNamed](#fun-eitherNamed)
  - [fromString](#fun-fromString)
  - [asScript](#fun-asScript)
  - [asScriptOf](#fun-asScriptOf)
  - [addToObject](#fun-addToObject)
  - [functionNames](#fun-functionNames)
  - [logErrors](#fun-logErrors)
  - [webkitStack](#fun-webkitStack)
- [queue](#queue)
  - [handleError](#queue-handleError)
- [Closure](#Closure)
  - [fromFunction](#Closure-fromFunction)
  - [fromSource](#Closure-fromSource)
- [Closure.prototype](#Closure.prototype)
  - [setFuncSource](#Closure.prototype-setFuncSource)
  - [getFuncSource](#Closure.prototype-getFuncSource)
  - [hasFuncSource](#Closure.prototype-hasFuncSource)
  - [getFunc](#Closure.prototype-getFunc)
  - [lookup](#Closure.prototype-lookup)
  - [recreateFunc](#Closure.prototype-recreateFunc)

### <a name="fun"></a>fun



#### <a name="fun-Empty"></a>fun.Empty()

`function() {}`

#### <a name="fun-K"></a>fun.K()

`function(arg) { return arg; }`

#### <a name="fun-Null"></a>fun.Null()

`function() { return null; }`

#### <a name="fun-False"></a>fun.False()

`function() { return false; }`

#### <a name="fun-True"></a>fun.True()

`function() { return true; }`

#### <a name="fun-all"></a>fun.all(object)

 Returns all property names of `object` that reference a function.
 

```js
var obj = {foo: 23, bar: function() { return 42; }};
fun.all(obj) // => ["bar"]
```

#### <a name="fun-own"></a>fun.own(object)

 Returns all local (non-prototype) property names of `object` that
 reference a function.
 

```js
var obj1 = {foo: 23, bar: function() { return 42; }};
var obj2 = {baz: function() { return 43; }};
obj2.__proto__ = obj1
fun.own(obj2) // => ["baz"]
/*vs.*/ fun.all(obj2) // => ["baz","bar"]
```

#### <a name="fun-argumentNames"></a>fun.argumentNames(f)

 

```js
fun.argumentNames(function(arg1, arg2) {}) // => ["arg1","arg2"]
fun.argumentNames(function(/*var args*/) {}) // => []
```

#### <a name="fun-extractBody"></a>fun.extractBody(func)

 Returns the body of func as string, removing outer function code and
 superflous indent. Useful when you have to stringify code but not want
 to construct strings by hand.
 

```js
fun.extractBody(function(arg) {
  var x = 34;
  alert(2 + arg);
}) => "var x = 34;\nalert(2 + arg);"
```

#### <a name="fun-timeToRun"></a>fun.timeToRun(func)

 returns synchronous runtime of calling `func` in ms
 

```js
fun.timeToRun(function() { new WebResource("http://google.de").beSync().get() });
// => 278 (or something else...)
```

#### <a name="fun-timeToRunN"></a>fun.timeToRunN(func, n)

 Like `timeToRun` but calls function `n` times instead of once. Returns
 the average runtime of a call in ms.

#### <a name="fun-delay"></a>fun.delay(func, timeout)

 Delays calling `func` for `timeout` seconds(!).
 

```js
(function() { alert("Run in the future!"); }).delay(1);
```

#### <a name="fun-throttle"></a>fun.throttle(func, wait)

 Exec func at most once every wait ms even when called more often
 useful to calm down eagerly running updaters and such.
 

```js
var i = 0;
var throttled = fun.throttle(function() { alert(++i + '-' + Date.now()) }, 500);
Array.range(0,100).forEach(function(n) { throttled() });
```

#### <a name="fun-debounce"></a>fun.debounce(wait, func, immediate)

 Call `func` after `wait` milliseconds elapsed since the last invocation.
 Unlike `throttle` an invocation will restart the wait period. This is
 useful if you have a stream of events that you want to wait for to finish
 and run a subsequent function afterwards. When you pass arguments to the
 debounced functions then the arguments from the last call will be use for
 the invocation.
 
 With `immediate` set to true, immediately call `func` but when called again during `wait` before
 wait ms are done nothing happens. E.g. to not exec a user invoked
 action twice accidentally.
 

```js
var start = Date.now();
var f = fun.debounce(200, function(arg1) {
  alert("running after " + (Date.now()-start) + "ms with arg " + arg1);
});
f("call1");
fun.delay(f.curry("call2"), 0.1);
fun.delay(f.curry("call3"), 0.15);
// => Will eventually output: "running after 352ms with arg call3"
```

#### <a name="fun-throttleNamed"></a>fun.throttleNamed(name, wait, func)

 Like `throttle` but remembers the throttled function once created and
 repeated calls to `throttleNamed` with the identical name will use the same
 throttled function. This allows to throttle functions in a central place
 that might be called various times in different contexts without having to
 manually store the throttled function.

#### <a name="fun-debounceNamed"></a>fun.debounceNamed(name, wait, func, immediate)

 Like `debounce` but remembers the debounced function once created and
 repeated calls to `debounceNamed` with the identical name will use the same
 debounced function. This allows to debounce functions in a central place
 that might be called various times in different contexts without having to
 manually store the debounced function.

#### <a name="fun-createQueue"></a>fun.createQueue(id, workerFunc)

 A simple queue with an attached asynchronous `workerFunc` to process
 queued tasks. Calling `createQueue` will return an object with the
 following interface:
 ```js
 {
   push: function(task) {/**/},
   pushAll: function(tasks) {/**/},
   handleError: function(err) {}, // Overwrite to handle errors
   dran: function() {}, // Overwrite to react when the queue empties
 }
 

```js
var sum = 0;
var q = fun.createQueue("example-queue", function(arg, thenDo) { sum += arg; thenDo(); });
q.pushAll([1,2,3]);
queues will be remembered by their name
fun.createQueue("example-queue").push(4);
sum // => 6
```

#### <a name="queue-handleError"></a>queue.handleError(err)

 can be overwritten

#### <a name="fun-workerWithCallbackQueue"></a>fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 This functions helps when you have a long running computation that
 multiple call sites (independent from each other) depend on. This
 function does the housekeeping to start the long running computation
 just once and returns an object that allows to schedule callbacks
 once the workerFunc is done.
 

```js
var worker = fun.workerWithCallbackQueue("example",
  function slowFunction(thenDo) {
    var theAnswer = 42;
    setTimeout(function() { thenDo(null, theAnswer); });
  });
// all "call sites" depend on `slowFunction` but don't have to know about
// each other
worker.whenDone(function callsite1(err, theAnswer) { alert("callback1: " + theAnswer); })
worker.whenDone(function callsite2(err, theAnswer) { alert("callback2: " + theAnswer); })
fun.workerWithCallbackQueue("example").whenDone(function callsite3(err, theAnswer) { alert("callback3: " + theAnswer); })
// => Will eventually show: callback1: 42, callback2: 42 and callback3: 42
```

#### <a name="fun-composeAsync"></a>fun.composeAsync()

 Composes functions that are asynchronous and expecting continuations to
 be called in node.js callback style (error is first argument, real
 arguments follow).
 A call like `fun.composeAsync(f,g,h)(arg1, arg2)` has a flow of control like:
  `f(arg1, arg2, thenDo1)` -> `thenDo1(err, fResult)`
 -> `g(fResult, thenDo2)` -> `thenDo2(err, gResult)` ->
 -> `h(fResult, thenDo3)` -> `thenDo2(err, hResult)`
 

```js
fun.composeAsync(
  function(a,b, thenDo) { thenDo(null, a+b); },
  function(x, thenDo) { thenDo(x*4); }
 )(3,2, function(err, result) { alert(result); });
```

#### <a name="fun-compose"></a>fun.compose()

 Composes synchronousefunctions:
 `fun.compose(f,g,h)(arg1, arg2)` = `h(g(f(arg1, arg2)))`
 

```js
fun.compose(
  function(a,b) { return a+b; },
  function(x) {return x*4}
)(3,2) // => 20
```

#### <a name="fun-flip"></a>fun.flip(f)

 Swaps the first two args
 

```js
fun.flip(function(a, b, c) {
  return a + b + c; })(' World', 'Hello', '!') // => "Hello World!"
```

#### <a name="fun-waitFor"></a>fun.waitFor(timeoutMs, waitTesterFunc, thenDo)

 Wait for waitTesterFunc to return true, then run thenDo, passing
 failure/timout err as first parameter. A timout occurs after
 timeoutMs. During the wait period waitTesterFunc might be called
 multiple times.

#### <a name="fun-waitForAll"></a>fun.waitForAll(options, funcs, thenDo)

 Wait for multiple asynchronous functions. Once all have called the
 continuation, call `thenDo`.
 options can be: `{timeout: NUMBER}` (how long to wait in milliseconds).

#### <a name="fun-curry"></a>fun.curry(func, arg1, arg2, argN)

 Return a version of `func` with args applied.
 

```js
var add1 = (function(a, b) { return a + b; }).curry(1);
add1(3) // => 4
```

#### <a name="fun-wrap"></a>fun.wrap(func, wrapper)

 A `wrapper` is another function that is being called with the arguments
 of `func` and a proceed function that, when called, runs the originally
 wrapped function.
 

```js
function original(a, b) { return a+b }
var wrapped = fun.wrap(original, function logWrapper(proceed, a, b) {
  alert("original called with " + a + "and " + b);
  return proceed(a, b);
})
wrapped(3,4) // => 7 and a message will pop up
```

#### <a name="fun-getOriginal"></a>fun.getOriginal(func)

 Get the original function that was augmented by `wrap`. `getOriginal`
 will traversed as many wrappers as necessary.

#### <a name="fun-wrapperChain"></a>fun.wrapperChain(method)

 Function wrappers used for wrapping, cop, and other method
 manipulations attach a property "originalFunction" to the wrapper. By
 convention this property references the wrapped method like wrapper
 -> cop wrapper -> real method.
 tThis method gives access to the linked list starting with the outmost
 wrapper.

#### <a name="fun-replaceMethodForOneCall"></a>fun.replaceMethodForOneCall(obj, methodName, replacement)

 Change an objects method for a single invocation.
 

```js
var obj = {foo: function() { return "foo"}};
lively.lang.fun.replaceMethodForOneCall(obj, "foo", function() { return "bar"; });
obj.foo(); // => "bar"
obj.foo(); // => "foo"
```

#### <a name="fun-once"></a>fun.once(func)

 Ensure that `func` is only executed once. Multiple calls will not call
 `func` again but will return the original result.

#### <a name="fun-either"></a>fun.either()

 Accepts multiple functions and returns an array of wrapped
 functions. Those wrapped functions ensure that only one of the original
 function is run (the first on to be invoked).
 
 This is useful if you have multiple asynchronous choices of how the
 control flow might continue but want to ensure that a continuation
 is  only triggered once, like in a timeout situation:
 
 ```js
 function outerFunction(callback) {
   function timeoutAction() { callback(new Error('timeout!')); }
   function otherAction() { callback(null, "All OK"); }
   setTimeout(timeoutAction, 200);
   doSomethingAsync(otherAction);
 }
 ```
 
 To ensure that `callback` only runs once you would normally have to write boilerplate like this:
 
 ```js
 var ran = false;
 function timeoutAction() { if (ran) return; ran = true; callback(new Error('timeout!')); }
 function otherAction() { if (ran) return; ran = true; callback(null, "All OK"); }
 ```
 
 Since this can get tedious an error prone, especially if more than two choices are involved, `either` can be used like this:
 

```js
function outerFunction(callback) {
  var actions = fun.either(
    function() { callback(new Error('timeout!')); },
    function() { callback(null, "All OK"); });
  setTimeout(actions[0], 200);
  doSomethingAsync(actions[1]);
}
```

#### <a name="fun-eitherNamed"></a>fun.eitherNamed(name, func)

 Works like [`either`](#) but usage does not require to wrap all
 functions at once:
 

```js
var log = "", name = "either-example-" + Date.now();
function a() { log += "aRun"; };
function b() { log += "bRun"; };
function c() { log += "cRun"; };
setTimeout(fun.eitherNamed(name, a), 100);
setTimeout(fun.eitherNamed(name, b), 40);
setTimeout(fun.eitherNamed(name, c), 80);
setTimeout(function() { alert(log); /* => "bRun" */ }, 150);
```

#### <a name="fun-fromString"></a>fun.fromString(funcOrString)

 

```js
fun.fromString("function() { return 3; }")() // => 3
```

#### <a name="fun-asScript"></a>fun.asScript(func, optVarMapping)

 Lifts `func` to become a `Closure`, that is that free variables referenced
 in `func` will be bound to the values of an object that can be passed in as
 the second parameter. Keys of this object are mapped to the free variables.

 Please see [`Closure`](#) for a more detailed explanation and examples.

#### <a name="fun-asScriptOf"></a>fun.asScriptOf(f, obj, optName, optMapping)

 Like `asScript` but makes `f` a method of `obj` as `optName` or the name
 of the function.

#### <a name="fun-addToObject"></a>fun.addToObject(f, obj, name)

 suppport for tracing

#### <a name="fun-functionNames"></a>fun.functionNames(klass)

 Treats passed function as class (constructor).
 

```js
var Klass1 = function() {}
Klass1.prototype.foo = function(a, b) { return a + b; };
Klass1.prototype.bar = function(a) { return this.foo(a, 3); };
Klass1.prototype.baz = 23;
fun.functionNames(Klass1); // => ["bar","foo"]
```

#### <a name="fun-logErrors"></a>fun.logErrors(func, prefix)

,args

#### <a name="fun-webkitStack"></a>fun.webkitStack()

 this won't work in every browser

#### <a name="Closure"></a>Closure()

 A `Closure` is a representation of a JavaScript function that controls what
 values are bound to out-of-scope variables. By default JavaScript has no
 reflection capabilities over closed values in functions. When needing to
 serialize execution or when behavior should become part of the state of a
 system it is often necessary to have first-class control over this language
 aspect.

 Typically closures aren't created directly but with the help of [`asScriptOf`](#)
 
 

```js
function func(a) { return a + b; }
var closureFunc = Closure.fromFunction(func, {b: 3}).recreateFunc();
closureFunc(4) // => 7
var closure = closureFunc.livelyClosure // => {
//   varMapping: { b: 3 },
//   originalFunc: function func(a) {/*...*/}
// }
closure.lookup("b") // => 3
closure.getFuncSource() // => "function func(a) { return a + b; }"
```

#### <a name="Closure.prototype-setFuncSource"></a>Closure>>setFuncSource(src)



#### <a name="Closure.prototype-getFuncSource"></a>Closure>>getFuncSource()



#### <a name="Closure.prototype-hasFuncSource"></a>Closure>>hasFuncSource()



#### <a name="Closure.prototype-getFunc"></a>Closure>>getFunc()



#### <a name="Closure.prototype-lookup"></a>Closure>>lookup(name)



#### <a name="Closure.prototype-recreateFunc"></a>Closure>>recreateFunc()

 Creates a real function object

#### <a name="Closure-fromFunction"></a>Closure.fromFunction(func, varMapping)



#### <a name="Closure-fromSource"></a>Closure.fromSource(source, varMapping)

