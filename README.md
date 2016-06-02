# ContextJS

Context-oriented Programming (COP) for JavaScript


## Example Code 

```JS
import cop from "https://lively-kernel.org/lively4/ContextJS/Layers.js"

class Foo {
	bar() {
		return 3
	}
}

var L1 = cop.create("L1")
L1.refineClass(Foo, {
	bar: function() { return cop.proceed() + 4}
})

var o = new Foo()
o.bar()
cop.withLayers([L1], () => o.bar())
```