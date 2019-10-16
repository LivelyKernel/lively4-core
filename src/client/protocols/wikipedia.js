import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'



export class WikipediaScheme extends Scheme {
  
  get scheme() {
    return "wikipedia"
  }
  
  resolve() {
    return true
  }  
  
  async GET(options) {
    let urlObj = new URL(this.url)
    debugger
    var entry = urlObj.pathname.replace(/^\/*/,"")
    lively.notify("visit: " + entry)
    // window.open("https://www.wikiwand.com/" + entry)
    
    var lang = entry.split("/")[0]
    var query = entry.split("/")[1]
    
    var mode = "html" 
    
    return fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/${mode}/${query}`)
    // var content = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/${mode}/${query}`).then(r => r.text())
    /// return new Response(content, {status: 200})
  }

  
  async OPTIONS(options) {
    let urlObj = new URL(this.url)
    return new Response(JSON.stringify({name: urlObj.pathname}), {status: 200})
  }
  
}



PolymorphicIdentifier.register(WikipediaScheme)