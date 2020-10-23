import BibtexParser from "src/external/bibtexParse.js";
import Bibliography from "src/client/bibliography.js"

export default class SWABibliographie {
  constructor(importURL, exportURL){
    this.url = importURL
    this.exportURL = exportURL
  }
  

  importBibtex() {
    
    // var bib = BibtexParser.toJSON(file.content)
    // #ContinueHere :-)
  }  
  
  async import() {
    this.items =[];
   
    var text = await fetch(this.url).then( resp => resp.text());
    var htmlElement = <div></div>
    htmlElement.innerHTML = text

    // return "<pre>" + text.replace(/\</g,"&gt;") + "</pre

    var pubList = htmlElement.querySelectorAll(".publist")


    for(var list of pubList ) {
      for(var ea of list.childNodes) {      
        if (ea.localName == "li"){
          this.items.push(ea.innerHTML)
        }
      }
    }
    this.entries = this.parseItems(this.items)
    
    
    
    
    return this.entries
  }
  
  
  bibtexGen(item){
    var a = item.split(/<.*?>/g)
    if (!a){
      throw new Error ("could not parse item: " + item)
    }



    var authors = a[0].split(/, /g).map(ea => 
      ea.replace(/^and / , "").replace(/\. $/ , "")) 

    for (var i = 1; i < 5; i++){
      var field  = a[i]
      if (field && !year){
        var m = field.match(/[0-9]{4}/)
      if (m){
        var year = m[0]
      }
      }
    }

    if (!year){
      throw new Error ("could not find year in " + a[2],item)
    }

    var entry = {
      entryType: 'article',
      entryTags: { 
        author: authors.join(" and "),
        year: year,
        title: a[1].replace(/\. $/,"").replace(/^ /,""), 
        published: a[2].replace(/\(/,"").replace(/^ /,"").replace(/\. $/,"")
      }
    }
   entry.citationKey = Bibliography.generateCitationKey(entry)

    var bibString = BibtexParser.toBibtex([entry ], false);
    return bibString

  }
  parseItems(items){
    var entries = []
    for (var ea of items) {
      entries.push(this.bibtexGen(ea))
    }
    return entries
  }
  
  async export() {
   

    return fetch(this.exportURL, {
      method: "PUT",
      body: this.entries.join("")
    })

    // return items.map(ea => "EINTRAG:" + ea.innerHTML )

    // return htmlElement.querySelectorAll(".publist").length
  }
}



