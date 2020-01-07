## 2020-01-07 #LivelyServer

New stub for server based file renaming...

```javascript
fetch("https://lively-kernel.org/lively4S2/lively4-dummy/foo.js", {
  method: "MOVE",
  headers: {
    
  }
}).then(r => r.text())
```

Side node... how to restart the server: 

```javascript
fetch("https://lively-kernel.org/lively4/_meta/exit", {
  method: "MOVE",
  headers: {
    
  }
}).then(r => r.text())
```