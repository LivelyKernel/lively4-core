<script>
import { editSelf } from './helpers.js'
editSelf(this)
</script>
# Change Detection and Reactive Behavior in an Active Expression-based Signal Implementation

## Signals

Signals are time-varying values.
Once defined they keep their own values consistent with their signal expression.

```javascript
const arr = [1, 2, 3]
signal sum = arr.sum() // sum -> 6
arr.push(4) // sum -> 10 updates!
```

Signals can be chained, forming a directed, acyclic graph.

```javascript
const arr = [1, 2, 3]
signal sum = arr.sum() // sum -> 6
signal len = arr.length // len -> 3
signal avg = sum / len // avg -> 2

arr.push(4) // updates: sum -> 10, len -> 4, avg -> 2.5
```

<graphviz-dot>
  <script type="graphiviz">
    digraph H {
      node [fontname="Arial"];
      arr [shape="box" label="arr"];
      sum [label="sum"];
      len [label="len"];
      avg [label="avg"];
      arr -> sum;
      arr -> len;
      len -> avg;
      sum -> avg;
    }
  </script>
</graphviz-dot>

Implementations need to prevent glitches, i.e. temporary inconsistencies resulting from incorrect execution order of signals. E.g pushing `4` into the array in an update of `len`. If this would instantly recompute `avg`, it would have the wrong value of `1.5`.

<graphviz-dot>
  <script type="graphiviz">
    digraph H {
      node [fontname="Arial"];
      arr [color=darkgreen shape="box" label="arr"];
      sum [label="sum"];
      len [color=grey label="len"];
      avg [color=red label="avg"];
      arr -> sum;
      arr -> len [color=grey style=dashed label="update"];
      len -> avg [color=grey style=dashed label="update"];
      sum -> avg;
    }
  </script>
</graphviz-dot>

This scenario should be avoided, e.g. by topological sorting.

## Implementing Signals

Idea: Using Active Expressions

### Active Expressions

A reactive primitive for state-based reactive programming concepts, to whom signals belong to.

```javascript
aexpr(expr).onChange(callback)
```

They listen to an expression and fire attached callbacks whenever the expression result changes.

To implement a signal, we can

```javascript
aexpr(signalExpressions).onChange(updateSignals)
```

### Expressing signals with Active Expressions

In particular, we can express the signal *declaration* with an Active Expression. Thus, we turn

```javascript
signal a = b.average()
```

into

```javascript
let a = (
  aexpr(() => b.average()).onChange(resolveSignals),
  signals.push(() => a = b.average()),
  b.average()
)
```

In this snippet, We

1. define an Active Expression listening for changes to the signal expression (`b.average()`) and then update the whole signal graph in a glitchfree manner.
2. add the current update callback (`() => a = b.average()`) to our list of signals
3. set the initial value of the signal

### Transforming signals into Active Expressions

Idea: **Source code transformation** to turn signal declarations into Active Expressions.

2-step process:

First, a required *Preprocessing* step to adapt variable declarations
- `signal` into `const`
- `const` into `let`

To arrive at parseable JavaScript syntax. Thus, transforming

```javascript
const arr = [1, 2, 3]
signal sum = arr.sum()
arr.push(4)
```

into

```javascript
let arr = [1, 2, 3]
const sum = arr.sum()
arr.push(4)
```

Second, apply a **babel** transformation to rewrite const declarations into Active Expression-based implementations.

### Babel Primer

Babel transpiles JavaScript code as an ast.
Individual plugins match certain node types:

```javascript
visitor: {
  CallExpression(path) {
    let callee = path.get("callee");
    if (callee.isIdentifier() && callee.node.name === 'aexpr')
      aexprs.add(path);
      // ...
```

The ast is modified in place:

```javascript
init.replaceWith(t.StringLiteral('hello'));
```

Templates create subtrees from strings (handy for larger chunks of library code).

```javascript
// define a template
const numDecl = template('var num = NUMBER;')
// instanciate a template
const varDeclTree = numDecl({ NUMBER: t.NumericLiteral(5)})
```

### Our Babel Plugin

Our plugin is implemented as a single babel plugin.

It does

1. Find all `Identifiers` in `const` declarations and rewrite them to signal declarations using the `signal` template.
2. `signal` template ensures 1. Active Expressions listen to dependencies, 2. add update callback to list of `signals`, and 3. return the signal's initial value.
3. Collect other Active Expressions to defer them after the signal graph resolved completely.
4. `solveSignals` execs all stored signal update callbacks, then, calls all other Active Expressions
5. Introduce library code to update signal graph (`solveSignals`) and wrap ordinary Active Expressions (`newAExpr`).

[View implementation in Plugin explorer](open://lively-plugin-explorer)

## Up Next

The [Tagging Task](browse://demos/stefan/aexpr-diss-inter-tagger-reliability/task/task.md) itself
