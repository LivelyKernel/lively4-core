## 2019-05-09 Mounts without SWX

Given the fact that you used Lively4's mounts feature... e.g. with something like this:
```javascript

import focalStorage from "src/external/focalStorage.js"
var mounts = [
  {
    "path": "/localjens",
    "name": "http",
    "options": {
      "base": "http://localhost:9005/lively4-jens"
    }
  }
]
focalStorage.setItem("lively4mounts", mounts)

```

Using our new client side fetch handler in [boot.js](browse://boot.js), we can do the following again:

```javascript
fetch("https://lively4/localjens/foo.txt", {
  method: "PUT",
  body: "hello 3"
}).then(r => r.text())
// RESOLVED: {
//   "type": "file",
//   "name": "foo.txt",
//   "size": 7,
//   "version": "7ef7a0b9e37eba17bed9e94cac610d3d26e8fb7d",
//   "modified": "2019-05-09 11:12:31"
// }

fetch("https://lively4/localjens/foo.txt").then(r => r.text())

// RESOLVED: hello 3


fetch("https://lively4/localjens/foo.txt", {
  method: "OPTIONS"
}).then(r => r.text())
// RESOLVED: {
//   "type": "file",
//   "name": "foo.txt",
//   "size": 7,
//   "version": "7ef7a0b9e37eba17bed9e94cac610d3d26e8fb7d",
//   "modified": "2019-05-09 11:12:31"
// }

```


