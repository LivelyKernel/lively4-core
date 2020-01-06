## 2019-12-16 #VarRecorder 

Failing Test:

```javascript
expect(isFunction(function foo() {}), "function foo() {}").to.be.true;
    expect(isFunction(async function foo() {}), "async function foo() {}").to.be.true;
```

## #Hack: How to capture bindings...


```javascript
window.f = function(k) {
  return `() => console.log("${k}:" + ${k})`
}

var s = `var a = 3

var b = eval(f("a"))
b()
`

eval(s)
```

## New Issue

```javascript

export class MyClass {


}

export default function myClass(evt) {
  return new MyClass(evt);
}
```


```javascript
_recorder_.tempfile_js = _recorder_.tempfile_js || {};
Object.defineProperty(_recorder_.tempfile_js, "myClass", {
  get() {
    return myClass;
  },

  set(thisIsVererySecretVariableName) {
    myClass = thisIsVererySecretVariableName;
    return true;
  },

  enumerable: true,
  configurable: true
});

export class MyClass {}

Object.defineProperty(_recorder_.tempfile_js, "MyClass", {
  get() {
    return MyClass;
  },

  set(thisIsVererySecretVariableName) {
    MyClass = thisIsVererySecretVariableName;
    return true;
  },

  enumerable: true,
  configurable: true
});
export default function myClass(evt) {
  return new MyClass(evt);
}
```



```javascript
System.register([], function (_export, _context) {
  "use strict";

  function myClass(evt) {
    return new MyClass(evt);
  }

  _export("default", myClass);

  return {
    setters: [],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};
      Object.defineProperty(_recorder_.tempfile_js, "myClass", {
        get() {
          return myClass;
        },

        set(thisIsVererySecretVariableName) {
          _export("default", myClass = thisIsVererySecretVariableName);

          return true;
        },

        enumerable: true,
        configurable: true
      });
      class MyClass {}

      _export("MyClass", MyClass);

      Object.defineProperty(_recorder_.tempfile_js, "MyClass", {
        get() {
          return MyClass;
        },

        set(thisIsVererySecretVariableName) {
          _export("MyClass", MyClass = thisIsVererySecretVariableName);

          return true;
        },

        enumerable: true,
        configurable: true
      });
    }
  };
});
```

Which leads to the error:

```javascript
import myClass from "https://lively-kernel.org/lively4/lively4-jens/tmp.js"


myClass() // Error: MyClass is not defined
```

Our previous source code rewriting did cover this.... 


