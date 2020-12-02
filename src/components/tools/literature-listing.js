import Morph from 'src/components/widgets/lively-morph.js';

import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"


/*MD 

[Microsoft Graph API](https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-paper-entity-attributes) | [Schema](https://docs.microsoft.com/en-us/academic-services/knowledge-exploration-service/reference-makes-api-entity-schema)

MD*/

export default class LiteratureListing extends Morph {
  async initialize () {
    this.windowTitle = "LiteratureListing";
    (() => this.updateView()).defer(0)
  }

  get container() {
    return this._container || lively.query(this, "lively-container")    
  }
  
  // for testing
  set container(element) {
    this._container = element    
  }

  get base() {
    return this.getAttribute("base") ||  
      (this.container ? this.container.getDir() : lively4url);
  }

  set base(url) {
    return this.setAttribute("base", url)
  }
  
  get bibliographyBase() {
    return this.getAttribute("bibliography-base")
  }
  
  set bibliographyBase(url) {
    return this.setAttribute("bibliography-base", url)
  }
  
  async updateFiles() {
    await lively.updateFileIndexDirectory(this.base.replace(/\/?$/,"/"))
    
    var files = await FileIndex.current().db.files
      .filter(ea => ea.url.startsWith(this.base))
      .filter(ea => ea.name.match(/\.pdf$/)).toArray();
    this.literatureFiles = files
       .map(file => ({key: file.bibkey, file: file, entry: null}))
  }

  async updateEntries() {
    var entries = await FileIndex.current().db.bibliography
      .filter(ea => ea.url.startsWith(this.bibliographyBase || this.base))
      .toArray()
    // reset entries
    this.literatureFiles.forEach(literatureFile => literatureFile.entry = null)
    
    await entries.forEach(entry => {
      this.literatureFiles.filter(ea => ea.key == entry.key).forEach(literatureFile => {
        literatureFile.entry = entry
      })
    })
    this.literatureFiles = this.literatureFiles.sortBy(paper => paper.key)    
  }
  
  async updateView() {
    this.get("#content").innerHTML = "updating files and entries... (this may take a while)"

    await this.updateFiles()
    await this.updateEntries()
   
    this.details = <div id="details" style="position:absolute;"></div>
    this.details.hidden = true
    
    this.get("#content").innerHTML = ""
    if (this.literatureFiles.length == 0) {
      this.get("#content").innerHTML = "no literature files found"
    }
    
    this.get("#content").appendChild(<div>
        {this.details}
        {this.renderCollection(this.literatureFiles)}
      </div>)
  }
  
  async renameFile(url, proposedName) {
    let literatureFile = this.literatureFiles.find(ea => ea.file.url == url)
    let element = this.get("#content").querySelectorAll(".element").find(ea => ea.getAttribute("data-url")  == url)
    let newURL = await this.container.renameFile(url, false, proposedName)
    if (newURL) {
      
      if (literatureFile && element) {
        this.updateLiteratureFileAfterRename(literatureFile, element, newURL)
      } else {
        lively.notify("could not update view")
      }
    }
  }
  
  
  async openFrame(name, url) {
    const frameId = name
    var iframe = document.body.querySelector("#" + frameId) 

    if (!iframe) {
      iframe = await lively.openComponentInWindow("lively-iframe")
      iframe.setAttribute("id", frameId)
      iframe.hideMenubar()
      lively.setExtent(iframe.parentElement, lively.pt(1210, 700))
    }
    iframe.setURL(url)
  }
  
  cleanQueryString(queryString) {
    return queryString.replace(/ /g,"+")
  }
  

  async googleScholar(queryString) {
    return this.openFrame("googlescholoar", "https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&btnG=&q=" 
                          + this.cleanQueryString(queryString))
  }
  
  async microsoftAcademic(queryString) {
    return this.openFrame("microsoftacademic", 
                            "https://academic.microsoft.com/search?f=&orderBy=0&skip=0&take=10&q=" 
                            + this.cleanQueryString(queryString))
  }
  
  async updateLiteratureFileAfterRename(literatureFile, element, newURL) {
    // literatureFile.file.url = newURL
    // literatureFile.file.name = newURL.replace(/.*\//,"")
    await this.updateFiles()
    await this.updateEntries()
    var newLiteratureFile = this.literatureFiles.find(ea => ea.file.url == newURL) 
    if (!newLiteratureFile) {
      return lively.warn("Could not update litature file view", newURL)
    }
    
    return this.updateLiteratureFile(newLiteratureFile, element)
  }
  
