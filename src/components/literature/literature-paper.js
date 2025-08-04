import Morph from 'src/components/widgets/lively-morph.js';
import {AlexPaper, Author, Paper, Scholar, LiteratureReference, MiscPaper} from "src/client/literature.js"
import Literature from "src/client/literature.js"
import Bibliography from 'src/client/bibliography.js'


import {debugPrint} from "src/client/debug.js"

/*MD # Literature Paper

[scholar protocoll](edit://src/client/protocols/scholar.js)

MD*/
export default class LiteraturePaper extends Morph {
  async initialize() {
    // lively.notify("initialize " + debugPrint(this), 10)

    this.windowTitle = "LiteraturePaper" ; 
    
    this.updateViewDebounced = this.updateView.debounce(500)
  
    this.updateViewDebounced()
  }
  
  
  // for misc literature references
  get id() {
    return this.getAttribute("id")
  }

  set id(id) {
    this.setAttribute("id", id)
  }
  
  get type() {
    return this.getAttribute("type")
  }

  set type(type) {
    this.setAttribute("type", type)
  }

  
  get authorId() {
    return this.getAttribute("authorId")
  }
  
  set authorId(id) {
    this.data = null
    this.setAttribute("authorId", id)
    this.updateViewDebounced()
  }
  
  get scholarId() {
    return this.getAttribute("scholarId")
  }
  
  set scholarId(id) {
    this.data = null
    this.setAttribute("scholarId", id)
    this.updateViewDebounced()
  }
    
  get scholarPaper() {
    return this.getAttribute("scholarpaper")
  }
  
  set scholarPaper(id) {
    this.data = null
    this.setAttribute("scholarpaper", id)
    this.updateViewDebounced()
  }
  
  
  get alexId() {
    return this.getAttribute("alexId")
  }
  
  set alexId(id) {
    this.data = null
    this.setAttribute("alexId", id)
    this.updateViewDebounced()
  }
  
  get alexAuthorId() {
    return this.getAttribute("alexauthorid")
  }
  
  get mode() {
    return this.getAttribute("mode")
  }
  
  set mode(s) {
    this.setAttribute("mode", s)
  }
  
  get searchQuery() {
    return this.getAttribute("search")
  }

  get authorSearchQuery() {
    return this.getAttribute("authorsearch")
  }
  
  set searchQuery(id) {
    this.data = null
    this.setAttribute("search", id)
    this.updateViewDebounced()
  }
  
  
  /*MD 
  
  see API <https://api.semanticscholar.org/api-docs/#tag/Paper-Data/operation/get_graph_get_paper_search>
  
  MD*/
  fields() {
    return Scholar.fields()
  }
  
  // #important 
  async ensureData() {
    
    lively.notify("ensureData")
    if (this.data) return this.data
    if (this.alexId) {
      this.url  = `alex://data/works/${this.alexId}`
    } if (this.alexAuthorId) {
      this.url  = `alex://data/authors/${this.alexAuthorId}`
    } else if (this.scholarId  || this.scholarPaper) {
      // cached://
      var id = this.scholarId  || this.scholarPaper
      this.url  = `scholar://data/paper/${id}?fields=${this.fields()}` // cached://
    } else if (this.authorId) {
      // cached://
      this.url  = `scholar://data/author/${this.authorId}?fields=name,papers.citationCount,papers.authors,papers.title,papers.year`
    } else if (this.getAttribute("authorsearch")) {
      this.url  = `scholar://data/author/search?query=${this.getAttribute("authorsearch")}&fields=name,papers.citationCount,papers.authors,papers.title,papers.year`
    } else if (this.searchQuery) {
      
      const urlParams = new URLSearchParams("query=" + this.searchQuery);
      this.url  = `scholar://data/paper/search?query=${encodeURIComponent(urlParams.get("query"))}&fields=authors,title,year`
      if (urlParams.get("offset")) {
        this.url += "&offset=" +urlParams.get("offset")
      }
      if (urlParams.get("limit")) {
        this.url += "&limit=" +urlParams.get("limit")
      }
    } else {
      return
    }
    if (this.textContent) {
      try {
        this.data = JSON.parse(this.textContent)
      } catch(e) {
        lively.error("Could not parse literature entity", this.textContent)
      }
    } else {
      this.data = await fetch(this.url).then(r => r.json())        
    }
    return this.data
  }
  
