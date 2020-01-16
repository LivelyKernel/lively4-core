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
    
    
    var content = `<h1> [${key}] </h1>`
    

    var files = await FileIndex.current().db.files.where("bibkey").equals(key).toArray()
    content += "<ul>" + files.map(ea => {
      return `<a href="${ea.url}">${ea.name}</a>`     
    }).join("\n") + "</ul>"
    
    
    return new Response(content, {
      headers: {
        "content-type": "text/html",
      },
      status: 200,
    })
  }

  
}



PolymorphicIdentifier.register(BibScheme)