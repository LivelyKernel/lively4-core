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

## Installation Instructions

You can install ContextJS via npm:

    npm install contextjs

If you want install ContextJS from GitHub instead, you should use
[npm-git-install](https://github.com/lzrski/npm-git-install)
because otherwise the ES2015 code will not be transpiled automatically.

ContextJS uses ES2015, which is not yet completely supported natively by 
current browsers and Node.js. Therefore, the code must be transpiled to ES5
before use. This happens automatically through the npm prepublish script,
which is executed before the library is published to the npm registry and also
when you `npm install` it from a local working copy. But npm does not execute
this script when you install something via Git. npm-git-install alleviates this 
problem by ensuring that the prepublish script is run for Git dependencies. As
pointed out in the Readme of npm-git-install, it is a workaround until changes
are made in npm.

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
