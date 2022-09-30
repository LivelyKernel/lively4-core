/*MD 

## Tests

```javascript {.testScript .snippet}
import {test1} from "demos/babel7/examples/async.js"
test1()
```
<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

MD*/


export async function test1() {

  await lively.sleep(100)
  
  return 3
}

    


