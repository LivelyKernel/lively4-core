## 2020-12-18 Example #Connection Workspace
*Author: @JensLincke*

```javascript
import Connection from "src/components/halo/Connection.js"

var a, b, connection;

(async () => {
  a = <div>A</div>
  b = <div>B</div>
  connection = new Connection(a, "foo", b, "bar")
  connection.activate();
  
  await lively.sleep(0) // it seems to take time...
  
  a.foo = "hello3"

  await lively.sleep(0) // it seems to take time...
  
  
  if (b.bar != a.foo) {
    lively.warn("foo !== bar")
  } else {
    lively.success("foo == bar")    
  }
})()
``` 
