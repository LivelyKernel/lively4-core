/* client side worker loading with SystemJS modules...*/

import Preferences from "src/client/preferences.js"

export var workers

export default class SystemjsWorker {  
  
  static get workers() {
    if (!workers) workers = new Set()
    return workers
  }
  
  constructor(url) {
    this.metaworker = new Worker("src/worker/meta-worker.js");  
    // bootstrap onmessage
    console.log("sytemjs-worker new: " + url)
    var isLoaded = false
    this.loaded = new Promise((resolve, reject) => {
      
      
      setTimeout(() => {
        if (!isLoaded) reject("timeout")
      }, 10000) // 10s then timeout?
      
      
      this.metaworker.onmessage = (evt) => {
        var msg = evt.data
        console.log(`bootstrap onmessage (${url})` , msg)
        if (msg.message == "error") {
          lively.error("[systemjs-worker]", msg.error || msg.value)
        }
        if (msg.message == "loaded") {
          console.log("worker loaded", url)
          this.metaworker.onmessage = (msg) => {
            console.log(`systemjs-worker.js metaworker.onmessage (${url})` )
            this.onmessage(msg)
          }
          isLoaded = true
          resolve(true) // worker should accept postMessages now...
        }
      }      
    })
    this.loaded.then(() => {
      console.log("systemjs loading finished: " + url)
    })
    this.metaworker.postMessage({message: "load", url: url, preferences: Preferences.config })
    SystemjsWorker.workers.add(this)
  }
  
  onmessage(evt) {
    // do nothing
  }

  terminate() {
    this.metaworker.terminate()
    SystemjsWorker.workers.delete(this)
  }
  
  async postMessage(msg) {
    await this.loaded
    console.log("systemjs-worker.js post message", msg)
    this.metaworker.postMessage(msg)
  }

}