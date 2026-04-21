# Terminal 

With authentication, we can run a command or a complete terminal session on the lively4server.

```javascript

import Terminal from "src/client/terminal.js"
var terminal = new Terminal()
terminal.url //  http://localhost:9005/lively4-core
(await terminal.run("pwd")).stdout.replace(/\n/,"")  //  /home/jens/lively4
```