import Morph from 'src/components/widgets/lively-morph.js';
import {Paper} from "src/client/literature.js"

export default class AcademicPaper extends Morph {
  async initialize() {
    this.windowTitle = "AcademicPaper";
    this.registerButtons()
    
    this.updateView()
  }

  get microsoftid() {
    return this.getAttribute("microsoftid")
  }
  
  set microsoftid(id) {
    this.setAttribute("microsoftid", id)
  }
  
  get mode() {
    return this.getAttribute("mode")
  }
  
  set mode(s) {
    this.setAttribute("mode", s)
  }
  
  async ensurePaper() {
    if (!this.paper) {
      if (!this.microsoftid) { return null}
      this.paper = await Paper.getId(this.microsoftid)      
    }
    return this.paper
  }
  
  getPDFs() {
    return this.paper.value.S && this.paper.value.S.filter(ea => ea.Ty == 3).map(ea => ea.U);
  }
  
  renderNoPaper() {
    this.get("#pane").innerHTML = "microsoftid or paper missing"
  }
  
  async renderShort() {
    if (!this.paper) {
      return this.renderNoPaper()
    }
    
    var pdfs = this.getPDFs()
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
  
  renderAuthorsLinks() {
    var authors = this.paper.authors
    return authors.map((ea,index) => 
      <span><a title="author" href={`academic://expr:Composite(AA.AuId=${ea.id})?count=1000`}>{ea.name}</a>{index < authors.length - 1 ? ", " : ""}</span>)
  }
  
  renderYear() {
    return <span class="year"><a title="year" href={`academic://hist:Composite(AA.AuId=${this.paper.authors[0].id})?count=100&attr=Y`}>{this.paper.year}</a></span>
  }
    
  renderTitle() {
    return <span class="title"><a title="title" href={`academic://expr:Id=${this.paper.microsoftid}?count=1`}>{this.paper.title}</a></span>
  }
    
  renderDOI() {
    var doiURL = `https://doi.org/${this.paper.doi}`
    // click={async () => {
    //    var comp = await lively.openComponentInWindow("lively-iframe")
    //    comp.setURL(doiURL)
    //  }}
    return <span class="doi" title="DOI">
      {this.paper.doi ? 
        <a href={doiURL} target="_blank">{this.paper.doi}</a> : ""
      } 
    </span>
  }
    
  renderPDFs(renderHeading=false) {
    var pdfs = this.getPDFs() || []
    return <span class="pdfs">
        { renderHeading && pdfs && pdfs.length > 0 ? <h3>Import PDFs</h3> : ""}
         { pdfs && pdfs.length > 0 ? "PDFs:" : ""} {...pdfs
            .map((ea, index) => <a title={ea} click={async () => {
                var comp = await lively.openComponentInWindow("external-resource")
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
      var academicJournalQuery = `academic://expr:And(V='${
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
    
  async papersToShortEntriesList(papers) {
    var shortEntries = []
    for(let ea of papers) {
      var comp = await (<academic-paper mode="short" microsoftid={ea.microsoftid}></academic-paper>)
      comp.paper = ea
      comp.updateView()
      shortEntries.push(<li>{comp}</li>)
    }
    return <ul>{...shortEntries}</ul>
  }
    
    
  async openIFrame(url) {
    var iframe = await lively.openComponentInWindow("lively-iframe")
    iframe.hideMenubar()
    lively.setExtent(iframe.parentElement, lively.pt(1210, 700))
    iframe.setURL(url)
    return iframe
  }
    
  async renderLong() {
    var container = lively.query(this, "lively-container")
    var paper = this.paper
    if (!paper) {
     return this.renderNoPaper()
    }
    
    var bibtexEntries = await paper.findBibtexFileEntries()
    var fields = paper.value.F || []
    var fieldsSpan = <span id="fields"> 
        { fields.length > 0 ? <h3>Fields</h3> : ""}  
        {...paper.value.F.map(F => 
            <span class="field"><a  href={`academic://expr:Composite(F.FId=${F.FId})?count=30`}>{F.DFN}</a> </span>)
        }
      </span>
        
    var title = <h1 class="title">{this.renderTitle()} ({this.renderYear()})</h1>
    var authorsList = <h2 class="authors">{...this.renderAuthorsLinks()}</h2>
    var bibtexEntriesSpan = <span>{...
        bibtexEntries.map(ea => 
            <span><a href={ea.url}>{ea.url.replace(/.*\//,"")}</a> </span>) 
        }</span>
    var bibtextImportButton = <button click={async () => {
       await Paper.importBibtexId(paper.microsoftid)
       await lively.sleep(1000) // let the indexer do it's work?
       if (container) container.setPath(container.getPath())
     }}>import bibtex entry</button>
  
    var bibtexOpenButton = <button click={async () => {
        var comp = await lively.openWorkspace(paper.toBibtex())
        comp.mode = "text/plain"
        comp.parentElement.setAttribute('title', "Bibtex Source")
        lively.setExtent(comp.parentElement, lively.pt(900, 200))
      }}>bibtex</button>
      
    var bibliographySection = <section>
        <h3>Bibliographies</h3>
        {bibtexOpenButton}          
        {
          bibtexEntries.length > 0 ? 
            bibtexEntriesSpan  : 
            bibtextImportButton 
        }
      </section>
    
    var abstractSection = <section>
        <h3>Abstract</h3>
        <div class="abstract">{this.paper.abstract}</div>
      </section>
        
    var referencesSection = <section>
        <h3>References</h3>
        <span id="references">loading references</span>
      </section>
    paper.resolveReferences().then(async () => {
      var element = referencesSection.querySelector("#references")
      element.innerHTML = ""
      var list = await this.papersToShortEntriesList(paper.references)
      element.appendChild(list)
    })
    
    let rerferencedBySection = <section>
        <h3>Referenced By</h3>
        <span id="references">loading references</span>
      </section>
    paper.findReferencedBy().then(async () => {
      var element =  rerferencedBySection.querySelector("#references")
      element.innerHTML = ""
      var list = await this.papersToShortEntriesList(paper.referencedBy)
      element.appendChild(list)
    })

    this.get("#pane").innerHTML =  ""
    this.get("#pane").appendChild(await (<div class="paper">  
      {title} 
      {authorsList}
      <div>
        <button style="display:inline-block" click={() => lively.openInspector(paper)}>inspect</button>
        {this.renderCitationKey()}
        {this.renderDOI()}
        <span>{this.renderPublication()}</span>
        {this.renderCitationCount()}
        <span class="external">
          <a title="Microsoft Academics" click={ () => {
              var microsoftURL = `https://academic.microsoft.com/paper/${this.paper.microsoftid}`
              this.openIFrame(microsoftURL)      
          }}>⇗MA</a>
        </span>
      </div>
      {fieldsSpan}
      {this.renderPDFs(true)}
      {bibliographySection}
      {abstractSection}
      {referencesSection}
      {rerferencedBySection}
    </div>))
  }  
  
  async updateView() {
    await this.ensurePaper()
    if (this.mode == "short") {
      await this.renderShort()
    } else {
      await this.renderLong()
    }
    var container = lively.query(this, "lively-container")
    if (container) {
      lively.html.fixLinks([this.get("#pane")], undefined, path => container.followPath(path));
    } else {
      lively.html.fixLinks([this.get("#pane")], undefined, path => lively.openBrowser(path));      
    }
    
  }
  

  
  async livelyExample() {
    // this.mode = "short"
    this.microsoftid = 2148357053
    this.updateView()
  }
  
}