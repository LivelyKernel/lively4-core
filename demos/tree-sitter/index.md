# TreeSitter Experiments


&#128522;

<script>
import {Parser, JavaScript} from "src/client/tree-sitter.js"

var parser = new Parser()
parser.setLanguage(JavaScript);


const sourceCode = 'let x = 1; console.log(x);';
const tree = parser.parse(sourceCode);


"RootNode: " +  tree.rootNode.toString()




</script>

It works....

## Next Step


- [X] import tree-sitter in Lively4
- [ ] convert tree-sitter tree to domain object tree



###

- ![](match-let-const-query.png)


## Root Bindings

- a binding matches a @root
- can have a context
- and named sub-matches (call can be referenced)

![](root-binding-query-example.png)




