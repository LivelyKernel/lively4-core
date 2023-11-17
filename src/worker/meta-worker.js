
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
            
            // system -request-> worker -response-> system
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
            
            //  worker -request-> system -response-> worker
            if(evt.data && evt.data.message === "systemjs-system-response") {
              return handleResponse(evt.data)
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

let systemRequestIdCounter = 1
let resolveRequestForId = new Map()
let rejectRequestForId = new Map()
postRequest = async function(...data) {
    let id = systemRequestIdCounter++
    let promise = new Promise((resolve, reject) => {
      resolveRequestForId.set(id, resolve)
      rejectRequestForId.set(id, reject)
      postMessage({message: "systemjs-system-request", id: id, arguments: data})
      var start = performance.now()
      if (this.timeout !== Infinity && this.timeout > 0) {
        
        setTimeout(() => {
          var unhandledRequestResolve = this.resolveRequestForId.get(id)
          if (unhandledRequestResolve) {
            reject( "request timeout after " + (performance.now() - start) + "ms")
          } 
        }, this.timeout)
      }
    })
    return promise
  
}



function handleResponse(msg) {
  var resolve = resolveRequestForId.get(msg.id)
  var reject = rejectRequestForId.get(msg.id)
  if (!resolve) {
    throw new Error("No resolve func for message " + msg.id + ", " + msg.response)
  }
  resolveRequestForId.set(msg.id, null)
  rejectRequestForId.set(msg.id, null)
  if (!msg.error) {
    resolve(msg.response)      
  } else {
    reject(msg.error)      
  }
}

