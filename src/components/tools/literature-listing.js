import Morph from 'src/components/widgets/lively-morph.js';

import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"


/*MD # Literature Listing

[Microsoft Graph API](https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-paper-entity-attributes) | [Schema](https://docs.microsoft.com/en-us/academic-services/knowledge-exploration-service/reference-makes-api-entity-schema)

![](literature-listing.png)

MD*/





export default class LiteratureListing extends Morph {
  async initialize () {
    this.windowTitle = "LiteratureListing";
  }
  
  attachedCallback() {
    this.get("#content").innerHTML = ""
    var container = lively.query(this, "lively-container");
    this.updateView()
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
    var base = this.getAttribute("bibliography-base")
    if (lively.files.isURL(base)) {
      return base
    }
    if (this.container) {
      return lively.paths.normalizeURL(this.container.getDir() + base);
    }
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
  
  async updateNavbar() {
    if (this.container) {
      this.navbar = this.container.get("lively-container-navbar")
      this.navbarDetails = this.navbar.get("#details")
      let ul = this.navbarDetails.querySelector("ul")
      if (ul) {
        ul.innerHTML = "" // #TODO, be nicer to other content?     
      }
    } else {
      return
    }
    
    
    var byKey = this.createNavbarItem(`key (${this.literatureFiles.length})`)
    byKey.addEventListener("click", () => {
      this.setCurrentLiteratureFiles(this.literatureFiles)
      this.get("#literatureFiles").classList.add("byKey")
    })
    var byTitle = this.createNavbarItem(`titles`)
    byTitle.addEventListener("click", () => {
      this.setCurrentLiteratureFiles(this.literatureFiles.sortBy(ea => ea.entry && ea.entry.title))
      this.get("#literatureFiles").classList.add("byTitle")
    })
    
    this.authors = new Map()
    this.keywords = new Map()
    for(let file of this.literatureFiles) {
      if (file.entry) {
        for(let keyword of file.entry.keywords) {
          let files = this.keywords.get(keyword) || []
          files.push(file)
          this.keywords.set(keyword, files)
        }
        for(let author of file.entry.authors) {
          let files = this.authors.get(author) || []
          files.push(file)
          this.authors.set(author, files)
        }
      }
    }
    

    
    let byAuthor = this.createNavbarItem(`authors`, 1)
    byAuthor.addEventListener("click", () => {
      lively.notify("filter by author") 
      Array.from(this.navbar.get("#details").querySelectorAll(".subitem.level2"))
         .forEach(ea => ea.remove())
      
      if (this.authorsListSortByLength) {
        var authorsLists = Array.from(this.authors.keys()).sortBy( ea => this.authors.get(ea).length).reverse()
      } else {
        authorsLists = Array.from(this.authors.keys()).sortBy( ea => _.last(ea.split(" ")))
      }
      this.authorsListSortByLength = !this.authorsListSortByLength
      for(let author of authorsLists) {
        let item = this.createFilter("author", author, this.authors, ea => ea.entry.authors)
        item.classList.add("author")
      }
    })
    
    let byKeyword = this.createNavbarItem(`keywords`, 1)
    byKeyword.addEventListener("click", () => {
       Array.from(this.navbar.get("#details").querySelectorAll(".subitem.level2"))
         .forEach(ea => ea.remove())
      
      if (this.keywordListSortByLength) {
          var keywordLists = Array.from(this.keywords.keys()).sortBy( ea => this.keywords.get(ea).length).reverse()
      } else {
        keywordLists = Array.from(this.keywords.keys()).sortBy( ea => _.last(ea.split(" ")))
      }
      this.keywordListSortByLength = !this.keywordListSortByLength
      for(let keyword of keywordLists) {
        let item = this.createFilter("keyword", keyword, this.keywords, ea => ea.entry.keywords)
        item.classList.add("keyword")
      }
    })
    
    
  }
  
  createFilter(name, key, map, func) {
      let files = map.get(key)
      let authorItem = this.createNavbarItem(`${key} (${files.length})`, 2)
      authorItem.addEventListener("click", () => {
        let filtered = this.literatureFiles.filter(ea => 
          ea.entry && func(ea).includes(key))
        this.setCurrentLiteratureFiles(filtered)
        this.get("#content").querySelectorAll("." + name).forEach(ea => {
          if (ea.textContent == key) {
            ea.classList.add("selected")
          }
        })
        this.get("#literatureFiles").classList.add("filter-" + name)
      })
    return authorItem
  }
  
  
  async setCurrentLiteratureFiles(fileitems) {
    this.currentLiteratureFiles = fileitems 
    this.get("#content").innerHTML = ""
    if (this.currentLiteratureFiles.length == 0) {
      this.get("#content").innerHTML = "no literature files found"
    }
    
    this.get("#content").appendChild(<div id="literatureFiles">
        {this.details}
        {this.renderCollection(this.currentLiteratureFiles)}
      </div>)
  }

  
  async updateView() {
    this.get("#content").innerHTML = "updating files and entries... (this may take a while)"

    if (!this.literatureFiles) {
      await this.updateFiles()
      await this.updateEntries()      
    }
    await this.updateNavbar()
    this.details = <div id="details" style="position:absolute;"></div>
    this.details.hidden = true
    
    this.setCurrentLiteratureFiles(this.literatureFiles)
  }
  
  createNavbarItem(name, level=1) {
    if (this.navbar) {
      var detailsItem = this.navbar.createDetailsItem(name)
      detailsItem.classList.add("subitem")
      detailsItem.classList.add("level" + level)
      var ul = this.navbarDetails.querySelector("ul")
      if (ul) ul.appendChild(detailsItem)
      return detailsItem
    }
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
    if (literatureFile.entry) {
      var authorsList = literatureFile.entry.authors
        .map(ea => <span class="author">{ea}</span>)
        .joinElements((a,b) => new Text(", "))
      var entryDetails =  <span>
            <span class="authors">{...authorsList}
            </span>.
            <span class="title">{literatureFile.entry.title}</span>.
            <span class="year">{literatureFile.entry.year}</span>
          </span>      
    } else {
        entryDetails = <span class="noentry">{literatureFile.file.name}</span>                                
    }
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
          // might have changed
          var newLiteratureFile =  this.literatureFiles.find(ea => ea.file.url == literatureFile.file.url) 
    
          this.updateLiteratureFile(newLiteratureFile, element) 
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
    this.literatureFiles = other.literatureFiles
  }
  
  livelyInspect(contentNode, inspector) {
    if (this.literatureFiles) {
      contentNode.appendChild(inspector.display(this.literatureFiles, false, "#literatureFiles", this));
    } 
  }
  
  async livelyExample() {
    this.base = "http://localhost:9005/Dropbox/Thesis/Literature/2020-2029/"
    this.bibliographyBase = "http://localhost:9005/Dropbox/Thesis/Literature/"
    this.container = await (<lively-container></lively-container>)
    this.updateView()
  }
}