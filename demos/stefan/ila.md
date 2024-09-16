# Implicit Layer Activation in ContextJS: A Toy Example #Bug

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

```JavaScript {.testScript}
import * as cop  from "src/client/ContextJS/src/contextjs.js";

let bool = false

let l = cop.layer().refineObject({}, {

    // focus(...args) {
    //   lively.showElement(this)
    //   console.log("focus " + this, lively.stack())
    //   return cop.proceed(...args)
    // }
  
})


l.activeWhile(() => bool, aexpr)
l.onActivate(() => {
  Object.assign(toggleButton.style, {
    background: 'linear-gradient(#dc5f59, #b33630)',
    color: 'white'
  })
})
l.onDeactivate(() => {
  Object.assign(toggleButton.style, {
    background: 'linear-gradient(#00dd00, #00a000)',
    color: 'white'
  })
})

const toggleButton = <button click={evt => bool = !bool}>Toggle</button>

const group = <div>
      Toggle layer: {toggleButton}
</div>;

group
```
