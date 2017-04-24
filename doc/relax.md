# Example of Tim's Relax.js


```

import Relax from "src/external/relax.js"
import {RelaxNode} from "src/external/relax.js"


var solver = new Relax()
//var a = new RelaxNode("vars['a']", ['a'], solver)
//var b = new RelaxNode("vars['b']", ['b'], solver)
solver.addVar('a', 10)
solver.addVar('b', 20)
var equalCn = new RelaxNode('vars["a"] - vars["b"]', ['a', 'b'], solver)
solver.addConstraint(equalCn)
solver.solve()
```
