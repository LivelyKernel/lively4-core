## 2021-12-07 #Zones fixed for Response >> text()

*Author: @JensLincke* 

```javascript


async function bar() {
  
  lively.notify("Zone 1: " +  Zone.current.id + ": " + Zone.current.foo)

  await fetch("https://lively-kernel.org/").then(async r => {
    lively.notify("Zone 2.1: " + Zone.current.id + ": " + Zone.current.foo)  
    
    // Insight: "text()" returns uninstrumented promise that looses the ZONE
    // Q: How to deal with native promises?
    // Alt: how to remember and explicitly set a zone?
    var result = r.text() // (A)
    // var result = await Promise.resolve(r.text()) // SOLUTION: wrap it in a promise...
    lively.notify("Zone 2.2: " + Zone.current.id + ": " + Zone.current.foo)  
    
    
    
    return result
  })
  
  // await lively.sleep(1000) // (B)
  lively.notify("Zone 3: " + Zone.current.id + ": " + Zone.current.foo)

}


runZoned(async () => {
    await bar() 
  }, {
    zoneValues: {
      foo: "world",
    }
  })
  
```


Using #ContextJS

```javascript
import * as cop from "src/client/ContextJS/src/contextjs.js"

cop.layer(window, "ZonifyNativePromisesLayer").refineClass(Response, {
  text(...rest) {
    return Promise.resolve(cop.proceed(...rest))
  },
  
  json(...rest) {
    return Promise.resolve(cop.proceed(...rest))
  }
})


ZonifyNativePromisesLayer.beGlobal()
```