  async ensurePaper() {
    if (!this.paper) {
      if (this.alexId) {
        await this.ensureData()
        // this.paper = new AlexPaper(this.data)
        
        
        console.log("[ensurePaper] Paper.getId " + this.alexId)
        if (!this.alexId.match(/W[0-9]+/)) {
          // not a Paper!
          throw new Error("not a paper: " + this.alexId)
          return 
        } else {
          this.paper = await Paper.getId(this.alexId, this.data)
        }
      }
      if (this.scholarId) { 
        this.paper = await Paper.liter(this.scholarId)
      }
      if (this.scholarPaper) { 
        this.paper = await Paper.getScholarPaper(this.scholarPaper)
      }
    }
    return this.paper
  }
  
  // #important
  async updateView() {
    // #TODO there seems to be a bug of double loading content
    // lively.showElement(this).textContent = debugPrint(this) + " " 
    this.isUpdatingView = true
    // lively.notify("updateView " + debugPrint(this))
    this.pane = this.get("#pane")
    this.pane.innerHTML = ""


    if (this.searchQuery) {
      let data = await this.ensureData()
      if (!data ) {
        this.pane.innerHTML = "no data" 
        return
      }
      if (!data.data) {
        this.pane.innerHTML = JSON.stringify(data)
        return
      }
      await this.renderSearch(data)
    } else if (this.authorSearchQuery) {
      let data = await this.ensureData()
      if (!data ) {
        this.pane.innerHTML = "no data" 
        return
      }
      if (!data.data) {
        this.pane.innerHTML = JSON.stringify(data)
        return
      }
      await this.renderAuthorSearch(data)
    } else if (this.authorId  || this.alexAuthorId) {
      let data = await this.ensureData()
      if (!data) {        
        this.pane.innerHTML = "no data" 
        return
      }
      await this.renderAuthor(data)
    } else if (this.scholarId  || this.scholarPaper  || this.alexId) {
      let paper = await this.ensurePaper()
      await this.renderPaper(paper)
    } else if (this.id && this.type) {
      this.paper = new MiscPaper(new LiteratureReference(this.id, this.type))
      await this.paper.load()
      await this.renderPaper(this.paper)
    } else {
      this.pane.innerHTML = "scholarId or search query is needed"
    }
  }
  
  async renderPaper(paper) {
    if (!paper) {
      this.pane.appendChild(<div click={() => lively.openInspector(paper)}>no paper in data</div>)
      return
    }
    
    if (this.mode == "short") {
      await this.renderShort()
    } else {
      await this.renderLong()
    }
    this.fixLinks()
    
    // this.pane.appendChild(<div>scholar paper: {this.scholarId}</div>)
    // this.pane.appendChild(<h1 click={() => lively.openInspector(paper)}>{paper.title}</h1>)
  }
  
  fixLinks() {
    var container = lively.query(this, "lively-container")
    if (container  && this.getAttribute("open") !=="browse") {
      lively.html.fixLinks([this.get("#pane")], undefined, path => container.followPath(path));
    } else {
      lively.html.fixLinks([this.get("#pane")], undefined, path => lively.openBrowser(path));      
    }
  }

  
  
  searchURLOffsetURL(offset, limit) {
      const urlParams = new URLSearchParams("query=" + this.searchQuery);
      var url = `scholar://browse/paper/search?query=${encodeURIComponent(urlParams.get("query"))}`      
      url += "&offset=" + offset
      if (!limit) {
        limit = urlParams.get("limit")
      }
      if (limit) {
        url += "&limit=" + limit 
      }
      return url
  }
  
  getPDFs() {
    return this.paper.value.S && this.paper.value.S.filter(ea => ea.Ty == 3).map(ea => ea.U);
  }
  
  /*MD # Render * MD*/
  
