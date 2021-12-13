# Rewriting Implementation

## Interlude

To make things even more efficient:

- dormant state
- mark, if only leaves of an expression are changed. Then, no `recalculate` is required

## Continue...
Idea: Combine the best of Rewriting and Interpretation:

- IMPLEMENT *setMember* not by rewriting but use *property accessors*!

Goal: **2nd rewriting implementation along the first** (for performance comparison)

# Setup

- get tests running locally (WebStorm, etc.)
- find a name: **modal**
- copy the system
  - copy *reactive* folder (including *test*)
    - [x] `active-expression-rewriting` -> `active-expression-modal`
    - [x] `babel-plugin-active-expression-rewriting` -> `babel-plugin-active-expression-modal`
    - [x] `test/*` -> `test/ae-modal-*`
  - strip obviously irrelevant files/folders
  - adjust *system config*
    - [x] copy aliases
    - [x] adapt rewriting settings (babel configs)
    - [x] adapt rewritings (which parts are rewritten in what manner)
      - [ ] refactor out `hasDirective`
  - adjust import paths (non local ones)
  - replace directive `"enable aexpr";` -> `"ae";`
    - also in rewriting files (tests & plugins)
    - [x] add preference *'UseModalAExprs'*
- tests deaktivieren
  - remove all irrelevant tests
  - `const xxit = xit;`
  - go through each `xit`: do we want this behavior in the new implementation?
    - if not: remove else: replace `xit` with `xxit`
  - `it` -> `xit`
  - some `before`/`afterEach` might throw
  - which tests test all implementations?
    - find them, add the new implementation

--> have **all tests passing** all the way until here

## problems

- problematic imports of `ae-rewriting`
  - source/client/interactive.JS introduces a development Layer with global variables, including the rewriting variant of active expressions
  - Lang-ext extends functions with the rewriting variant of active expressions
  - reactive object queries directly use the rewriting variant (select.js)
  - ==> use a global getter on 'window' or an accessor function. Then, import both variants and dispatch to the one currently wanted as defined by the preference *'UseModalAExprs'*

# Actual Implementation

## 1. Introduce EAM (expression analysis mode)  at body level

insight: a first-class piece of behavior can run completely either in EAM or outside EAM.

Thus, we can check if we are in EAM at the start of a FunctionBody, rather than on each member and variable access. Our initial function

```javascript
function foo() {
  obj.prop
}
```

has its body duplicated for each mode of operation:

```javascript
function foo() {
  if (self.__expressionAnalysisMode__) {
    _getMember(obj, "prop")
  } else {
    obj.prop
  }
}
```

thus, while analysing an expression, dependencies are still gathered, but outside the analysis, we only need to check one global boolean (which requires not only less redundant computation but also is more JIT friendly because we do not have centralized functions that are hard to optimize).

Same transformation needs to be applied for local variables:
```javascript
var v = 3
ae(v)
v = 5
```

```javascript
// ...
aexpr(() => v)
// ...
```

```javascript
// ...
aexpr(() => { return v; })
// ...
```

```javascript
// ...
const _scope = {}
_aexpr(() => {
  if (self.__expressionAnalysisMode__) {
    return (getLocal(_scope, 'v', v), v)
  } else {
    return v
  }
}
// ...
```

in `getLocal` we add the current aexpr as dependency to the local variable:

```javascript
if (!_scope[xName]) {
  _scope[xName] = {
    lastValue: null,
    aexprs: new Set()
  }
}
_scope[xName].aexprs.add(AEStack.top())
_scope[xName].lastValue = refFor(xValue)
```

### advantages

- low impact on standard js expectations
  - no 'cannot read [prop] of obj' anymore
  - low perf impact

### caveats

1. arrow functionExpressions may need to be rewritten to have a block as body
2. setters must be present in both -> set muss billig sein!
3. the global `self` or `__expressionAnalysisMode__` might be shadowed, we have to take care of this case (initially skip this downside with a non-colliding import: )

### downsides

- space for src code increases exponentially with nesting of functions (we have to measure this impact, e.g. by transforming all of lively and compare)
- parameters are not tracked properly this way, e.g. destructuring of arguments should be a tracked member access

## 2. Localize Read/Write Accesses for Local Variables

idea: instead of a central data structure, keep references to aexprs for locals in the `_scope` objects.

```javascript
_scope = {
  v: {
    lastValue: WeakRef|StrongRef(any),
    aexprs: [ae] // or as Set
  }
}
```

## 3. Localize Member Write Accesses (in favor of SourceCodeHooks)

- original methods/property accessors are attached to same object as `Symbol(propName)` to avoid name clashes

### caveats

1. `.length` (browser-dependent behavior for Arrays) and `obj[computedPropertyAccess]` still need to be using `setMember`
2. other special hooks still need to be there (e.g. value hook or mutation hooks)
3. `Object.freeze` could lead to error when trying to install property accessors

## 4. Minimize tracking of local variables

idea: local variables only need to be tracked, if
- **(** they leave their initial scope of declaration *(i.e. there is at least one read (#TODO: not sure if a read requires tracking) or write access to that variable in a different <span style='text-decoration: underline'>first-class functions' scope</span>, i.e. it can be passed around)*
- **AND** they are not constant *(i.e. there is a write operations somewhere for them)*
- **) OR** there is an `eval` in a subscope
  - `eval` allows to do both: to create a subscope and to perform a read or write operation on any local variable (i.e. we need to rewrite)

**Given:** the comparator function is also rewritten (to capture internal changes to a local variable that references a complex object)

caveat: imported variable bindings con be changed from external modules AND they already left their defining scope (in another module) via 'export' -> needs to be tracked

## X. Make use of *WeakRef*s to avoid leaking memory

- dependencies may have hard refs to Aexprs, but Aexprs only have weak refs to their dependencies. Thus, when not needed anymore, Aexprs get cleaned up automatically
- the AERegistry should only hold weakrefs from now on

<graphviz-dot>
<script type="graphiviz">
digraph H {
  node [fontname="Arial"];
  dep [label="Dependency"];  
  ae [label="Active Expression"];
  reg [shape="box" fontcolor=blue fontsize=12 color=gray style="filled" label="AERegistry"];
  dep -> ae;
  ae -> dep [color=grey style=dashed];
  reg -> ae [color=grey style=dashed];
}
</script>
</graphviz-dot>

## Y. Explicit Scopes for `for`-loops

- problem: variables declared in a for-loop head are defined in the for-loop's body according to babel (#BUG)
- idea: `for`-loops are always statements. Thus, wrap them into a special-case block statement and extract the variable declarations to this block:

```javascript
for (let v of [1, 2, 3]) {}
```

becomes

```javascript
{
  'for-head-scope'
  let v
  for (v of [1, 2, 3]) {}
}
```

- potential problem: have to respect destructurings

```javascript
var x, y
{
  for ([x, y=9] of ['12','34','5']){}
}
[x, y]
-> (2) ["5", 9]
```

- lucky case: as `for`-statements are always statements, we can introduce the additional block scope rather safely, e.g.:

```javascript
if (bool)
  for (let v of arr)
    for (let w of arr)
      v+w
```

becomes

```javascript
if (bool) {
  'for-head-scope'
  let v
  for (v of arr) {
    'for-head-scope'
    let w
    for (w of arr)
      v+w
  }
}
```

# Benchmarks

- need to compare performance to all other strategies
- include lively4 into Stephan Lutz's benchmark suite
