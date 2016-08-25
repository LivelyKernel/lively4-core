# active-expressions
Active Expressions are meant to give the programmer the possibility to be notified as soon as the outcome of a certain expression changes.
To achieve this, the Active Expression is written as a JavaScript function and its return value will be reevaluated each time that a change to JavaScript objects or DOM elements is noticed.

## Usage
```JS
import { AExpr } from 'src/../../active-expressions/src/active-expressions.js';

let object = { hello: '' };

let expr = AExpr(
  function(obj) {
    return obj.hello;
  }
);

expr
  .applyOn(object)
  .onChange(function(obj) {
    console.log('Our object is saying hello ' + obj.hello);
  });

setTimeout(function() {
  object.hello = 'World';
}, 1000);
```

## Alternative uses for collections
```
expr.applyOn(jsObjectA);
expr.applyOn(document.querySelector('#container'));
expr.applyOnAll([jsObjectA, jsObjectB]);
expr.applyOnAll(new ActiveDOMView('div.ball'));
expr.applyOnAll(document.querySelectorAll('div.ball'));
```

## Examples
* [Temperature Slider](examples/temperature-demo.js)
* [Window Boundary Check](examples/window-demo.js)

## API
__AExpr(condition, options)__

Returns an instance of ActiveExpr with *condition* as the active expression to observe.
The *options* to be passed in are:

alwaysTrigger: Trigger callback even if the outcome of the condition did not change

---

__ActiveExpr.onChange(callback)__

Registers the *callback* to be executed on an expression change

---

__ActiveExpr.applyOn(/* arguments */)__

Registers elements that the expression should be applied on. Especially handy for handling DOM Elements.

---

__ActiveDOMView(selector, filterFunction)__

Helper, that observes the DOM for the specified query *selector*. A callback for filtering the results can be passed optionally as the *second argument*.

---

__ActiveDOMView.onEnter(callback)__

Registers the *callback* to be executed when a new DOM Element was observed. The callback receives the DOM Element as first parameter.

---

__ActiveDOMView.onExit(callback)__

Registers the *callback* to be executed when a DOM Element was removed. The callback receives the DOM Element as first parameter.