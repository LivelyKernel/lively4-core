import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";
import FileIndex from "src/client/fileindex.js"

import Literature from "src/client/literature.js"


export class BibScheme extends BibliographyScheme {
  
  get scheme() {
    return "bib"
  }
  
  async searchEntries(entries, query) {
    var key = query
    return entries.filter(entry => entry.key == key)
  }
  
  
  async content(entries, query) {
    var entry = entries[0] || {}
    var key = query
    var files = await FileIndex.current().db.files.where("bibkey").equals(key).toArray()
    
    var papers = await Literature.db.papers.where("key").equals(key).toArray()
     
    var content = `<h2>[${key}]<br/>${
        entry.authors ? 
          entry.authors.map(ea => `<a href="author://${ea}">${ea}</a>` ).join(", ") + ".": ""
        }  ${entry.year|| ""}<br/><i> ${entry.title|| ""} </i></h2>`
  
    
    
    content += "<div>" + papers.map(ea => {
      return `<a href="academic://expr:Id=${ea.microsoftid}">[academic]</a>`   
    }).join(" ") + "</div><br>"

    if (entry.keywords) {
      content += `<div><b>Keywords:</b> ${entry.keywords.map(ea => `<a href="keyword://${ea}">${ea}</a>`).join(", ") } </div>`
    }
    if (entry.source) {
      content += "<pre>" + entry.source+ "</pre>"
    }         
    content += "<h3>Documents</h3><ul>" + files.map(ea => {
      return `<li><a href="${ea.url}">${ea.name}</a></li>`     
    }).join("\n") + "</ul>"

    
    content += "<h3>Bibliographies</h3><ul>" + entries.map(ea => {
      return `<li><a href="${ea.url}">${ea.url}</a></li>`     
    }).join("\n") + "</ul>"    
    return content
  }
}

PolymorphicIdentifier.register(BibScheme)