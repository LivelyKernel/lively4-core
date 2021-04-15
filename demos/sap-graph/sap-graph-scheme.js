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
  
  
  async GET(options={}) {
    
    options.headers = options.headers || {};
    
    if (new URL(this.url).pathname.match(/\/$/)) return new Response("{}", {status: 200}) // should we redirect?
    
    var resp = await this.api("GET", this.apiString)
    
    if (resp.status == "200") {
      var json = await resp.json()
      
      if (options.headers["content-type"] == "text/html") { // #TODO vs. header.get()
        
        var html = `<sap-graph src="${this.url}"></sap-graph>`
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
    var url = new URL(this.url)
    if (url.pathname.match(/.l4a$/)) return new Response("{}", {status: 300}) // #TODO how do we deal with this?
    
    if (url.pathname.match(/\/$/)) {
      return new Response("{}", {status: 200}) // should we redirect?
    }
    
    
    var resp = await this.api("GET", this.apiString)
    
    var result = {
      name: this.apiString,
      contents: []
    }   
    if (resp.status == "200") {
      var json = await resp.json()
      
      // this is hard coded in docs, but can we see it also in the schema?
      if (json['@odata.context'] == "$metadata#Customers/$entity") {
        result.contents.push({
            name: "SalesOrders", 
        })
      }
      
      
      // #TODO #Hack #SAP hardcode some links, because we cannot see how to generate them from the schema
      if(json.customerID) {
        result.contents.push({
            name: "Customer", 
            href:  "sap://Customers/" + json.customerID
        })
      }
      if(json.productID) {
        result.contents.push({
            name: "Product", 
            href:  "sap://Products/" + json.productID
        })
      }
      
      
      if (json.value && json.value.length) {
        for(var ea of json.value) {
          
          var ref = {name: "SalesOrder " + ea.id}
          
          // because sap://Customers/1005075/SalesOrders/964 does not work... 
          if (json["@odata.context"] == "$metadata#SalesOrders") {
            ref.href = "sap://SalesOrders/" + ea.id
          }
          
          result.contents.push(ref)
        }
      }

    }
    
    return new Response(JSON.stringify(result), {status: 200})
  }
}

PolymorphicIdentifier.register(SAPGraphScheme)


lively.components.addPersistentCustomTemplatePath("/demos/sap-graph/")

console.warn("LOADED sap-graph")

