## 2020-01-13 #Move Files
*Author: @phoeinx*


## Client API 


### url as destination

```javascript
fetch("https://lively-kernel.org/lively4S2/lively4-dummy/foo.js", {
  method: "MOVE",
  headers: {"destination": "https://lively-kernel.org/lively4S2/lively4-dummy/bar.js"}
       }).then(r => r.text())
```    



### absolute path as destination

```javascript
fetch("https://lively-kernel.org/lively4S2/lively4-dummy/foo.js", {
  method: "MOVE",
  headers: {"destination": "/lively4S2/lively4-dummy/bar.js"}
       }).then(r => r.text())
```    


### relative path as destination

```javascript
fetch("https://lively-kernel.org/lively4S2/lively4-dummy/foo.js", {
  method: "MOVE",
  headers: {"destination": "./bar.js"}
       }).then(r => r.text())
```





