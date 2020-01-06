## 2020-01-06 #MetaProgramming #Eval

Author: @jenslincke

### How to capture any binding and expose it?

We create code at runtime that when evaluated will expose local variables.
We could use it in oure #VarRecorder but it might be to meta and to slow...

```javascript
window.captureBinding = function(k) {
  return `() => {
  window.seta = function(v) { return ${k} = v}
  window.geta = function() { return ${k}}
  console.log("${k}:" + ${k})
  }`
}
`
```

#### Usage: 

```javascript
var a = 3
eval(captureBinding("a"))()
```


### Performance?

This code should only be evaluated once per module loading. But it might effect the optimization capabilities of the VM but I am unsure of this. #TODO Benchmark our rewriting....


