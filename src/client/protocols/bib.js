import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

import FileIndex from "src/client/fileindex.js"

export class BibScheme extends Scheme {
  
  get scheme() {
    return "bib"
  }
  
  resolve() {
    return true
  }    
  
  async GET(options) {
    var key = this.url.replace(/bib\:\/\//,"")
    
    
    var entries = await FileIndex.current().db.bibliography.where("key").equals(key).toArray()
    var entry = entries[0] || {} 
    
    var content = `<h2>[${key}]<br/>${entry.authors ? entry.authors + ".": ""}  ${entry.year|| ""}<br/><i> ${entry.title|| ""} </i></h2>`
  
    if (entry.source) {
      content += "<pre>" + entry.source+ "</pre>"
    
    }
    
  
    var files = await FileIndex.current().db.files.where("bibkey").equals(key).toArray()
    
    content += "<h3>Documents</h3><ul>" + files.map(ea => {
      return `<li><a href="${ea.url}">${ea.name}</a></li>`     
    }).join("\n") + "</ul>"
    
    
    content += "<h3>Bibliographies</h3><ul>" + entries.map(ea => {
      return `<li><a href="${ea.url}">${ea.url}</a></li>`     
    }).join("\n") + "</ul>"
    
    
  
    return new Response(content, {
      headers: {
        "content-type": "text/html",
      },
      status: 200,
    })
  }
  
  
   async OPTIONS(options) {
    
    var content = JSON.stringify({}, undefined, 2)
  
     
    return new Response(content, {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    })
  }
  
  

  
}



PolymorphicIdentifier.register(BibScheme)