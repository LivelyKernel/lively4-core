## 2020-03-17
*Author: @onsetsu*

.follow is a scope-based Promise.all!
```js
var p1, p2, resolveMe
var p3 = Promise.follow(async () => {
  p1 = Promise.resolve(42);
  p2 = new Promise(resolve => {
    resolveMe = resolve;
  })
}).then(v => console.log('follow triggered', v))
```

```js
resolveMe()
```
---

