# ContextJS

Context-oriented Programming (COP) for JavaScript

Context-oriented Programming is a programming technique that allows to define
behavioral variations of objects depending on the context in which an object is
invoked. Context may be anything from the battery status of the executing
device to software settings.
COP groups behavioral variations (i. e., alternate code to be executed for
certain methods, but with the possiblity to delegate to the original behavior)
into layers. Each layer encodes a certain aspect of context (e. g., there might
be a "low battery" layer). A layer can add partial methods, which override or
supplement ordinary methods, or partial state to objects and classes (in
ECMAScript, prototypes). Thus, COP provides a way to handle cross cutting
concerns in software systems. In contrast to Aspect-oriented Programming, the
composition of partial behavior is determined not at compile time, but at
runtime. In practice it means that layers and their associated behavioral
changes can be activated and deactivated by the program itself.

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

The contextjs module only exports the most frequently used COP facilities.
All remaining functionality can be imported from the Layers module:

```JS
import { withoutLayers, Layer } from "contextjs"
import * as cop from "contextjs/lib/Layers"
```

For example, there is a `LayerableObjectTrait`, which can be used as a starting
point for objects that can have their own context. That context is scoped by
the object composition hierarchy.

## Global import of ContextJS

If you would like to add the functions and classes exported from the
`contetxjs` Module (proceed, withLayers etc.) into the `window` or `global`
object, so you do not have to enumerate the identifiers in the import statement
and do not need to prefix them with a "namespace", you can write `import
"contextjs/lib/module_import.js"`.
