var a = 3

/*MD
<style>
* { background-color: rgb(240,240, 240)}

</style>
   # JavaScript in Markdown in JavaScript Inception
   Example: 
   
   ```javascript {.example1}
   import {foo} from  "demos/javascript/inception.js"
   foo(3)
   ```
   <script>
     import boundEval from "src/client/bound-eval.js";
     boundEval(lively.query(this, ".example1").textContent).then(r => r.value)
     
   </script>
MD*/

export function foo(a) {
  return a + 6  
}



