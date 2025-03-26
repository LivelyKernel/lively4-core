import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";
import FileIndex from "src/client/fileindex.js"

import Literature from "src/client/literature.js"

import Bibliography from 'src/client/bibliography.js'
import Strings from 'src/client/strings.js'  


export class BibScheme extends BibliographyScheme {
  
  get scheme() {
    return "bib"
  }
  
  async searchEntries(entries, query) {
    var key = query
    return entries.filter(entry => entry.key == key)
  }
  
  
  async content(entries, query) {
    var entry = entries.filter(ea => !ea.url.match(/_marker/))[0]
    if (!entry) entry =  entries[0] // only used citation bibs if there are  no real ones
    if (!entry) entry = {authors: undefined, keywords: undefined, title: ""}
    var key = query
    var files = await FileIndex.current().db.files.where("bibkey").equals(key).toArray()
    var literatureNotes = await FileIndex.current().db.files
      .filter( ea => ea.name.match(key + ".md")).toArray()

    
    var papers = await Literature.db.papers.where("key").equals(key).toArray()
     
    var content = `<h2>[${key}]<br/>${
        entry.authors ? 
          entry.authors.map(ea => `<a href="author://${ea}">${ea}</a>` ).join(", ") + ".": ""
        }  ${entry.year|| ""}<br/><i> ${entry.title|| ""} </i></h2>`
  
    if (papers.length > 0) {
      content += "<div>" + papers.map(ea => {
        return `<literature-paper mode="short" scholarid="${ea.scholarid}"></literature-paper>`   
      }).join(" ") + "</div><br>"      
    } else if(entry.alexid) {
      content += "<div>" + `<a href="alex://browse/${entry.alexid}">[OpenAlex]</a>` + "</div><br>"
    } else if (entry.year) {
      content += "<div>" + `<a href="scholar://browse/paper/search?query=${entry.title}">[search scholar]</a>` + "</div><br>"
    }

    if (entry.keywords) {
      content += `<div><b>Keywords:</b> ${entry.keywords.map(ea => `<a href="keyword://${ea}">${ea}</a>`).join(", ") } </div>`
    }
    if (entry.source) {
      content += "<pre>" + entry.source+ "</pre>"
    }         
    content += "<h3>Documents</h3><ul>" + (files.concat(literatureNotes)).map(ea => {
      return `<li><a href="${ea.url}">${ea.name}</a></li>`     
    }).join("\n") + "</ul>"

    
    content += "<h3>Bibliographies</h3><ul>" + entries
      .filter(ea => !ea.url.match(/_marker/))
      .map(ea => {
      return `<li><a href="${ea.url}">${ea.url}</a></li>`     
    }).join("\n") + "</ul>"  
  
    
    
    content += "<h3>Citations</h3><ul>" + entries
      .filter(ea => ea.url.match(/_marker/))
      .map(ea => {
        let key = Bibliography.urlToKey(ea.url)
      return `<li><a href="bib://${key}">${key}</a></li>`     
    }).join("\n") + "</ul>"  
    
    var file = files[0]
    if (file) {
      let dir = lively.files.directory(file.url)
      var basename = new URL(file.url).pathname.replace(/.*\//,"").replace(/\..*/,"")
      
      let keywordsURL = dir + "_marker/" + basename + "/" + basename + ".keywords"
      if (await lively.files.exists(keywordsURL)) {
        content += "<h3>Generated Keywords</h3>"   
        // #TODO extract this keyword generation into fileindex...
        // #TODO let the keyword search work on generatedKeywords too
        let keywords = await fetch(keywordsURL).then(r => r.text())
        keywords = keywords.split("\n")
            .filter(ea => ea.match(/[A-Za-z]/))
            .map(ea => ea.replace(/^ */, ""))
            .map(ea => ea.replace(/ *$/, ""))
            .map(ea => ea.replace(/^- /, ""))
            .map(ea => ea.replace(/-/g, " "))
            .map(ea => ea.replace(/^[0-9]+\. /, ""))
            .map(ea => Strings.toCamelCase(Strings.toUpperCaseFirst(ea)))
            .map(ea => '<a href="keyword://' + ea + '">' + ea +'</a>')
            .join(", ")
        
        content += "" + keywords
      }

      let bibURL = dir + "_marker/" + basename + "/" + basename + ".bib"
      if (await lively.files.exists(bibURL)) {
        content += "<h3>References</h3>"   
        let references = await fetch(bibURL).then(r => r.text())
        content += "<lively-bibtex>" + references + "</lively-bibtex>"
      }
    
      // content += "Generated Keywords: " + keywords
    }
    
    
    return content
  }
}

PolymorphicIdentifier.register(BibScheme)