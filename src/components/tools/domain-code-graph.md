```javascript {.source}
// hello
let a = 3 + 4
```

<script>

  import {TreeSitterDomainObject, LetSmilyReplacementDomainObject} from "src/client/domain-code.js"
  import DomainCodeGraph from "./domain-code-graph.js"


  var astInspector = await (<lively-ast-treesitter-inspector></lively-ast-treesitter-inspector>)
  var node = await astInspector.treeSitterParse(lively.query(this, ".source").textContent)

  var domainObject = TreeSitterDomainObject.fromTreeSitterAST(node.rootNode)
  domainObject.replaceType('lexical_declaration', LetSmilyReplacementDomainObject)
  
  DomainCodeGraph.create(this, {domainObject: domainObject})
</script>