## 2019-11-13 Working on Var Recorder 

- [babel-plugin-var-recorder.js](browse://src/external/babel-plugin-var-recorder.js) 


```javascript
import foo from "src/client/html.js"

export var a = "hello"


export function c() {
  var b = a + " world"
  foo
  return b
}
```

Currently it will be translated to:

```javascript
_recorder_.tempfile_js = _recorder_.tempfile_js || {};
_recorder_.tempfile_js.c = c;
import foo from "src/client/html.js";

_recorder_.tempfile_js.foo = foo;
export var a = "hello";

_recorder_.tempfile_js.a = a;
export function c() {
  var b = _recorder_.tempfile_js.a + " world";
  _recorder_.tempfile_js.foo;
  return b;
}
```

The problem we want to fix is line 5 `_recorder_.tempfile_js.foo = foo;`: our imported "foo" module is aliased into our global var recorder and SystemJS does not know about it!

**Idea**: We replace the aliasing asignment with a property get/set that will store the values the original variable, but still make the variable accessible from outside the scope. 

**Idea 2**: Maybe we could provide such tunnels / wormholes into other more deeply nested scopes...

**BUT** that would mean inserting a lot of getter/setter defitions into code... worsening the performance... 

OK, but lets work on the first level for now. 

```javascript
var a = 3

var myRecorderForId = {
  get foo() { return a },
  set foo(v) { return a = v }
}

myRecorderForId.foo = 4



a  //  4 it works!
```

but we need something more like this!


```javascript
var a = 3
var recorder = {}

Object.defineProperty(recorder, 'a', {
  get() { return a; },
  set(newValue) {a = newValue; return true },
  enumerable: true,
  configurable: true
});

recorder.a = 4

a  //  4 it works!
```

## It gets more complicated than expected....

```javascript
var a = 42, b = a + 3;


a = a + 1;
```

1. we should split up variable declarations into a declaration and assignment.
2. the declaration should only happen if not already declared
  - the declaration should be changed to to kind "var" (let, var, const -> var)
3. the var-recorder-property for our variable should only be declared once
4. after this the assignment can happen


```javascript
_recorder_.tempfile_js = _recorder_.tempfile_js || {};

if (!_recorder_.tempfile_js.hasOwnProperty("a")) {
  var a
}
if (!_recorder_.tempfile_js.hasOwnProperty("a")) {
  Object.defineProperty(_recorder_.tempfile_js, "a", {
    get() {
      return a;
    },

    set(thisIsVererySecretVariableName) {
      a = thisIsVererySecretVariableName;
      return true;
    },

    enumerable: true,
    configurable: true
  });
}

recorder_.tempfile_js.a  = 42

var b = _recorder_.tempfile_js.a + 3;

if (!_recorder_.tempfile_js.hasOwnProperty("b")) {
  Object.defineProperty(_recorder_.tempfile_js, "b", {
    get() {
      return b;
    },

    set(thisIsVererySecretVariableName) {
      b = thisIsVererySecretVariableName;
      return true;
    },

    enumerable: true,
    configurable: true
  });
}


_recorder_.tempfile_js.a = _recorder_.tempfile_js.a + 1;
```

## Open Issues:

The semantics of `var` and `let` should be pretty similar on a global level... **BUT** there are differences... but that will worry only "future us".

```
a // undefined

var a = 42
```

But let throws an reference error:

```
a // reference error

let a = 42
```

