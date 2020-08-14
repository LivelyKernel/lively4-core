import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

var lastTokenPromted


// focalStorage.setItem("sap-graph-token", undefined)

export class SAPGraphScheme extends Scheme {
  
  get scheme() {
    return "sap"
  }
  
  async token() {
    var token = await focalStorage.getItem("sap-graph-token")
    if(!token && (!lastTokenPromted || ((Date.now() - lastTokenPromted) > 1000 * 5))) { // don't ask again for 5 seconds...
      lastTokenPromted = Date.now()
      token = await lively.prompt("sap token required: ")
      if (token) {
        focalStorage.setItem("sap-graph-token", token)
      }
    }
    return token
  }

  resolve() {
    return true
  }  
 
  get apiString () {
    return this.url.replace(this.scheme + "://","")
  }
  
  
  async GET(options) {
    var resp = await this.api("GET", this.apiString)
    
    if (resp.status == "200") {
      var json = await resp.json()
      
      if (options.headers["content-type"] == "text/html") { // #TODO vs. header.get()
        var html = `<sap-graph src="${"https://api.graph.sap/beta/" + apiString}"></sap-graph>`
        
        
        return new Response(html, resp.headers)  
      }
      var text = JSON.stringify(json, undefined, 2)
      
      
      return new Response(text, resp.headers)
    }
    
    return resp
  }

  
  async api(method, apiString) {
    var token = await this.token()
    return fetch("https://api.graph.sap/beta/" + apiString, {
      method: method,
      headers: {
        authorization: "Bearer " + token,
        landscape: "Demo"
        
      }
    })
  }
  

  async OPTIONS() {
    // #Hack
    if (new URL(this.url).pathname.match(/.l4a$/)) return new Response({}, {status: 300}) // #TODO how do we deal with this?
    
    var resp = await this.api("GET", this.apiString)
    
    var result = {
      name: this.apiString,
      contents: []
    }   
    if (resp.status == "200") {
      var json = await resp.json()
      
      if (json.value && json.value.length) {
        for(var ea of json.value) {
          result.contents.push({name: ea.id})
        }
      }

    }
    
    return new Response(JSON.stringify(result), {status: 200})
  }
}

PolymorphicIdentifier.register(SAPGraphScheme)


lively.components.addPersistentCustomTemplatePath("/demos/sap-graph/")

console.warn("LOADED sap-graph")

