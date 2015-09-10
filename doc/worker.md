## lib/worker.js

A platform-independent worker interface that will spawn new processes per
worker (if the platform you use it on supports it).


- [worker](#worker)
  - [fork](#worker-fork)
  - [create](#worker-create)

#### <a name="worker-fork"></a>worker.fork(options, workerFunc, thenDo)

 Fork automatically starts a worker and calls `workerFunc`. `workerFunc`
 gets as a last paramter a callback, that, when invoked with an error and
 result object, ends the worker execution.

 Options are the same as in `create` except for an `args` property that
 can be an array of objects. These objects will be passed to `workerFunc`
 as arguments.

 Note: `workerFunc` will not be able to capture outside variables (create a
 closure).

 

```js
// When running this inside a browser: Note how the UI does not block.
worker.fork({args: [40]},
  function(n, thenDo) {
    function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
    thenDo(null, fib(n));
  },
  function(err, result) { show(err ? err.stack : result); })
```

#### <a name="worker-create"></a>worker.create(options)

 Explicitly creates a first-class worker. Options:
 ```js
 {
   workerId: STRING, // optional, id for worker, will be auto assigned if not provided
   libLocation: STRING, // optional, path to where the lively.lang lib is located. Worker will try to find it automatically if not provided.
   scriptsToLoad: ARRAY // optional, list of path/urls to load. Overwrites `libLocation`
 }
 ```

 

```js
// this is just a helper function
function resultHandler(err, result) { alert(err ? String(err) : result); }
// 1. Create the worker
var worker = lively.lang.worker.create({libLocation: baseURL});
// 2. You can evaluate arbitrary JS code
worker.eval("1+2", function(err, result) { show(err ? String(err) : result); });
// 3. Arbitrary functions can be called inside the worker context.
//    Note: functions shouldn't be closures / capture local state!) and passing
//    in arguments!
worker.run(
  function(a, b, thenDo) { setTimeout(function() { thenDo(null, a+b); }, 300); },
  19, 4, resultHandler);
// 4. You can also install your own messenger services...
worker.run(
  function(thenDo) {
    self.messenger.addServices({
      foo: function(msg, messenger) { messenger.answer(msg, "bar!"); }
    });
    thenDo(null, "Service installed!");
  }, resultHandler);
// ... and call them via the messenger interface
worker.sendTo("worker", "foo", {}, resultHandler);
// 5. afterwards: shut it down
worker.close(function(err) { err && show(String(err)); alertOK("worker shutdown"); })
```