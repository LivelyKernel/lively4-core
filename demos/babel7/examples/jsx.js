

/*MD 
## Tests

```javascript {.testScript .snippet}
import {test1} from "demos/babel7/examples/jsx.js"
test1()
```

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

MD*/


export async function test1() {
  var b = <span>xxx</span>
  debugger
  var a = <div>hello</div>
  return a
}

/*MD 

- Alternative: write the test code directly in a script... the problem is here, that it will not get rexecuted 
- #Idea: Use Babylonian Programming... Problem, Babylonian Programming uses itself Babel and has to be migrated first, so when we can use it, we don't need to any more, because then it works. 

<script>
  import {test2} from "demos/babel7/examples/jsx.js"
  test2()
</script>

MD*/

export async function test2() {
  var drawboard = await (<lively-drawboard></lively-drawboard>)
  return drawboard
}


