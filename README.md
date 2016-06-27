# ContextJS

Context-oriented Programming (COP) for JavaScript


## Example Code 

```JS
import "https://lively-kernel.org/lively4/ContextJS"

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
import "https://lively-kernel.org/lively4/ContextJS"
import * as cop from "https://lively-kernel.org/lively4/ContextJS/Layer.js"
```