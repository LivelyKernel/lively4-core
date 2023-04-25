import "src/client/protocols/gmail.js"

var GmailMessageCache
if (!GmailMessageCache) GmailMessageCache = new Map()

export class Message {
  constructor(json) {
    this.json = json
  }
  
  getHeader(name) {
    if (!this.json ||  !this.json.payload ||  !this.json.payload.headers) return;
    var data =  this.json.payload.headers.find(ea => ea.name == name)
    return data && data.value
  }
  
  get subject() {
    return this.getHeader("Subject")
  }
  
  get from() {
    return this.getHeader("From")
  }
  
  get payload() {
    return this.json.payload
  }
  
  b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str.replace(/-/g,"+").replace(/_/g,"/")).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
  get body() { 
    var body = ""
    try {
      if (this.payload.body && this.payload.body.size > 0) {
        body = this.b64DecodeUnicode(this.payload.body.data)
      } else if (this.payload.parts && this.payload.parts[0] && this.payload.parts[0].body.size > 0) {
        body = this.b64DecodeUnicode(this.payload.parts[0].body.data)
      } else {
        body = '[NO BODY..]' + this.json.snippet
      }

    } catch(e) {
      body = "[ERROR] " + e
    }
    return body
  }

  static async get(userId, messageId) {
    var json = GmailMessageCache.get(messageId) 
    if (!json) {
      json = await fetch(`gmail://${userId}/messages/${messageId}`).then(r => r.json())
      GmailMessageCache.set(json, json) 
    }
    return new Message(json)
  }
  
  
  // Message.clearCache()
  static clearCache() {
    GmailMessageCache = new Map()
  }
}