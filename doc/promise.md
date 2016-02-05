## lib/promise.js

Methods helping with promises (Promise/A+ model). Not a promise shim.


- [promise](#promise)
  - [convertCallbackFun](#promise-convertCallbackFun)
  - [convertCallbackFunWithManyArgs](#promise-convertCallbackFunWithManyArgs)

#### <a name="promise-convertCallbackFun"></a>promise.convertCallbackFun(func)

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

#### <a name="promise-convertCallbackFunWithManyArgs"></a>promise.convertCallbackFunWithManyArgs(func)

 like convertCallbackFun but the promise will be resolved with the
 all non-error arguments wrapped in an array.