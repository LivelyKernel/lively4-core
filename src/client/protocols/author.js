import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

import FileIndex from "src/client/fileindex.js"

export class AuthorScheme extends Scheme {
  
  get scheme() {
    return "author"
  }
  
  resolve() {
    return true
  }  
  
  async GET(options) {
    var author = this.url.replace(/author\:\/\//,"")
    
    
    var entries = await FileIndex.current().db.bibref.where("author").equals(author).toArray()
    var entry = entries[0] || {} 
    
    var content = `<h2>${author}</h2>`

    content += "<h3>Articles</h3><ul>" + entries.map(ea => {
      return `<li><a href="bib://${entries.key}">[${entries.key}] ${ea.name}</a></li>`     
    }).join("\n") + "</ul>"
    
    return new Response(content, {
      headers: {
        "content-type": "text/html",
      },
      status: 200,
    })
  }

  
}



PolymorphicIdentifier.register(AuthorScheme)