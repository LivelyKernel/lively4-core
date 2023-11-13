
var path = self.location.pathname.split("/")
// any idea of how to get rid of the last three elements?
path.pop() // livelyworker.js
path.pop() // /worker/
path.pop() //  src
self.lively4url = self.location.origin + path.join("/");

importScripts("./livelyworker.js")

onmessage = function(evt) {
  // console.log("metaworker initial onmessage", evt)
  if (evt.data.message == "load")  {
    // console.log("meta worker load "  + evt.data.url)
    System.import("src/plugin-babel.js").then(() =>  {
      System.import("src/client/preferences.js").then((mod) => {
        var Preferences = mod.default
        if (evt.data.preferences) {
          Preferences.config = evt.data.preferences
        }

        System.import(evt.data.url).then((m) => {
          postMessage({message: "loaded"})
          self.onmessage = (...args) => {
            // console.log("metaworker custom onmessage", args)
            m.onmessage(...args) 
          }
        }).catch((err) => {
          console.log("meta worker error ", err)
          postMessage({message: "error", value: err})
        })
      })
    })
  }
}


