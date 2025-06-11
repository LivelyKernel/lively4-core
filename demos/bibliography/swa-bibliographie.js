import BibtexParser from "src/external/bibtexParse.js";
import Bibliography from "src/client/bibliography.js"
import Strings from 'src/client/strings.js'
import Files from 'src/client/files.js'

export default class SWABibliographie {
  constructor(importURL, exportURL, bibURL) {
    this.url = importURL
    this.exportURL = exportURL
    this.bibURL = bibURL
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

  bibtexGen(item) {
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

    var bibString = BibtexParser.toBibtex([entry], false);
    return bibString

  }
  parseItems(items) {
    var entries = []
    for (var ea of items) {
      entries.push(this.bibtexGen(ea))
    }
    return entries
  }

  async export () {
    return fetch(this.exportURL, {
      method: "PUT",
      body: this.entries.join("")
    })
  }
          
  async createUI() {
            
    var bibliography = this;
    async function myCompare() {
        await bibliography.bibtoJSON()
        bibliography.compare()
        function printBibliography(entries) {
          return entries.sortBy(ea => ea.citationKey).map(ea => 
            <span click={() => lively.openBrowser("bib://" + ea.citationKey)}>{ea.citationKey}<br /></span>)
        }

        preview.innerHTML = ""
        preview.appendChild(<table>
            <tr>
              <th>swa:{bibliography.onlyInA.length}</th>
              <th>academic: {bibliography.onlyInB.length} 
              </th><th>both: {bibliography.inAandB.length} </th>
            </tr> 
            <tr>
              <td style="vertical-align: top">{... printBibliography(bibliography.onlyInA) }</td>
              <td style="vertical-align: top">{... printBibliography(bibliography.onlyInB) }</td>
              <td  style="vertical-align: top">{... printBibliography(bibliography.inAandB)}</td>
            </tr>
          </table>)
      }

    var preview = <div id="preview" style=""></div> 
    // white-space: pre; 
    var pane = <div>    
        <button click={async () => {
          await bibliography.export() 
          lively.openBrowser(bibliography.exportURL)
          }}>export</button>
        <button click={async () => {
          myCompare()

          }}>compare</button>
        {preview}
      </div>
        lively.load
              
    lively.components.loadByName("lively-bibtex-entry")  
    // for(let ea of await bibliography.import()) {
    //   var livelyBibtextEntry = await (<lively-bibtex-entry>${ea}</lively-bibtex-entry>)
    //   preview.appendChild(livelyBibtextEntry)  
    // }
    preview.innerHTML = "loading..."
    var entries = await bibliography.import()
    
    preview.innerHTML = ""
    var div = <div></div>
    for(let ea of entries) {
      var comp = await <lively-bibtex-entry></lively-bibtex-entry>
      comp.setFromBibtex(ea)
      div.appendChild(comp)
    }
              
    preview.appendChild(div)
              
    // myCompare()  

    return pane       
  }
}
