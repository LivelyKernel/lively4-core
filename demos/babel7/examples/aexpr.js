"enable aexpr"

/*MD 
# Active Expressions

```javascript {.testScript .snippet}
import {test1} from "demos/babel7/examples/aexpr.js"
test1()
```
<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>


MD*/




export async function test1() {
  
  var result = <div>Result: <br /></div>
  
  var o = {bar: 3}

  var observer

  
  function observeO(object) {
    if (observer) {
      observer.dispose()
    }

    observer = aexpr(() => {
      return object.bar
    }).onChange(() => {
      result.innerHTML += "change: " + o.bar + "</br>"
    })


  }

  observeO(o)
  
  lively.sleep(500).then(async () => {
    o.bar = 2
    await lively.sleep(500)
    o.bar = 4
  })
  
  
  return result
} 