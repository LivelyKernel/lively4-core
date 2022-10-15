/*MD 

## Tests

```javascript {.testScript .snippet}
import {test1} from "demos/babel7/examples/do-expressions.js"
test1()
```
<script>
import {autoRunSnippet} from "src/client/essay.js"; 
autoRunSnippet(this, ".testScript")

</script>

MD*/


export function test1() {
  
  function f() {
    return 3
  }

  let x = do {
    let tmp = f();
    tmp * tmp + 1
  };
  
  var z;
  
  return x

}

