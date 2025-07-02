import BibtexParser from "src/external/bibtexParse.js";
import Bibliography from "src/client/bibliography.js"
import Strings from 'src/client/strings.js'
import Files from 'src/client/files.js'
import { AlexPaper, Paper } from "src/client/literature.js"

export default class SWABibliographie {
  constructor(importURL, exportURL, bibURL) {
    this.url = importURL
    this.exportURL = exportURL
    this.bibURL = bibURL
    this.searchResults = new Map()
  }

  async bibtoJSON() {
    var source1 = await fetch(this.exportURL).then(resp => resp.text())
    this.bib1 = BibtexParser.toJSON(source1, false)
    var source2 = await fetch(this.bibURL).then(resp => resp.text())
    this.bib2 = BibtexParser.toJSON(source2, false)
    return this.bib1, this.bib2
  }

  compare() {
    var a = this.bib1
    var b = this.bib2
    var comp = ea => ea.citationKey
    this.inAandB = []
    this.onlyInA = []
    this.onlyInB = []

    var found
    for (var eaA of a) {
      found = b.find(eaB => comp(eaB) == comp(eaA))
      if (found) {
        this.inAandB.push(eaA)
      } else {
        this.onlyInA.push(eaA)
      }
    }

    for (var eaB of b) {
      found = a.find(eaA => comp(eaA) == comp(eaB))
      if (!found) {
        this.onlyInB.push(eaB)
      }
    }
    return this.inAandB, this.onlyInA, this.onlyInB
  }

  merge(a, b) {
    this.merged = [a]
    this.merged.push(this.compare().this.onlyInB)
    return this.merged
  }

  async import() {
      this.items = [];
      var text = await Files.getURL(this.url).then(resp => resp.text());
      var htmlElement = < div > < /div>
    htmlElement.innerHTML = text

    var pubList = htmlElement.querySelectorAll(".publist")

    for (var list of pubList) {
      for (var ea of list.childNodes) {
        if (ea.localName == "li") {
          this.items.push(ea.innerHTML)
        }
      }
    }
    this.entries = this.parseItems(this.items)      
    return this.entries
  }

  // #important 
  async fillEntries(){
    this.searchResults = new Map()
    try {
      var progress = await lively.showProgress("fill bibliography entries from openalex");
      var progressCounter = 0
      for(let entry of this.entries) {
        progressCounter++
        var search = entry.entryTags.title 

        var json = await fetch("http://swacopilot:9020/works/search?q=" + search).then(r => r.json())
        this.searchResults.set(entry, json)
        if (json.results && json.results.length > 0) {
          progress.value = progressCounter / this.entries.length
          var found = json.results[0]
          entry.entryTags.alexid = found.id.replace("https://openalex.org/","")        
          this.displayEntry(entry)
        }
      }
    } finally {
      progress.remove()
    }         
  }
          
          
  bibtexGenEntry(item) {
    var a = item.split(/<.*?>/g)
    if (!a) {
      throw new Error("could not parse item: " + item)
    }

    var authors = a[0].split(/, /g).map(ea =>
      ea.replace(/^and /, "").replace(/\. $/, ""))

    for (var i = 1; i < 5; i++) {
      var field = a[i]
      if (field && !year) {
        var allYears = Strings.matchAll(/(((20)|(19))[0-9]{2})/g, field)
        if (allYears.last) {
          var year = allYears.last[0]
        }
      }
      
    }

    if (!year) {
      throw new Error("could not find year in " + a[2], item)
    }

    var entry = {
      entryType: 'article',
      entryTags: {
        author: authors.join(" and "),
        year: year,
        title: a[1].replace(/\. $/, "").replace(/^ /, ""),
        published: a[2].replace(/\(/, "").replace(/^ /, "").replace(/\. $/, "")
      }
    }
    
    // if (entry.entryTags.published.match(/(Conference)|(Workshop)/)) {
    //   entry.entryType = "inproceedings"
    //   entry.entryTags.booktitle = entry.entryTags.published 
    // }
    
    entry.citationKey = Bibliography.generateCitationKey(entry)

    return entry
  }
          

          
  parseItems(items) {
    var entries = []
    for (var ea of items) {
      entries.push(this.bibtexGenEntry(ea))
    }
    return entries
  }

  async export () {
    return fetch(this.exportURL, {
      method: "PUT",
      body: this.entries.map(ea => BibtexParser.toBibtex([ea], false)).join("")
    })
  }
          
  async createUI() {
            
    async function myCompare() {
        await this.bibtoJSON()
        this.compare()
        function printBibliography(entries) {
          return entries.sortBy(ea => ea.citationKey).map(ea => 
            <span click={() => lively.openBrowser("bib://" + ea.citationKey)}>{ea.citationKey}<br /></span>)
        }

        this.preview.innerHTML = ""
        this.preview.appendChild(<table>
            <tr>
              <th>swa:{this.onlyInA.length}</th>
              <th>academic: {this.onlyInB.length} 
              </th><th>both: {this.inAandB.length} </th>
            </tr> 
            <tr>
              <td style="vertical-align: top">{... printBibliography(this.onlyInA) }</td>
              <td style="vertical-align: top">{... printBibliography(this.onlyInB) }</td>
              <td  style="vertical-align: top">{... printBibliography(this.inAandB)}</td>
            </tr>
          </table>)
      }

    this.preview = <div id="preview" style=""></div> 
    // white-space: pre; 
    var pane = <div>    
        <button click={async () => {
          await this.export() 
          lively.openBrowser(this.exportURL)
          }}>export</button>
        <button click={async () => {
          myCompare()

          }}>compare</button>
        <button click={async () => {
          this.fillEntries()

          }}>fill entries</button>
        {this.preview}
      </div>
        lively.load
              
    lively.components.loadByName("lively-bibtex-entry")  
    // for(let ea of await bibliography.import()) {
    //   var livelyBibtextEntry = await (<lively-bibtex-entry>${ea}</lively-bibtex-entry>)
    //   preview.appendChild(livelyBibtextEntry)  
    // }
    this.preview.innerHTML = "loading..."
    
    await this.import()
    await this.displayEntries()

    return pane       
  }
          
  async displayEntries() {
    this.entryPanes = new Map()
    this.preview.innerHTML = ""
    var div = <div></div>
    
        
    for(let ea of this.entries) {
      var entryPane = <div></div>
      this.entryPanes.set(ea, entryPane)
      div.appendChild(entryPane)
      this.displayEntry(ea)
    }       
    this.preview.appendChild(div)     
  }
          
  async displayEntry(entry) {
    lively.components.ensureLoadByName("literature-paper")
              
    var entryPane =  this.entryPanes.get(entry, entryPane)   
    entryPane.innerHTML = ""
    var comp = await <lively-bibtex-entry></lively-bibtex-entry>
    comp.value = entry
    entryPane.appendChild(comp)

    let search = this.searchResults.get(entry)
    if (search  && search.results.length == 1 ) {
      var paper = new AlexPaper(search.results[0])
      let div = <div style="background-color: yellow" 
                              click={() => lively.openInspector(search)}></div>
      
      div.innerHTML = await paper.toShortDataHTML()
      entryPane.style.border = "1px solid green"
      entryPane.appendChild(div)  
    } else if (search) {
      entryPane.style.border = "1px solid red"
    }
              
              
    
  }
  
          
          
}