  updateLiteratureFile(literatureFile, element, oldLiteratureFile) {
    debugger
    if (!element) {
      lively.notify("no element to update")
      return // nothing to do here any more
    }
    if (!element.parentElement) {
      lively.notify("could not find parent of element")
      return // nothing to do here any more
    }    
    var replacement = this.renderLiteratureFile(literatureFile)
    // lively.showElement(element)
    var animation = replacement.animate([
        { outline: "2px solid transparent",  }, 
        { outline: "2px solid green",   }, 
        { outline: "2px solid transparent",  },                                 
      ], 
      {
      duration: 1000
    });  
                     
    
    element.parentElement.insertBefore(replacement, element)
    element.remove()
  }
  
  renderLiteratureFile(literatureFile) {
    var entryDetails = literatureFile.entry ? 
        <span>
          <span class="authors">{literatureFile.entry.authors.join(", ")}</span>.
          <span class="title">{literatureFile.entry.title}</span>.
          <span class="year">{literatureFile.entry.year}</span>
        </span> : 
        <span class="noentry">{literatureFile.file.name}</span>

      var filelink = literatureFile.file ? 
          <a style="color:gray" click={(evt) => {
              if (evt.shiftKey) {
                lively.openInspector(literatureFile) // #Example #ExplorationPattern #ForMarcel build way into object inspector into UI
              } else {
                if (literatureFile.file) lively.openBrowser(literatureFile.file.url)
              }
            }
          }>⇗pdf</a> : ""
    var keywords = (literatureFile.entry && literatureFile.entry.keywords) ? 
        <span class="keywords">{... literatureFile.entry.keywords.map(ea => ea + " ")}</span> : "";

    let query =  literatureFile.file.name
      .replace(/.*\//,"")
      .replace(/\.pdf$/,"")
      .replace(/([a-z])([A-Z])/g,"$1 $2")
      .replace(/_/g," ")
    var scholarLink = <a click={() => this.googleScholar(query)}>⇗GS</a>
    var academicLink = <a click={() => this.microsoftAcademic(query)}>⇗MA</a>

    var renameLink = <a click={() => this.renameFile(literatureFile.file.url)}>rename</a>
    var microsoftIdLink = literatureFile.entry && literatureFile.entry.microsoftid ? 
        <a click={() => lively.openBrowser("academic://expr:Id="+literatureFile.entry.microsoftid) }>academic</a> : ""

    var bibtexLink = <a click={async () => {
        this.details.innerHTML = ""
        var search = await (<literature-search 
                              mode="fuzzy" 
                              query={query} 
                              base-url={this.bibliographyBase}
                              rename-url={literatureFile.file.url}></literature-search>)
        this.details.appendChild(search)    
        this.details.hidden = false
        search.updateView()
        lively.setGlobalPosition(this.details, lively.getGlobalBounds(element).bottomLeft().addPt(pt(20,0)))
        search.addEventListener("closed", async () => {
          await lively.sleep(1000) // await a bit
          await this.updateEntries()
          this.updateLiteratureFile(literatureFile, element) 
        })
    }}>search</a>
    var keyLink = <a class="key" click={() => lively.openBrowser("bib://" + literatureFile.key)}>{
          "[" + literatureFile.key +  "]"  }</a>
    var element = <li class="element" data-url={literatureFile.file.url}>
        {literatureFile.key ? keyLink : ""}
        {entryDetails} {keywords} <span class="nav">{filelink} {scholarLink} {academicLink} {renameLink} {bibtexLink} {microsoftIdLink}</span></li>
    return element
  }
  
  renderCollection(collection) {
    return <ul>{... 
      collection.map(literatureFile => {
        return this.renderLiteratureFile(literatureFile)
      }) }</ul>
  }

  livelyMigrate(other) {
    this.container = other.container
  }
  
  async livelyExample() {
    this.base = "http://localhost:9005/Dropbox/Thesis/Literature/_incoming/"
    this.bibliographyBase = "http://localhost:9005/Dropbox/Thesis/Literature/"
    this.container = await (<lively-container></lively-container>)
    this.updateView()
  }
}