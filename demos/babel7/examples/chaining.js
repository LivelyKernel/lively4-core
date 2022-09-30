

/*MD 
## Tests

```javascript {.testScript .snippet}
import * as m from "demos/babel7/examples/chaining.js"
m.test1()
```

<script>
  import {autoRunSnippet} from "src/client/essay.js"; 
  autoRunSnippet(this, ".testScript")
</script>

MD*/



var Foo = {
  bar() {
    return 3
  }
}

export function test1() {

    return Foo?.bar()  
}

    
export function test2() {
    return Foo?.foo?.() 
  
}


    
