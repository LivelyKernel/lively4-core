/*MD 
# Debugging Active Expressions and Signals in One System

```javascript {.testScript .snippet}
import run from "demos/stefan/debugging-reactive-programming-concepts.js"
run()
```
<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>
MD*/

"enable aexpr"

/*MD 
#### Idea
Our debugging toolset allows to debug multiple reactive programming concepts in conjunction, here Active Expressions and Signals
MD*/
export default async function runExample() {
  var a = 2;

  const log = <div><button click={evt => a++}>Increment variable a</button><br />Result: <br /></div>
  
/*MD
     1. Reactive declarations and dependencies are highlighted by the left-hand side gutter, e.g. RE specifies that there is a reactive declaration (a Signal) that is also used as a dependency elsewhere
     2. **click the icons** (RE, SI, AE, etc.) to
       - navigate to related code locations
       - **open** specific tools such as the timeline or an in-time graph view
MD*/ 
  always: var b = a + 1
  always: var c = b + 2

  const ae = aexpr(() => c).onChange(newValue => {
    log.insertAdjacentHTML('beforeend', `c updated to: ${newValue}</br>`)
  });

  (async function fork() {
    for (let i of [1,2,3]) {
      await lively.sleep(500)
/*MD
     - changes to dependencies are visualized in the left-hand side gutter
MD*/
      a += i
    }
  })()
  
  return log
} 
