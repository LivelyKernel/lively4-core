# ShowFocus Layer

And I wrote it again.... Because I did not look for <edit://demos/contextjs/showfocuslayer.js>  first

```js
import * as cop  from "src/client/ContextJS/src/contextjs.js";

cop.layer(window, "ShowFocus").refineClass(HTMLElement, {

    focus(...args) {
      lively.showElement(this)
      console.log("focus " + this, lively.stack())
      return cop.proceed(...args)
    }
  
})

ShowFocus.beGlobal()

ShowFocus.beNotGlobal()
```