/* client side worker loading with SystemJS modules...*/

export var workers = new Set()

export default class SystemjsWorker {  
  constructor(url) {
    this.metaworker = new Worker("src/worker/meta-worker.js");  
    // bootstrap onmessage
    this.loaded = new Promise(resolve => {
      this.metaworker.onmessage = (evt) => {
        var msg = evt.data
        console.log("bootstrap onmessage", msg)
        if (msg.message == "error") {
          lively.error(msg.error)
        }
        if (msg.message == "loaded") {
          lively.notify("worker loaded", url)
          this.metaworker.onmessage = (msg) => {
            console.log("new onmessage")
            this.onmessage(msg)
          }
          resolve() // worker should accept postMessages now...
        }
      }      
    })
    this.metaworker.postMessage({message: "load", url: url})
    workers.add(this)
  }
  
  onmessage(evt) {
    // do nothing
  }

  terminate() {
    this.metaworker.terminate()
    workers.delete(this)
  }
  
  async postMessage(msg) {
    await this.loaded
    this.metaworker.postMessage(msg)
  }

}