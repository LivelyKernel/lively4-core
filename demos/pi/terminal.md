## Terminal Server

```
jens@raspberrypi:~/lively4/xterm.js/demo $ node server.js 
App listening to http://0.0.0.0:3000
Created terminal with PID: 27417
```

## Terminal

Start terminal...

```javascript
import Terminal from "http://172.21.13.255:9005/xterm.js/build/xterm.js"
import {attach} from "http://172.21.13.255:9005/xterm.js/build/addons/attach/attach.js"

lively.loadCSSThroughDOM("xterm", "http://172.21.13.255:9005/xterm.js/build/xterm.css")
var w, terminal, term, port;

(async () => {
  w = await lively.create("lively-window")
  terminal = document.createElement("div")
  w.appendChild(terminal)
  term = new Terminal();
  term.open(terminal)
  port = await fetch("http://172.21.13.255:3000/terminals?cols=88&rows=24", {
    method: "POST", 
    headers: {
    }
  }).then(r => r.text())  
  var socketURL = "ws://172.21.13.255:3000/terminals/" + port
  var socket = new WebSocket(socketURL)
  attach(term, socket, true)
})()
```

### Python

```javascript
term.__sendData(`python\n`)

term.__sendData(`
from sense_hat import SenseHat
sense = SenseHat()
sense.show_message("Hello world")
`)

term.__sendData(`exit()\n`)

```


window.term = term


```javascript
var codeMirror = that
term.on("data", data => lively.notify("data " + data))


codeMirror.boundEval = async (str) => {
  var result = ""
  term.__socket.addEventListener('message', function (event) {
    result += event.data;
  });
  // how long do we want to wait?
  
  term.__sendData(str + "\n")

  while(!result.match(">>>")) {
    // busy wait for the prompt
    await lively.sleep(50) 
  }
  // strip input and prompt.... oh what a hack
  return {value: result.replace(str,"").replace(/^[\r\n]+/,"").replace(/>>> $/,"")}
}
 
 
```


... #Continue add this somehow into default .... 

- where to get the ip address from python?
- config and store it in lively preferences.... "localhost" should be default 
- how to secure it? store some kind of application key also in localstore... has to be checked in server





