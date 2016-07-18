# ContextJS

Context-oriented Programming (COP) for JavaScript


## Example Code 

```JS
import { layer, proceed, withLayers } from "contextjs"

class Foo {
	bar() {
		return 3
	}
}

const L1 = layer("L1")
L1.refineClass(Foo, {
	bar() { return proceed() + 4}
})

let o = new Foo()
o.bar()  // 3
withLayers([L1], () => o.bar())  // 7
```

## Further Functionality

Further functionality can be added via

```JS
import { withoutLayers, Layer } from "contextjs"
import * as cop from "contextjs/lib/Layers"
```

# Global import of ContextJS

If you would like to add the functions and classes exported from the
`contetxjs` Module (proceed, withLayers etc.) into the `window` or `global`
object, so you do not have to enumerate the identifiers in the import statement
and do not need to prefix them with a "namespace", you can write `import
"contextjs/lib/module_import.js"`.
