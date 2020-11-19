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
  
  async updateView() {
    var base = this.base
  
    var files = await FileIndex.current().db.files
      .filter(ea => ea.url.startsWith(base))
      .filter(ea => ea.name.match(/\.pdf$/)).toArray();
      
    var entries = await FileIndex.current().db.bibliography
      .filter(ea => ea.url.startsWith(this.bibliographyBase || base))
      .toArray()
      
    
    var papers = files
       .map(file => ({key: file.bibkey, file: file, entry: null}))
    
    entries.forEach(entry => {
      var paper = papers.find(ea => ea.key == entry.key)
        if (paper) {
        paper.entry = entry
      }
    })


    papers = papers.sortBy(paper => paper.key)    
    let style = document.createElement("style")
    style.textContent = this.style

    this.details = <div id="details" style="position:absolute;"></div>
    this.details.hidden = true
    
    this.get("#content").innerHTML = ""
    this.get("#content").appendChild(<div>{style}
        {this.details}
        {this.printCollection(papers)}
      </div>)

  }
  
  async renameFile(url, proposedName) {
    var newURL = await this.container.renameFile(url, false, proposedName)
    lively.notify("renamed file: ", newURL)
    if (newURL) {
      await FileIndex.current().updateDirectory(this.base)
      this.container.setPath(this.container.getPath())      
    }
  }
  
  
  async openFrame(name, url) {
    const frameId = name
    var iframe = document.body.querySelector("#" + frameId) 

    if (!iframe) {
      iframe = await lively.openComponentInWindow("lively-iframe")
      iframe.setAttribute("id", frameId)
      iframe.hideMenubar()
      lively.setExtent(iframe.parentElement, pt(1210, 700))
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
  
  
  get style() {
    return `
      li {
        clear: both;
      }

      #details {
        padding: 20px;
        background-color: rgba(240,240,250,0.9);
        border: 1px solid rgba(200,200,250,0.9);
        border-radius: 10px;
      }
      
      a {
        color: black;
      }

      a:hover {
        color: blue;
        text-decoration: underline;
      }

      .key {
        font-size: 10pt;
      }


      .keywords {
        font-size: 9pt;
        color: lightblue;
      }
      .authors {
        font-size: 10pt;
        color: lightgray;
      }

      .title {
        font-size: 10pt;
        color: gray;
      }
      
      .year {
        font-size: 10pt;
        color: gray;
      }

      .noentry {
        font-size: 10pt;
        color: orange;
      }

      .nav {
        /*
        text-align: right;
        float: right;
        */        
        margin-right: 50px;
        background-color: rgb(245,245,245);
      }

      .nav a {
        font-size: 8pt;
        color: gray;
      }
    `
  }

  printCollection(collection) {
    return <ul>{... 
      collection.map(paper => {
          var details = paper.entry ? 
            <span>
              <span class="authors">{paper.entry.authors.join(", ")}</span>.
              <span class="title">{paper.entry.title}</span>.
              <span class="year">{paper.entry.year}</span>
            </span> : 
            <span class="noentry">{paper.file.name}</span>

          var filelink = paper.file ? 
              <a style="color:gray" click={(evt) => {
                  if (evt.shiftKey) {
                    lively.openInspector(paper) // #Example #ExplorationPattern #ForMarcel build way into object inspector into UI
                  } else {
                    if (paper.file) lively.openBrowser(paper.file.url)
                  }
                }
              }>⇗pdf</a> : ""
        var keywords = (paper.entry && paper.entry.keywords) ? 
            <span class="keywords">{... paper.entry.keywords.map(ea => ea + " ")}</span> : "";

        let query =  paper.file.name
          .replace(/.*\//,"")
          .replace(/\.pdf$/,"")
          .replace(/([a-z])([A-Z])/g,"$1 $2")
          .replace(/_/g," ")
        var scholarLink = <a click={() => this.googleScholar(query)}>⇗GS</a>
        var academicLink = <a click={() => this.microsoftAcademic(query)}>⇗MA</a>
        
        var renameLink = <a click={() => this.renameFile(paper.file.url)}>rename</a>
        var microsoftIdLink = paper.entry && paper.entry.microsoftid ? <a click={() => lively.openBrowser("academic://expr:Id="+paper.entry.microsoftid) }>academic</a> : ""
     
        var bibtexLink = <a click={async () => {
            this.details.innerHTML = ""
            var search = await (<literature-search mode="fuzzy" query={query} rename-url={paper.file.url}></literature-search>)
            this.details.appendChild(search)    
            this.details.hidden = false
            search.updateView()
            lively.setGlobalPosition(this.details, lively.getGlobalBounds(element).bottomLeft().addPt(pt(20,0)))
             
        }}>search</a>
        var keyLink = <a class="key" click={() => lively.openBrowser("bib://" + paper.key)}>{
              "[" + paper.key +  "]"  }</a>
        var element = <li>
            {paper.key ? keyLink : ""}
            {details} {keywords} <span class="nav">{filelink} {scholarLink} {academicLink} {renameLink} {bibtexLink} {microsoftIdLink}</span></li>
        return element
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