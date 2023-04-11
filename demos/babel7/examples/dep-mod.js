

/*MD 
## Tests

```javascript {.testScript .snippet}
import * as m from "demos/babel7/examples/dep-mod.js"
m.useBar()
```

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

MD*/


import {bar, updateBar} from "./foo.js"


export function useBar() {
  var result = ""
  
  result += bar + "\n"
  updateBar()
  result += bar + "\n"
  
  
  return result
}

