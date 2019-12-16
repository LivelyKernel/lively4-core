var a = 3
var b = 4

/*MD 
   # Hello
   Example: 
   
   ```javascript {.example1}
   import {foo} from  "https://lively-kernel.org/lively4/lively4-jens/demos/javascript/hello.js"
   foo(3)
   ```
   
   <script>
     import boundEval from "src/client/bound-eval.js";
     boundEval(lively.query(this, ".example1").textContent).then(r => r.value)
     
   </script>
MD*/
export function foo(a) {
  return a + 5  
}



