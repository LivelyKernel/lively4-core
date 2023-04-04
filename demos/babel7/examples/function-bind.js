/*MD 
## Function Bind

```javascript {.testScript .snippet}
import * as m from "demos/babel7/examples/chaining.js"
m.test1()
```

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

MD*/


export function test1() {
  
  function foo() {
    return this.bar
  }

  var o = {
    bar: 3
  }

  
  return o::foo()
}

