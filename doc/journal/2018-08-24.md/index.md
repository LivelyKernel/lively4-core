## 2018-08-24 #ContextJS

The container moved, when doing a mouse wheel zoom, but I could not find why

```javascript
cop.layer(window, "DevLayer").refineObject(lively, {
  setPosition(o, p) {
    debugger
    console.log("setPosition " + o + ", " + p)
    return cop.proceed(o, p)
  }
})

DevLayer.beGlobal()
```

With this DevLayer, I could find the source: an the [ViewNav](browse://src/client/viewnav.js) feature...


