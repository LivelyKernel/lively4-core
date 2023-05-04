## 2023-05-02
*Author: @JensLincke*

## List of Syntax Plugins

```
asyncDoExpressions (proposal)	async do { await requestAPI().json() }
asyncGenerators (proposal)	async function*() {}, for await (let a of b) {}
bigInt (proposal)	100n
classPrivateMethods (proposal)	class A { #c() {} }
classPrivateProperties (proposal)	class A { #b = 1; }
classProperties (proposal)	class A { b = 1; }
classStaticBlock (proposal)	class A { static {} }
decimal (proposal)	0.3m
decoratorAutoAccessors (proposal)	class Example { @reactive accessor myBool = false; }
decorators (proposal)
decorators-legacy	@a class A {}
destructuringPrivate (proposal)	class Example { #x = 1; method() { const { #x: x } = this; } }
doExpressions (proposal)	var a = do { if (true) { 'hi'; } };
dynamicImport (proposal)	import('./guy').then(a)
explicitResourceManagement (proposal)	using reader = getReader()
exportDefaultFrom (proposal)	export v from "mod"
exportNamespaceFrom (proposal)	export * as ns from "mod"
flow (repo)	var a: string = "";
flowComments (docs)	/*:: type Foo = {...}; */
functionBind (proposal)	a::b, ::console.log
functionSent (proposal)	function.sent
importAssertions (proposal)	import json from "./foo.json" assert { type: "json" };
importReflection (proposal)	import module foo from "./foo.wasm";
jsx (repo)	<a attr="b">{s}</a>
logicalAssignment (proposal)	a &&= b
moduleBlocks (proposal)	let m = module { export let y = 1; };
moduleStringNames (proposal)	import { "😄" as smile } from "emoji";
nullishCoalescingOperator (proposal)	a ?? b
numericSeparator (proposal)	1_000_000
objectRestSpread (proposal)	var a = { b, ...c };
optionalCatchBinding (proposal)	try {throw 0;} catch{do();}
optionalChaining (proposal)	a?.b
partialApplication (proposal)	f(?, a)
pipelineOperator (proposal)	a |> b
privateIn (proposal)	#p in obj
recordAndTuple (proposal)	#{x: 1}, #[1, 2]
regexpUnicodeSets (proposal)	/[p{Decimal_Number}--[0-9]]/v;
throwExpressions (proposal)	() => throw new Error("")
topLevelAwait (proposal)	await promise in modules
typescript (repo)	var a: string = "";
v8intrinsic	%DebugPrint(foo);
```