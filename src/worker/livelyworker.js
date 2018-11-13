// Make a window object
self.window = self;
var path = self.location.pathname.split("/")

// any idea of how to get rid of the last three elements?
path.pop() // livelyworker.js
path.pop() // /worker/
path.pop() //  src

const lively4url = self.location.origin + path.join("/");

// Load SystemJS
importScripts(lively4url + "/src/external/systemjs/system.src.js")
importScripts(lively4url + "/src/systemjs-config.js")
