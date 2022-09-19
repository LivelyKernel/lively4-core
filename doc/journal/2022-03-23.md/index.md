## 2022-03-23 #LastAufDemSystem #rest
*Author: @JensLincke*

```javascript

Promise.resolve().then(() => {
  for(var i=0; i< 10000000; i++) {
    Math.sqrt(Math.random())
  }
  return 3
})
lively.rest()

// RESOLVED: 254.89999997615814

```

