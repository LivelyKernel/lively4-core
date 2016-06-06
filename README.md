# ContextJS

Context-oriented Programming (COP) for JavaScript


## Example Code 

```JS
import * as cop from "https://lively-kernel.org/lively4/ContextJS/Layers.js"

class Foo {
	bar() {
		return 3
	}
}

const L1 = cop.create("L1")
L1.refineClass(Foo, {
	bar() { return cop.proceed() + 4}
})

let o = new Foo()
o.bar()  // 3
cop.withLayers([L1], () => o.bar())  // 7
```
