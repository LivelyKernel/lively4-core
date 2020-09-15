import {Scheme}  from "src/client/poid.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import focalStorage from "src/external/focalStorage.js"
import {parseQuery, getDeepProperty} from 'utils'

import FileIndex from "src/client/fileindex.js"

import _ from 'src/external/lodash/lodash.js'
/*MD # Abstract Class for all Bibliograpgy Schemes MD*/

export default class BibliographyScheme extends Scheme {
  
  get scheme() {
    throw new Error("subclass responsibility")
  }
  
  resolve() {
    return true
  }  
  
  generateArticlesSource(entries) {
    return "<h3>Articles</h3><ul>" + entries.map(ea => {
      return `<li><a href="bib://${ea.key}">[${ea.key}]</a> ${
        ea.authors.map(ea => `<a href="author://${ea}">${ea}</a>`).join(", ")
      }. ${
        ea.title
      }. ${
        ea.keywords.map(ea => `<a href="keyword://${ea}">${ea}</a>`).join(", ")
      }.</li>`     
    }).join("\n") + "</ul>"
  }
  
  response(content) {
    return new Response(content, {
      headers: {
        "content-type": "text/html",
      },
      status: 200,
    })
  }
  
  async searchEntries(entries, query) {
    return entries
  }
  
  async content(entries, query) {
    var content = `<h2>${this.scheme}: ${query}</h2>`
    content += this.generateArticlesSource(entries)
    return content
  }
  
  async GET(options) {
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"),"")
    if (query.length < 2)  return this.response("query to short")
    
    query = decodeURI(query)    
    var entries = await FileIndex.current().db.bibliography.toArray()
      
    entries = await this.searchEntries(entries, query)
    
    entries = _.uniqBy(entries, ea => ea.key)
    
    
    var content = await this.content(entries, query)
    
    return this.response(content)
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
