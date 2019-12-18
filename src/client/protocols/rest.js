import {Scheme}  from "src/client/poid.js"

export default class RestScheme extends Scheme {
  
  get baseURL() {
    throw new Error("subclass responsibililty")
  }
  
  resolve() {
    return true
  }  
  
  auth() {
     throw new Error("subclass responsibililty")
  }
  
  async getBearerToken() { 
    return `Bearer ${await this.auth().ensureToken()}`
  }
  
  async getDefaultHeaders(headers) {
    headers = new Headers(headers);
    headers.append('Authorization', await this.getBearerToken());
    return headers;
  }
    
  async api(method="GET", path, options={}) {
    var headers = await this.getDefaultHeaders(options.headers)
    var resp = await fetch(this.baseURL + path, {
      method: method,
      headers: headers,
      body: options.body
    })
    if (resp.status == 401) {
      await this.auth().logout()
      // try again once with new authorization... token might have beeen expired
      resp = await fetch(this.baseURL + path, {
        method: method,
        headers: headers
      })
    }
    
    
    if (resp.headers.get("content-type").match("application/json")) {
      var text = await resp.text()
      try {
        return new Response(JSON.stringify(JSON.parse(text), undefined, 2))
      } catch(e) {
        return new Response( "Could not parse: " + text, {status: 400} )
      }
    }
    return resp
  }
  
  async apiJSON(method, path) {
    return await this. api(method, path).then(r => r.json())
  }
  
  
  get path() {
    let urlObj = new URL(this.url)
    return urlObj.pathname.replace(/^\/*/,"")
  }

  async GET(options) {
    if (this.path == "logout") {
      var auth = this.auth()
      auth.logout()
      return new Response("logged out")
    }
    let urlObj = new URL(this.url)
    return await this.api("GET", this.path + urlObj.search, options)
  }
  
  async PATCH(options) {
    return await this.api("PATCH", this.path, options)
  }
  
  async PUT(options) {
    return await this.api("PUT", this.path, options)
  }
  
  async POST(options) {
    return await this.api("POST", this.path, options)
  }

  async DELETE(options) {
    return await this.api("DELETE", this.path, options)
  }
  
  async OPTIONS(options) {
    throw new Error("subclass responsibililty")
  }
}
