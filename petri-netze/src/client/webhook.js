import GitHub from "src/client/github.js"

// this can not be your local lively server, because it has to be reachable by the Internet
// a "localhost" server might be not....
const WebhookURL = "https://lively-kernel.org/lively4/_webhook"


export default class Webhook {

  constructor(owner, repo, callback) {
    this.owner = owner
    this.repo = repo
    this.callback = callback
  }
  
  get repositoryname() {
    return this.owner + "/" + this.repo
  }
  
  async register() {
    return fetch(WebhookURL + "/register?" + Date.now(), {
      method: "GET",
      headers: {
        repositoryname: this.repositoryname
      }
    }).then(r => r.json())
  }

  create() {
    var gh = new GitHub(this.owner, this.repo)
    return gh.ensureWebhook()
  }
  
  // for testing...
  signal() {
    return fetch(WebhookURL + "/signal", {
      method: "POST",
        headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({
        repository: {
          "full_name": this.repositoryname
        }
      })
    }).then(r => r.text())
  }

  start() {
    if (!this.running) {
      this.running = true
      this.observeWebhook()      
    }
  }
  
  stop() {
    this.running = false
  }
  
  observeWebhook() {
    if (!this.running) return
    this.register().then(change => {
      this.running && this.callback && this.callback(change)
      this.observeWebhook()
    })
  }
}

