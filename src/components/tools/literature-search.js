import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import moment from "src/external/moment.js"
import {Paper} from "src/client/literature.js"
import Morph from 'src/components/widgets/lively-morph.js';


/*MD # Literature Search 

![](literature-search.png)

MD*/

export default class LiteratureSearch extends Morph {
  async initialize() {
    this.windowTitle = "LiteratureSearch";
    this.updateView()
  }
  
  get mode() {
    return this.getAttribute("mode")
  }

  set mode(s) {
    this.setAttribute("mode", s)
  }
  
  
  get queryString() {
    return this.getAttribute("query")
  }

  set queryString(s) {
    this.setAttribute("query", s)
  }
  
  get literatureListing() {
    return this._literatureListing  || lively.query(this, "literature-listing")
  }
  
  // for testing
  set literatureListing(element) {
    this._literatureListing = element
  }

  get renameURL() {
    return this.getAttribute("rename-url")
  }

  set renameURL(s) {
    this.setAttribute("rename-url", s)
  }
  
  get baseURL() {
    return this.getAttribute("base-url")
  }

  set baseURL(s) {
    this.setAttribute("base-url", s)
  }
  
  get details() {
    return this.get("#content")
  }
  
  updateView() {
    if (this.queryString) {
      this.findBibtex(this.queryString)
    }
  }
  
  close(fireNoEvent=false) {
    if (!fireNoEvent){
      this.dispatchEvent(new CustomEvent("closed"))
    }
    if (this.literatureListing) {
      this.literatureListing.details.hidden = true
      this.literatureListing.details.innerHTML = "" // self destruct...
    }
  }
  
  async findBibtex(queryString) {
    queryString = queryString.replace(/[-_,]/g, " ")
    var div = <div></div>;
    
    this.details.innerHTML = ""
    
    var input = <input  id="searchBibtexInput" value={queryString} style="width:400px"></input>
    input.addEventListener("keyup", event => {
      if (event.keyCode == 13) { // ENTER
        this.findBibtexSearch(input.value, div)
      }
    });  
    this.details.appendChild(<div>
      <h3>Searched:{input}</h3>
      <span style="position:absolute; top: 0px; right:0px">
      <a title="close" click={() => this.close()}>
        <i class="fa fa-close" aria-hidden="true"></i>
      </a></span>{div}</div>)
    
    this.findBibtexSearch(queryString, div)
  }

  async findBibtexSearch(queryString, div) {
    div.innerHTML = "searching..."
    var entries
    try {
        var bibEntries = this.mode == "fuzzy" ?
          await this.findBibtexEntriesFuzzy(queryString, div) :
          await this.findBibtexEntriesSimple(queryString, div);
        div.innerHTML = ""
        var rows = []
        let allBibtexEntries = await FileIndex.current().db.bibliography.toArray()
        for(let bib of bibEntries) {
          let id = bib.value.entryTags.scholarid
          let existing = allBibtexEntries
            .filter(ea => ea.key == bib.value.citationKey)
            .filter(ea => !this.baseURL || ea.url.startsWith(this.baseURL))
          let rename = <a title="rename file" class="method"
              click={async () => {
                await this.literatureListing.renameFile(this.renameURL, bib.generateFilename() + ".pdf")
                this.close(true) // we need to close it... because literatureListing will change..., oder does it?
              }}>
             rename
            </a>
          let importBibtex = <a class="method" click={async () => {          
            await lively.html.highlightBeforeAndAfterPromise(importBibtex, Paper.importBibtexId(id))
            importBibtex.remove()
          }}>
             import
            </a>    
          let debug = <a class="method" click={async () => {
            var paper = await Paper.getId(id)
            lively.openInspector(paper)
          }}>
             inspect
            </a>    
          rows.push(<tr>
              <td style="vertical-align: top">
                
              </td>
              <td>
                <span class="methods" >
                  {this.literatureListing ? rename : ""} {(existing.length == 0) && id ? importBibtex : ""}
                  {debug}
                </span> <br />
                {bib}</td>
            </tr>)
        }
      div.appendChild(
        <table> {... rows}</table>)
    } catch(err) {
      div.innerHTML = "ERROR: " + err
    }
  }

  async findBibtexEntriesSimple(queryString, div) {
    var bibEntries = []
    var entries = await lively.files.loadJSON("academic://" + queryString)
    div.innerHTML = "loading paper"  
    for(var ea of entries) {
      let foundPaper = await Paper.ensure(ea)
      var bib = await (<lively-bibtex-entry style="display: inline-block"> </lively-bibtex-entry>)
      bib.setFromBibtex(foundPaper.toBibtex())
      bib.updateView()
      bibEntries.push(bib)
    }
    return bibEntries
  }

  async findBibtexEntriesFuzzy(queryString, div) {
    var bibEntries = []
    
    var fields = "externalIds,url,title,year,referenceCount,citationCount,fieldsOfStudy,s2FieldsOfStudy,authors"
    var json = await fetch("scholar://data/paper/search?query=" + queryString + `&fields=${fields}`).then(r => r.json())
    
    if (!json || !json.data) {
      div.innerHTML = "nothing found"
      return []
    }
    
    for(let ea of json.data) {
      let bib = await (<lively-bibtex-entry mode="readonly"> </lively-bibtex-entry>)
      let entry = {
        entryTags: {
          author: ea.authors.map(author => author.name.replace(/<\/?[a-z]+>/g,"")).join(" and "), 
          title: ea.title.replace(/<\/?[a-z]+>/g,""), 
          scholarid: ea.paperId, 
          year: ea.year, //moment(ea.year).year(),
          // publisher: ea.paper.v.displayName,
          keywords: (ea.fieldsOfStudy || []).map(kw => kw),
          // abstract: ea.paper.d,       
        },
        entryType: "article"
      }
      entry.citationKey = Bibliography.generateCitationKey(entry)
      bib.value = entry
      bib.updateView()
      bib.addEventListener("click", evt => {
        if (evt.shiftKey) {
          lively.openInspector(ea)
        }
      })
      
      bibEntries.push(bib)
    }
    return bibEntries
  }
  
  livelyMigrate(other) {
    this.literatureListing = other.literatureListing
  }
  
  
  async livelyExample() {
      this.queryString = "Kiczales 1996 Aspect-oriented programming" 
      this.mode = "fuzzy"
      this.literatureListing = await (<literature-listing></literature-listing>)
      this.renameURL = "https://bal.blu/aop.pdf"
      this.updateView()
  }
  
}