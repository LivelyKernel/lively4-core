# Active Expressions in Lively

## Transactional Integrity & Atomicity

### Assumptions
There is a need for active expression transactions as simple examples can already lead to faulty and unintended behavior when active expression trigger immediately after each change (see demos at the end). Manual and polling strategies provide atomicity on their own, so all of this only applies to the rewriting strategy.

We assume that the user does not want to or can not mark all transaction boundaries explicitly. E.g. the ES6 statement `[a, b] = [c, d];` can be used as transaction but only for locals, not across multiple scopes or to assign member variables.

### Approach
The isolation / transaction boundaries are defined by:
- Time: Call stack depth / call trace / scope
- Space: Objects and properties being observed by which active expression

The following heuristic is used:
- We use method boundaries as time restriction
- We use the first encounter of an instance as space restriction

### Implementation
In [active-expression-rewriting.js](https://lively-kernel.org/lively4/lively4-core/src/client/reactive/active-expressions/aexpr-source-transformation-propagation/src/aexpr-source-transformation-propagation.js) the class `TransactionContext` handles most of the transaction logic.
It is a singleton (global variable `transactionContext`) and keeps track of observed instances and suppressed active expressions using a member variable called `suppressed`. It is a Map of one reference counter and a aexpr set per suppressed instance. The methods `retain` (entry) and `release` (exit) are placed at specific statements via source code rewriting.
`retain` registers a suppression or increments its reference counter.
`release` decrements its reference counter and upon reaching zero it removes its suppression while checking all delayed aexprs.
Rewritten statements also call `checkDependentAExprs` leading to `tryToTrigger` which either delays their dependent aexprs until the right `release` is called or triggers them immediately, if there is no suppression registered. This implicitly performs deduplication and avoids triggering aexprs if their value is the same at the end of a transaction, even if it changed in between.

### References
- [Jeff Kramer, Jeff Magee: The Evolving Philosophers Problem - Dynamic Change Management](https://www.researchgate.net/publication/3187315_The_Evolving_Philosophers_Problem_Dynamic_Change_Management)
- [Peter Ebraert, Theo D'Hondt, Yolande Berbers: An alternative to Quiescence - Tranquility](https://www.researchgate.net/publication/224674477_An_alternative_to_Quiescence_Tranquility)
- [Transactions in MobX](https://mobx.js.org/refguide/transaction.html)

### Discussion
This approach to transactional active expressions requires the understanding of the programmer that methods are consistency boundaries of their `this` instance. It also provides the freedom to choose not to use transactions by modifying member variables from the outside. But, if member variable access form the outside is forbidden by convention for example, all changes of an instance automatically become atomic in regards to active expressions. This means that the transaction boundaries are implicitly defined by the structure of the source code. It would be interesting to compare this against a more explicit approach which might look like this:
```javascript
aexprTransaction([instanceA, instanceB, ...], [aexprA, aexprB, ...], function() {
  statementA;
  statementB;
  ...
});
```
However, this would be a library based solution as introducing our own syntax is not supported by the rewriting strategy.

### Limits / Future Work
`traceMember` has to be disabled in favor of `getAndCallMember` in [babel-plugin-active-expression-rewriting](https://lively-kernel.org/lively4/lively4-core/src/client/reactive/babel-plugin-active-expression-rewriting/index.js) because it can not be rewritten at the moment.
Also, there is no guarantee that `release` is called in case of exceptions.
But, that should be easy to fix. Far harder would probably be the unification of using async / coroutines / generator functions together with transactional active expressions.


## Demos
<script>
lively.create('lively-code-mirror').then(cm => {
  return fetch(lively4url+'/demos/trans-aexpr/rect.js').then(res => res.text()).then(txt => {
    cm.value = txt;
    return cm;
  });
});
</script>
Setting `width` and `height` after each other triggers the `aexpr(() => {return myRect.aspectRatio;})`.
But, calling `myRect.dimensions = {'width': 160, 'height': 90};` triggers nothing because the `aspectRatio` stays the same before and after `set dimensions()`.
<br/>
<br/>
<script>
lively.create('lively-code-mirror').then(cm => {
  return fetch(lively4url+'/demos/trans-aexpr/stack.js').then(res => res.text()).then(txt => {
    cm.value = txt;
    return cm;
  });
});
</script>
The `myStack.push(42);` call starts with `this.index += 1;`,
which triggers the `aexpr(() => {return myStack.top();})` because
`top()` is dependent on index: `return this.elements[this.index];`.
But `top()` is evaluated while still being in a inconsistent state: `(this.index >= this.elements.length)`.
