# Rewriting Implementation

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
  - 
# Actual Implementation

## 1. Introduce EAM at body level

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

### advantages

- low impact on standard js expectations
  - no 'cannot read [prop] of obj' anymore
  - low perf impact

### caveats

1. arrow functionExpressions may need to be rewritten to have a block as body
2. setters must be present in both
3. the global `self` or `__expressionAnalysisMode__` might be shadowed, we have to take care of this case (initially skip this downside with a non-colliding import: )

### downsides

- space for src code increases exponentially with nesting of functions (we have to measure this impact, e.g. by transforming all of lively and compare)
- parameters are not tracked properly this way, e.g. destructuring of arguments should be a tracked member access

## 2. Localize Read/Write Accesses for Local Variables

idea: instead of a central data structutr, keep refereces to aexprs for locals in the `_scope` objects.

## 3. Localize Member Write Accesses (in favor of SourceCodeHooks)

- original methods/property accessors are attached to same object as `Symbol(propName)` to avoid name clashes

### caveats

1. `.length` (browser-dependent behavior for Arrays) and `obj[computedPropertyAccess]` still need to be using `setMember`
2. other special hooks still need to be there (e.g. value hook or mutation hooks)
3. `Object.freeze` could lead to error when trying to install property accessors

## 4. Minimize tracking of local variables

idea: local variables only need to be tracked, if
- **(** they leave their initial scope of declaration *(i.e. there is at least one read (#TODO: not sure if a read requires tracking) or write access to that variable in a different first-class functions' scope, i.e. it can be passed around)*
- **AND** they are not constant *(i.e. there is a write operations somewhere for them)*
- **) OR** there is an `eval` in a subscope
  - `eval` allows to do both: to create a subscope and to perform a read or write operation on any local variable (i.e. we need to rewrite)

**Given:** the comparator function is also rewritten (to capture internal changes to a local variable that references a complex object)

# Benchmarks

- need to compare performance to all other strategies
- include lively4 into Stephan Lutz's benchmark suite
