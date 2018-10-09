// Make a window object
self.window = self;
const lively4url = self.location.origin + self.location.pathname.split("/").slice(0,3).join("/");


// Load SystemJS
importScripts(lively4url + "/src/external/systemjs/system.src.js")
importScripts(lively4url + "/src/systemjs-config.js")
