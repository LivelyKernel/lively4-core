# SystemJS Webworkers

Lively has now its own Webworkers that can import other modules... yea!

And here is how they are used. The worker itself resides in a file "test-worker.js"

```javascript

console.log("test worker loaded!")

export function onmessage(evt) {
  // Message received from main script'
  var workerResult = 'Result: ' + (evt.data[0] * evt.data[1]);
  // Posting message back to main script'
  postMessage(workerResult);
}
```

And when loading it, we use SystemjsWorker instead of Worker to instantiate an instance...


```javascript

import SystemjsWorker from "src/worker/systemjs-worker.js"

var test = new SystemjsWorker("src/worker/test-worker.js")
test.onmessage = (result) => {
  lively.notify("result", result.data)
}
test.postMessage([3,8])


```

