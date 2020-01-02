## 2019-12-13 #Refactoring #VarRecorder

From: @jenslincke

During heavy refactoring of our [VarRecorder](edit://src/external/babel-plugin-var-recorder-dev.js), I stumbled upon...

The following JavaScript gets rewritten 
```javascript
var a =4
```
the following way:

```javascript
var a; // A
Object.defineProperty(_recorder_.tempfile_js, "a", { // B
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
_recorder_.tempfile_js.a = 4; // C
```

We split up declaration (A) and initialization (C), between our property definition...


*But is this still necessary?*

Why not do? 

```javascript
var a = 4;
Object.defineProperty(_recorder_.tempfile_js, "a", { // B
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
```

And when we are about to hide things...


How can we compact the definition. In case we have to look into the non source mapped code?

```javascript
var a = 4; 
/*VarRec:*/Object.defineProperty(_recorder_.tempfile_js, "a", {get() { return a}, set(thisIsVererySecretVariableName) {a = thisIsVererySecretVariableName; return true}, enumerable: true, configurable: true});
```










