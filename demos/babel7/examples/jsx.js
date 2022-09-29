

/*MD 

## Tests
<style>
pre {
  background-color: lightgray;
  padding: 20px;
}
</style>

```javascript {.testScript}
import {test1} from "demos/babel7/examples/jsx.js"
test1()
```

<script>
  import boundEval from "src/client/bound-eval.js";
  var element =  lively.query(this, ".testScript")
var run = "run: " + element.textContent;

  boundEval(element.textContent).then(r => {
    if (r.isError) {
      return <div style="	white-space: pre; background-color: red">ERROR {r.value}</div>
    }
  })
</script>


MD*/


export function test1() {
  var a = <div>hello</div>
  return a
}

    
