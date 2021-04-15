# Rewriting Implementation

Goal: **2nd rewriting implementation along the first** (for performance comparison)

# Setup

- find a name
- copy the system
  - copy *reactive* folder (including *test*) -> copy only *test*?
  - strip obviously irrelevant files/folders
  - adjust *system config*
    - copy aliases
    - adapt rewriting settings (babel configs)
    - adapt rewritings (with parts are rewritten in what manner)
  - adjust import paths (non local ones)
  - replace directive `"enable aexpr";` -> `"ae";`
    - also in rewriting files (tests & plugins)
    - add preference *"rewriting or new"*
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

### caveats

1. `.length` (browser-dependent behavior for Arrays) and `obj[computedPropertyAccess]` still need to be using `setMember`
2. other special hooks still need to be there (e.g. value hook or mutation hooks)

## 4. Minimize tracking of local variables

idea: local variables only need to be tracked, if
- they leave their initial scope of declaration (= there is at least one read (#TODO: not sure if a read requires tracking) or write access to that variable in a different first-class functions' scope, i.e. it can be passed around)
  - having `eval` in a subscope allows to read/write any local variable, thus, those also need to be rewritten
- they are not constant (there is a write operations somewhere for them)


# Benchmarks

- need to compare performance to all other strategies
- include lively4 into Stephan Lutz's benchmark suite
