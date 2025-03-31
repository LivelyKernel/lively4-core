import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";

import FileIndex from 'src/client/fileindex.js';

import Bibliography from 'src/client/bibliography.js'

export class KeywordScheme extends BibliographyScheme {
  
  get scheme() {
    return "keyword"
  }
  
  async searchEntries(entries, query) {
    var keyword = query
   
    var tag = "#" + keyword
    
    var files = await FileIndex.current().db.files.where("keywords").equals(tag).toArray()
    let keys = files.map(ea => Bibliography.urlToKey(ea.url))
    keys = _.uniq(keys)
    let result =  entries.filter(entry => keys.includes(entry.key) || (entry.keywords && entry.keywords.find(ea => ea.match(keyword))))
    
    result = _.uniqBy(result, ea => ea.key)
    
    return result
  }  
  
  async content(entries, query) {
    let keyword = query
    var content = `<h2>${this.scheme}: ${query}</h2>`
    
    for(let entry of entries) { 
      content += `<lively-bibtex-entry>${entry.source}</lively-bibtex-entry>`  
      var files = await FileIndex.current().db.files.where("bibkey").equals(entry.key).filter(ea => ea.url.match(/keywords$/)).toArray()
      if (files[0]) {
        content += files[0].keywords.map(ea => `<a href="keyword://${ea.replace(/#/,"")}">${ea}</a>`)
      }
    }    
 
    return content
  }
}

PolymorphicIdentifier.register(KeywordScheme)