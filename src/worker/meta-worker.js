
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
          self.onmessage = async (evt) => {
            // console.log("metaworker onmessage", evt)
            
            if(m.onrequest && evt.data && evt.data.message === "systemjs-worker-request") {
              try {
                let result = await m.onrequest(...evt.data.arguments)
                  // console.log("ON MESSAGE result " + result)
                return postMessage({message: "systemjs-worker-response", 
                                    id: evt.data.id, response: result})  
              } catch(e) {
                return postMessage({message: "systemjs-worker-response", 
                                    error: "" + e, id: evt.data.id})  
              }
            }
            
            // console.log("metaworker custom onmessage", evt)
            if (m.onmessage) {
              m.onmessage(evt) 
            }
          }
        }).catch((err) => {
          // console.log("meta worker error ", err)
          postMessage({message: "error", value: err})
        })
      })
    })
  }
}


