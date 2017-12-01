# Coerced Promise Logging

## Problem

- "printf" / console.log debugging can does not caputure call dependencies in async JavaScript code
- Example: module loading in SystemJS cannot be measures / logged with console.log or console.group statements
- Domain specific solution: write a custom domain specific logging framework
- Problem: tedious, not generic and not reusable 

## Idea: Make Aysnc Promise execution log aware

- use ContextJS to layer Promise.then 
- caputure console.log / console.group while executing a promise.
- replay and print log information in a semantic order based on the dependencies of each promise...


## Notes

### Basic Dynamically scoped COP

```javascript
cop.withLayers([SomeLayer], () => {
  doSomething()
})
```

### Basic Dynamically scoped COP

```javascript
cop.withLayers([SomeLayer], async () => {
  doSomethingFirst() // SomeLayer is active
  await someTime() 
  doSomething() // // SomeLayer might not be active....
})
```



## Workspace

```javascript
cop.withLayers([LogPromisesLayer], () => {

  var p = new Promise((r,f) => {
    r("A")
    // f("B")
  })


  return p.then( r => {
    console.log("result ")
  })
})
```


## Promised Logs Layer

```javascript
import * as cop  from "src/external/ContextJS/src/contextjs.js";

var resolveCounter = 0

window.dependendPromises = new Map()
window.dependendPromisesLogs = new Map()


window.currrentPromise = undefined
window.promiseRoots = new Set()

function addDependend(oldPromise, newPromise) {
    if (!window.currrentPromise)  {
      window.promiseRoots.add(newPromise)
      return 
    }
    var dep = dependendPromises.get(oldPromise)
    if (!dep) {
      dep = []
      dependendPromises.set(oldPromise, dep)
    }
    dep.push(newPromise)  
}

function promisedLog(promise, args) {
    var logs = dependendPromisesLogs.get(promise)
    if (!logs) {
      logs = []
      dependendPromisesLogs.set(promise, logs)
    }
    logs.push(args)  
}

cop.layer(window, "LogPromisesLayer").refineClass(Promise, {
  then(onresolve, onerror) {
    // outside then
    this.__promise_debug_id__ =  resolveCounter++    
    
    addDependend(window.currrentPromise, this)    
    var oldPromise = this; 
    var newPromise = cop.proceed(
      onresolve ? (...args) => {
        // inside then
        cop.withoutLayers([LogPromisesLayer], () => {

          /// console.log("execute promise " + resolveCounter );
        })
        window.currrentPromise = oldPromise
        var result
        cop.withLayers([LogPromisesLayer], () => {
          result = onresolve(...args)        
        })
        window.currrentPromise = undefined
        return result
      } : undefined,
      onerror);
    addDependend(oldPromise, newPromise)
    
    return newPromise
  }
}).refineObject(console, {
  log(...args) {
    return cop.withoutLayers([LogPromisesLayer], () => {
      promisedLog(window.currrentPromise, args)
      return cop.proceed("PROMISED", ...args)
    })
  }
})

// LogPromisesLayer.beGlobal()
// LogPromisesLayer.beNotGlobal()
```


## Promised Logs

```javascript
import logpromises from "demos/contextjs/logpromises.js"

import * as cop  from "src/external/ContextJS/src/contextjs.js";

function dependenciesTree(p) {
  return {
    name: "Promise " + p.__promise_debug_id__,
    logs: dependendPromisesLogs.get(p) ,
    children: (dependendPromises.get(p) || []).map(ea => dependenciesTree(ea)) 
  }  
}

function printPromisedLogs(p) {
  var logs = dependendPromisesLogs.get(p)
  if (logs) {
    cop.withoutLayers([LogPromisesLayer], () => {
      logs.forEach(ea => {
        console.log(...ea)          
      })
    });
    (dependendPromises.get(p) || []).forEach(ea => printPromisedLogs(ea)) 
  }
}

LogPromisesLayer.beGlobal()

var rootPromise = new Promise(r => {
  console.log("A")
  r()
})
rootPromise
  .then( async (resp) => {
    console.log("B")
    // await... or not  
    new Promise(async (resolve)=> {
      setTimeout(resolve, 10)
    }).then(r => {
      console.log("C")
    })
    return
  })
  .then( r => {
    console.log("D")
  });
new Promise(r => {
  console.log("E")
})

LogPromisesLayer.beNotGlobal()

// dependenciesTree(rootPromise)

Array.from(promiseRoots).forEach(async ea => {
  await ea;
  console.group("REPLAY " + ea.__promise_debug_id__)
  printPromisedLogs(ea)
  console.groupEnd()
})
```

### Logs

```
EVAL (CM) unnamed_module_416e47e4_91ee_4431_ad9b_5b93a449e0b2
babel-plugin-var-recorder.js:8 XXX unnamed_module_416e47e4_91ee_4431_ad9b_5b93a449e0b2
workspacejs:0b9a42c3-1e8a-4faa-8922-c8be01607e09:65 PROMISED A
workspacejs:0b9a42c3-1e8a-4faa-8922-c8be01607e09:65 PROMISED E
workspacejs:0b9a42c3-1e8a-4faa-8922-c8be01607e09:65 PROMISED B
workspacejs:5444d968-7e73-478f-9a6d-e8a7f3c4b41c:56 REPLAY 0
workspacejs:5444d968-7e73-478f-9a6d-e8a7f3c4b41c:19 B
workspacejs:0b9a42c3-1e8a-4faa-8922-c8be01607e09:65 PROMISED D
workspacejs:5444d968-7e73-478f-9a6d-e8a7f3c4b41c:56 REPLAY 1
workspacejs:5444d968-7e73-478f-9a6d-e8a7f3c4b41c:19 D
workspacejs:5444d968-7e73-478f-9a6d-e8a7f3c4b41c:56 REPLAY undefined
workspacejs:0b9a42c3-1e8a-4faa-8922-c8be01607e09:65 PROMISED C
```

This is still #WIP as the current logs show.