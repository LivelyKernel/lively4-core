
import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"

import {Paper} from "src/client/literature.js"

import Morph from 'src/components/widgets/lively-morph.js';

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
  
  get details() {
    return this.get("#content")
  }
  
  updateView() {
    if (!this.queryString) {
      
    } else {
      this.findBibtex(this.queryString)
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
      <a title="close" click={() => {
          if (this.literatureListing) {
            this.literatureListing.details.hidden = true
            this.literatureListing.details.innerHTML = "" // self destruct...
          }
          }}>
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
          let id = bib.value.entryTags.microsoftid
          let existing = allBibtexEntries.filter(ea => ea.key == bib.value.citationKey)
          let rename = <a title="rename file" style="color: gray; background: lightgray; border-radius: 5px" 
              click={() => {
                this.literatureListing.renameFile(this.renameURL, bib.generateFilename() + ".pdf")  
              }}>
              <i class="fa fa-arrow-right" aria-hidden="true"></i>
              <i class="fa fa-file" aria-hidden="true"></i>
            </a>
          let importBibtex = <a click={async () => {
              await Paper.importBibtexId(id)
              
              }}>
             import bibtex
            </a>    
              
          
          rows.push(<tr>
              <td>
                {this.literatureListing ? rename : ""}
              </td>
              <td>{(existing.length == 0) && id ? importBibtex : ""}</td>

              <td>{bib}</td>
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
    var json = await fetch("https://academic.microsoft.com/api/search", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        query: queryString, queryExpression: "", 
        filters: [], 
        orderBy: 0, 
        skip: 0,
        sortAscending: true, 
        take: 5}) 
      }).then(r => r.json())
    
    if (!json || !json.pr) {
      div.innerHTML = "nothing found"
      return []
    }
    
    for(var ea of json.pr) {
      var bib = await (<lively-bibtex-entry mode="readonly"> </lively-bibtex-entry>)
      var entry = {
        entryTags: {
          author: ea.paper.a.map(author => author.dn.replace(/<\/?[a-z]+>/g,"")).join(" and "), 
          title: ea.paper.dn.replace(/<\/?[a-z]+>/g,""), 
          microsoftid: ea.paper.id, 
          year: moment(ea.paper.v.publishedDate).year(),
          publisher: ea.paper.v.displayName,
          keywords: ea.paper.fos.map(kw => kw.dn),
          abstract: ea.paper.d,       
        },
        entryType: "article"
      }
      entry.citationKey = Bibliography.generateCitationKey(entry)
      bib.value = entry
      bib.updateView()
      
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