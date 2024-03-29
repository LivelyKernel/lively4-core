/*MD # client side worker loading with SystemJS modules...MD*/

import Preferences from "src/client/preferences.js"

export var workers



export default class SystemjsWorker {  
  
  static get workers() {
    if (!workers) workers = new Set()
    return workers
  }

  newId() {
    return this.idCounter++
  }
  
  
  constructor(url) {
    /*MD The meta-worker is the actual worker, that is generic will load the actual systemjs module, which contains the client code MD*/
    this.idCounter = 1
    this.resolveRequestForId = new Map()
    this.rejectRequestForId = new Map()
    this.startTimeForId = new Map()
    
    this.timeout=1000
    
    this.metaworker = new Worker("src/worker/meta-worker.js");  
    /*MD ## bootstrap onmessage MD*/    
    // console.log("sytemjs-worker new: " + url)
    var isLoaded = false
    this.loaded = new Promise((resolve, reject) => {
      
      
      setTimeout(() => {
        if (!isLoaded) reject("timeout while loading systemjs")
      }, 10000) // 10s then timeout?
      
      /*MD ### Setup: install a message for loading, that will be rpelaced later MD*/
      this.metaworker.onmessage = (evt) => {
        var msg = evt.data
        // console.log(`bootstrap onmessage (${url})` , msg)
        if (msg.message == "error") {
          lively.error("[systemjs-worker]", msg.error || msg.value)
        }
        if (msg.message == "loaded") {
          // console.log("worker loaded", url) 
          /*MD ### Important: here the actual client message is installed MD*/
          this.metaworker.onmessage = async (evt) => {
            // console.log("systemjs-worker.js ON MESSAGE", evt)
            let msg = evt.data
            // check if we handle it ourself
            if (msg && msg.message === "systemjs-worker-response") {
              return this.handleResponse(msg)
            }
            
            if(this.onrequest && evt.data && evt.data.message === "systemjs-system-request") {
              try {
                let result = await this.onrequest(...evt.data.arguments)
                return this.postMessage({message: "systemjs-system-response", 
                                    id: evt.data.id, response: result})  
              } catch(e) {
                return this.postMessage({message: "systemjs-system-response", 
                                    error: "" + e, id: evt.data.id})  
              }
            }
            
            
            // console.log(`systemjs-worker.js metaworker.onmessage (${url})` )
            this.onmessage(evt)
          }
          isLoaded = true
          resolve(true) // worker should accept postMessages now...
        }
      }      
    })
    this.loaded.then(() => {
      // console.log("systemjs loading finished: " + url)
    })
    this.metaworker.postMessage({message: "load", url: url, preferences: Preferences.config })
    SystemjsWorker.workers.add(this)
  }
  
  onmessage(evt) {
    // do nothing
  }

  onrequest(...args) {
    // do nothing
  }

  
  handleResponse(msg) {
    // console.log("handleResponse ", msg)
    var resolve = this.resolveRequestForId.get(msg.id)
    var reject = this.rejectRequestForId.get(msg.id)
    if (!resolve) {
      throw new Error("No resolve func for message " + msg.id + ", " + msg.response)
    }
    this.resolveRequestForId.set(msg.id, null)
    this.rejectRequestForId.set(msg.id, null)
    if (!msg.error) {
      // console.log("FINISHED " + msg.id + " in " + (performance.now() - this.startTimeForId.get(msg.id)) + "ms response: " +msg.response )
      resolve(msg.response)      
    } else {
      reject(msg.error)      
    }
  }
  
  async postRequest(...data) {
     
    let id = this.newId()
    // console.log("POST REQUEST " + id)
    this.startTimeForId.set(id, performance.now())
    let promise = new Promise((resolve, reject) => {
      this.resolveRequestForId.set(id, resolve)
      this.rejectRequestForId.set(id, reject)
      this.postMessage({message: "systemjs-worker-request", id: id, arguments: data})
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

  terminate() {
    this.metaworker.terminate()
    SystemjsWorker.workers.delete(this)
  }
  
  async postMessage(msg) {
    await this.loaded
    // console.log("systemjs-worker.js post message", msg)
    this.metaworker.postMessage(msg)
  }

}