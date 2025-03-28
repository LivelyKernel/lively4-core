# ContextJS in Action: ShowFocus Layer

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

```JavaScript {.testScript}
import * as cop  from "src/client/ContextJS/src/contextjs.js";

cop.layer(window, "ShowFocus").refineClass(HTMLElement, {

    focus(...args) {
      lively.showElement(this)
      console.log("focus " + this, lively.stack())
      return cop.proceed(...args)
    }
  
})

const group = <div>
  Click the buttons to activate the layer globally.<br/>
  While active, the layer visually shows which HTMLElements get focussed.
  <button click={evt => ShowFocus.beGlobal()}>Make Global</button>
  <button click={evt => ShowFocus.beNotGlobal()}>Undo Global</button>
  Done using the following code:
</div>;

group
```