  // #important 
  async renderLong() { 
    let container = lively.query(this, "lively-container")
    let paper = this.paper
    if (!paper) {
     return this.renderNoPaper()
    }
    
    let bibtexEntries = await paper.findBibtexFileEntries()
    
        
    let title = <h1 class="title">{this.renderTitle()} ({this.renderYear()})</h1>
    let authorsList = <h2 class="authors">{...this.renderAuthorsLinks()}</h2>
    let bibtexEntriesSpan = <span>{...
        bibtexEntries.map(ea => 
            <span><a href={ea.url}>{ea.url.replace(/.*\//,"")}</a> </span>) 
        }</span>
    let bibtextImportButton = <button click={async () => {
       await Paper.importBibtexPaper(paper)
       await lively.sleep(1000) // let the indexer do it's work?
       if (container) container.setPath(container.getPath())
     }}>import bibtex entry</button>
    
    let literatureGraphButton = <button click={async () => {
       lively.openBrowser(lively4url + "/src/client/graphviz/literature.md?key="+paper.alexid)
     }}>graph</button>
        
  
    let bibtexOpenButton = <button click={async () => {
        let comp = await lively.openWorkspace(paper.toBibtex())
        comp.mode = "text/plain"
        comp.parentElement.setAttribute('title', "Bibtex Source")
        lively.setExtent(comp.parentElement, lively.pt(900, 200))
      }}>bibtex</button>
      
    let bibliographySection = <section>
        <h3>Bibliographies</h3>
        {bibtexOpenButton}
        {literatureGraphButton}
        {...
          bibtexEntries.filter(ea => ea.Doi || ea.doi).length > 0 ? 
            [bibtexEntriesSpan]  : 
            [bibtexEntriesSpan, bibtextImportButton]
        }
      </section>
    
    let abstractSection = <section>
        <h3>Abstract</h3>
        <div class="abstract">{this.paper.abstract}</div>
      </section>
         
    let ui = (<div class="paper">  
      {title} 
      {authorsList}
      <div>
        <button style="display:inline-block" click={() => lively.openInspector(paper)}>inspect</button>
        <button style="display:inline-block" click={() => Literature.removePaper(paper.scholarid)}>remove</button>
        {paper.value.url ? <a href={paper.value.url}><b>Scholar</b></a> : <span>no url</span>} |
        {paper.value.openAccessPdf ? <a href={paper.value.openAccessPdf.url}><b>PDF</b></a> : <span>no pdf</span>}
        {this.renderCitationKey()}
        {this.renderDOI()}
        <span>{this.renderPublication()}</span>
        {this.renderCitationCount()}
      </div>

      {this.renderPDFs(true)}
      {bibliographySection}
      {abstractSection}
    </div>)
    this.get("#pane").innerHTML =  ""
    this.get("#pane").appendChild(ui)
    
    lively.sleep(0).then(async () => {
      ui.appendChild(await this.loadReferences(paper))
      ui.appendChild(await this.loadRelated(paper))
      ui.appendChild(await this.loadRerferencedBy(paper))
    })
  }  
  
  async loadReferences(paper) { 
    var referencesSection = <section>
      <h3>References</h3>
      <span id="references"><i>loading references</i></span>
    </section>
    
      let element = referencesSection.querySelector("#references")
      if (paper.value.references) {
        element.innerHTML = ""
        for (let ea of paper.value.references) {
          if (ea.paperId) {
            // let short = await (<literature-paper mode="short" scholarid={ea.paperId}></literature-paper>)
            // let tempPaper = new Paper(ea)
            // short.paper = tempPaper
            // short.renderPaper(tempPaper)       
            // element.appendChild(short)
          } else {
            element.appendChild(<li>{ea.year || "" } {ea.title}</li>)  
          }
        }
      } else if (paper.value.referenced_works) { // open alex
        let ids = paper.value.referenced_works
          .map(ea => ea.match(/https:\/\/openalex.org\/(.*)/))
          .filter(ea => ea)
          .map(m => m[1])
        ids = ids.slice(0,49) // max workers per query
        element.innerHTML = ""
        for(let id of ids) {
          element.appendChild(await (<literature-paper mode="short" alexid={id}></literature-paper>))
          // element.appendChild(<li><a href={"alex://browse/" + id}> {id}</a></li>)  
        }
      }
    return referencesSection
  }

  async loadRerferencedBy(paper) { 
    var rerferencedBySection =  <section>
        <h3>Citations</h3>
        <span id="references">loading ciations</span>
      </section>
    let citationsElement = rerferencedBySection.querySelector("#references")
    citationsElement.innerHTML = ""
    if (paper.value.cited_by_api_url) {
      var url = paper.value.cited_by_api_url.replace("https://api.openalex.org/", "alex://data/") + "&select=id,title,publication_year,authorships&per-page=100"
      var json = await fetch(url).then(r => r.json())
      for(let ea of json.results) {
        let entry = {
          entryTags: {
            author: ea.authorships.map(ea => ea.author.display_name).join(" and "),
            year: ea.publication_year,
            title: ea.title,
          }
        }
        let key = Bibliography.generateCitationKey(entry)
        citationsElement.appendChild(await (<div style="margin: 5px"><b><a href={"bib://" + key}>[{key}]</a></b> <a href={ea.id.replace("https://openalex.org/", "alex://browse/")}>{ea.authorships.map(ea => ea.author.display_name).join(", ")}. {ea.publication_year}. <i>{ea.title}</i></a></div>))
      }
    }

    // for(let id of ids) {
    //     citationsElement.appendChild(await (<literature-paper mode="short" alexid={id}></literature-paper>))
    // }
    return rerferencedBySection
  } 
  
    
    
  async loadRelated(paper) {
    let relatedSection = <section>
        <h3>Related Works</h3>
        <span id="relatedWorks"><i>loading related works</i></span>
      </section>
    let relatedElement = relatedSection.querySelector("#relatedWorks")
    if (paper.value.related_works) { // open alex
      let ids = paper.value.related_works
        .map(ea => ea.match(/https:\/\/openalex.org\/(.*)/))
        .filter(ea => ea)
        .map(m => m[1])
      ids = ids.slice(0,49) // max workers per query
      relatedElement.innerHTML = ""
      for(let id of ids) {
        relatedElement.appendChild(await (<literature-paper mode="short" alexid={id}></literature-paper>))
      }
    }
    return relatedSection
  }
    
  async renderAuthor(data) {
    let authorName = <h1>Author: {data.name || data.display_name}</h1>
    let dataInspectButton = <button style="display:inline-block" click={() => lively.openInspector(data)}>inspect</button>

    let authorDetails = <div class="authorDetails">
      {authorName}
      {dataInspectButton}
  </div>
        
    lively.sleep(0).then(async r => {
      
      if (!data.papers) {
        let alexAuthorId = data.id.replace(/https:\/\/openalex.org\//,"")
        data.papers = (await fetch(`alex://data/works?filter=author.id:${alexAuthorId}`).then(r=> r.json())).results
      }

      if (data.papers) {
        let paperIds = data.papers.map(ea => ea.id.replace("https://openalex.org/", ""))
        let literatureGraphButton = <button click={async () => {

                  lively.openMarkdown(lively4url + "/src/client/graphviz/literature.md", 
          "Literature Graph", {keys: paperIds.join(",") })


         }}>graph</button>
        authorDetails.appendChild(literatureGraphButton)
      }      

      if (data.papers) {
        this.renderPaperList(data.papers, data.name)
      }      
    })
 
    this.pane.appendChild(authorDetails)
  }
  
  async renderSearch(data) {
    let searchName = <h1>Search</h1>
    let dataInspectButton = <button style="display:inline-block" click={() => lively.openInspector(data)}>inspect</button>
    
        
    let paperIds = data.data.map(ea => ea.paperId)
    let literatureGraphButton = <buttor4endern click={async () => {
       lively.openBrowser(lively4url + "/src/client/graphviz/literature.md?keys="+paperIds)
     }}>graph</button>
    
        
        
    let limit = data.next - data.offset
        
    let nextPages = <span></span>
    for (let i=0; i < Math.min(10, (data.total / limit)); i++ ) {
      nextPages.appendChild(<span><a href={this.searchURLOffsetURL(i*limit, limit)}>{i+1}</a>,</span>)
    }
    nextPages.appendChild(<a href={this.searchURLOffsetURL(data.next, limit)}>next</a>)
          
    let searchDetails = <div class="searchDetails">
        {searchName}
        {dataInspectButton}
        {literatureGraphButton}
    </div>
    this.pane.appendChild(searchDetails)
    this.renderPaperList(data.data)
    this.pane.appendChild(nextPages)
    this.fixLinks()
  }
  
  async renderAuthorSearch(data) {
    let searchName = <h1>Author Search</h1>
    let dataInspectButton = <button style="display:inline-block" 
                              click={() => lively.openInspector(data)}>inspect</button>
        
    let limit = data.next - data.offset
        
    let nextPages = <span></span>
    for (let i=0; i < Math.min(10, (data.total / limit)); i++ ) {
      nextPages.appendChild(<span><a href={this.searchURLOffsetURL(i*limit, limit)}>{i+1}</a>,</span>)
    }
    nextPages.appendChild(<a href={this.searchURLOffsetURL(data.next, limit)}>next</a>)
          
    let searchDetails = <div>
        {searchName}
        {dataInspectButton}
    </div>
    this.pane.appendChild(searchDetails)
  
    let list = <ul>{...data.data.map(ea => {
          
        let citationCount = 0
        for(let paper of ea.papers) {
          if (paper.citationCount) { 
            citationCount += paper.citationCount            
          }
        }    
        let bestPaper = ea.papers.sortBy(ea => ea.citationCount).last
        return <li><a href={"scholar://browse/author/" + ea.authorId}><b>{ea.name}</b></a> (publications: {ea.papers.length}, cites: {citationCount}) {bestPaper ? '"' + bestPaper.title + '"' + " (" + bestPaper.year + ")" : ""}</li>
      })
    }</ul>
    
    this.pane.appendChild(list)
    
    this.pane.appendChild(nextPages)
    this.fixLinks()
  }
  
  renderNoPaper() {
    this.get("#pane").innerHTML = "microsoftid or paper missing"
  }
  
  // #important
  async renderShort() {
    if (!this.paper) {
      return this.renderNoPaper()
    }
    let pdfs = this.getPDFs()
    this.get("#pane").innerHTML = ""
    this.get("#pane").appendChild(<div class="paper" title="">
      {this.renderCitationKey()}
      <span class="authors">{...this.renderAuthorsLinks()}.</span>
      {this.renderYear()}.
      {this.renderTitle()}.
      {this.renderDOI()}
      {this.renderPublication()}
      {this.renderPDFs()}
      {this.renderCitationCount()}
    </div>)
  }
  
  renderCitationKey() {
    return <a class="key" title="citation key" href={`bib://${this.paper.key}`}>[{this.paper.key}]</a>
  }
  
  renderAuthorsLinks(authors = this.paper.authors) {
    return authors.map((ea,index) => {
      if (ea.id && ea.id.match(/openalex/)) {
        return <span><a title="author" href={`alex://browse/authors/${ea.id.replace(/https:\/\/openalex.org\//,"")}`}>{ea.name}</a>{index < authors.length - 1 ? ", " : ""}</span>  
      }
      
      return <span><a title="author" href={`scholar://browse/author/${ea.id || ea.authorId}`}>{ea.name}</a>{index < authors.length - 1 ? ", " : ""}</span>
    })
  }
                       
  async renderPaperList(papers, authorName) {
    if (!papers) return

    let list = <ul></ul>
    for(let paper of papers) {
      list.appendChild(await (<literature-paper class="paperListEntry" mode="short" alexid={paper.id.replace(/https:\/\/openalex.org\//,"") }>{JSON.stringify(paper)}</literature-paper>))
    }
    this.pane.appendChild(list)
  }
                  
  renderYear() {
    // href={`academic://hist:Composite(AA.AuId=${this.paper.authors[0].id})?count=100&attr=Y`}
    return <span class="year"><a title="year">{this.paper.year}</a></span>
  }
    
  renderTitle() {
    let ref = ""
    if (this.paper.alexid) {
       ref = `alex://browse/${this.paper.alexid}`
    } else if (this.paper.scholarid) {
      ref = `scholar://browse/paper/${this.paper.scholarid}`
    }
    
    return <span class="title"><a title="title" href={ref}>{this.paper.title}</a></span>
  }
    
  renderDOI() {
    let doiURL = `https://doi.org/${this.paper.doi}`
    // click={async () => {
    //    let comp = await lively.openComponentInWindow("lively-iframe")
    //    comp.setURL(doiURL)
    //  }}
    return <span class="doi" title="DOI">
      {this.paper.doi ? 
        <a href={doiURL} target="_blank">{this.paper.doi}</a> : ""
      } 
    </span>
  }
    
  renderPDFs(renderHeading=false) {
    let pdfs = this.getPDFs() || []
    return <span class="pdfs">
        { renderHeading && pdfs && pdfs.length > 0 ? <h3>Import PDFs</h3> : ""}
         { pdfs && pdfs.length > 0 ? "PDFs:" : ""} {...pdfs
            .map((ea, index) => <a title={ea} click={async () => {
                let comp = await lively.openComponentInWindow("external-resource")
                comp.parentElement.setAttribute("title", await this.paper.generateFilename())
                comp.importURL = await this.paper.toImportURL()
                comp.src = ea
                lively.setExtent(comp.parentElement, lively.pt(800,800))
              }}>[{index + 1}]</a>) // ea.replace(/.*\//,"")
            .map((ea,index) => <span>{ea}{index < pdfs.length - 1 ? ", " : ""}</span>)
        }
      </span>

  }
  
  renderPublication() {
    if (!this.paper.hasPublicationInfo()) return ""
    
    return <span class="publication" title={this.paper.booktitle}>
      {this.renderJournalSnippet()}
      {this.renderConferenceSnippet()}
    </span>
    
   
  }
    
  renderJournalSnippet() {
    if (this.paper.value.J) {
      let academicJournalQuery = `academic://expr:And(V='${
          this.paper.value.V 
        }',I='${
          this.paper.value.I
        }',Composite(J.JId=${
          this.paper.value.J.JId
        }))?count=100`;
      return <span id="journal">
        <a href={academicJournalQuery}>
          {this.paper.value.J.JN  + " Volume " + this.paper.value.V + " Issue" + this.paper.value.I}
        </a>
      </span>
    } else {
      return ""
    }
  }
    
  renderConferenceSnippet() {
    if (this.paper.value.C) {
      return <span id="conference">
        <a title={this.paper.value.VFN} href={`academic://expr:And(Composite(C.CId=${this.paper.value.C.CId}),Y=${this.paper.year})?count=50`}>{ this.paper.value.C.CN}</a>:
        {this.paper.booktitle}
      </span>
    } else {
      return ""
    }
  }
    
  renderCitationCount() {
    if (this.paper.value.ECC) {
      return <span id="citation-count">
        citations: <a href={`academic://hist:RId=${this.paper.microsoftid}?count=100&attr=Y`}>{this.paper.value.ECC}</a>
      </span>
    } else {
      return ""
    }
  }
  /*MD  ## Misc MD*/
    
    
  async papersToShortEntriesList(papers) {
    let shortEntries = []
    for(let ea of papers) {
      let comp = await (<literature-paper mode="short" scholarid={ea.scholarid}></literature-paper>)
      comp.paper = ea
      comp.updateViewDebounced()
      shortEntries.push(<li>{comp}</li>)
    }
    return <ul>{...shortEntries}</ul>
  }
    
    
  async openIFrame(url) {
    let iframe = await lively.openComponentInWindow("lively-iframe")
    iframe.hideMenubar()
    lively.setExtent(iframe.parentElement, lively.pt(1210, 700))
    iframe.setURL(url)
    return iframe
  }
    


  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    // this.scholarId = "5008cd9c1f65c34088bebdd1e86e033265d61c6a"
    
    // this.scholarPaper = "MAG:2087784813"
    
    // this.searchQuery = "Toward Multi Language And Multi Environment Framework For Live Programming"
    
    
    // this.scholarId = "f24887f1cb1f1783c9a4481067453790b96f0752"
    // this.mode = "short"
    
    this.alexId = "W2741809807"
    // this.mode = "short"
    
    // this.searchQuery = "Smalltalk 80"
  }
}