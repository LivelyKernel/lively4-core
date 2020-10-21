import { Scheme } from "src/client/poid.js";
import PolymorphicIdentifier from "src/client/poid.js";
import focalStorage from "src/external/focalStorage.js";
import { parseQuery, getDeepProperty } from 'utils';

import BibtexParser from 'src/external/bibtexParse.js';
import Bibliography from "src/client/bibliography.js"

import FileIndex from "src/client/fileindex.js";

import Literature from "src/client/literature.js"

import _ from 'src/external/lodash/lodash.js';
/*MD 
# Microsoft Academic Search 
MD*/

/*MD 
<style>* {background-color:lightgray}</style>

### Documentation

<https://docs.microsoft.com/en-us/academic-services/project-academic-knowledge/reference-paper-entity-attributes>

### Microsoft Academic Raw Query:

```javascript{.example}
  fetch("https://academic.microsoft.com/api/search", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          query: "", 
          queryExpression: "Composite(AA.AuN='jens lincke')", 
          filters: [], 
          orderBy: 0, 
          skip: 0,
          sortAscending: true, 
          take: 10})
        }).then(r => r.json())
```


### And with our Scheme

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/json"
  }
}).then(r => r.json())
```

We also support different content type, e.g. the default is HTML

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "text/html"
  }
}).then(r => r.text())
```

or bibtex

```javascript
fetch("academic://Jens Lincke 2009", {
  method: "GET",
  headers: {
    "content-type": "application/bibtex"
  }
}).then(r => r.text()).then(s => {
  return s
} )
```


MD*/

import MarkdownIt from "src/external/markdown-it.js";

export class MicrosoftAcademicEntities {

  
  static get baseURL() {
    return "https://raw.githubusercontent.com/MicrosoftDocs/microsoft-academic-services/live/academic-services/project-academic-knowledge/";
  }

  static async generateSchema(entityName) {
    return this.schemaFromURL(this.baseURL + "reference-" + entityName + "-entity-attributes.md")
  }
    
  
  static async schemaFromURL(url) {
    var content = await fetch(url).then(r => r.text());
    var md = new MarkdownIt();
    var html = md.render(content);
    var div = <div></div>;
    div.innerHTML = html;
    var tbody = div.querySelector("tbody");
    return tbody ? Array.from(tbody.querySelectorAll("tr").map(ea => Array.from(ea.querySelectorAll("td").map(td => td.textContent))).map(ea => ({ name: ea[0], description: ea[1], type: ea[2], operations: ea[3] }))) : [];
  }  

  static entityTypeEnum() {
    return ["paper", "author", "journal", "conference-series", "conference-instance", "affiliation", "field-of-study"]
  }
    
  static getEntityType(i) {
    return this.entityTypeEnum()[i]
  }
    
  static async allSchemas() {
    var all = {};
    all.entity =  await this.schemaFromURL(this.baseURL + "reference-entity-attributes.md")
    
    //all.entityTypeEnum = ["Paper", "Author", "Journal", "Conference Series", "Conference Instance", "Affiliation", "Field Of Study"]
    all.entityTypeEnum = this.entityTypeEnum()

    for (var ea of ["affiliation", "author", "conference-instance", "conference-series", "field-of-study", "journal", "paper"]) {
      var list = await this.generateSchema(ea);
      var obj = {};
      for (var item of list) {
        obj[item.name] = item;
      }

      all[ea] = obj;
    }
    return all;
  }

    
  static async schemas() {
    // window.lively4academicSchemas = null
    if (!window.lively4academicSchemas) {
      window.lively4academicSchemas = await this.allSchemas();
    }
    return window.lively4academicSchemas;
  }

}

const academicSubscriptionKeyId = "microsoft-academic-key";

function specialInspect(target, contentNode, inspector, normal) {
    inspector.renderObjectdProperties(contentNode, target)
    

    for(var name of Object.keys(Object.getOwnPropertyDescriptors(target.__proto__))) {
      var desc = Object.getOwnPropertyDescriptor(target.__proto__, name)
      if (desc.get) {
        try {
          contentNode.appendChild(inspector.display(target[name], false, name, target))
        } catch(e) {
          // ignore e
        }
      }
    }    
  }


export class Author {
 
  constructor(value) {
    this.value = value
  }

  get name() {
   return this.value.DAuN // "Original author name"
  }
  
  get id() {
    return this.value.AuId 
  }
  
  livelyInspect(contentNode, inspector, normal) {
    specialInspect(this, contentNode, inspector, normal)
  }
}


export class Paper {
  
  static async ensure(raw) {
    var existing = await Literature.getPaperEntry(raw.microsoftid)
    if (!existing) {
      var p = new Paper(raw)
      if(!raw.Id) {
        throw new Error("Id is missing (microsoftid)")
      }

      Paper.setById(raw.Id, p)      
    } else {
      p = new Paper(existing.value)
    }    
    return p
  }
  
  static byId(id) {
    if (!this._byId) return
    var paper = this._byId.get(id)
    return paper     
  }

  static setById(id, paper) {
    if (!this._byId) this._byId = new Map()
    this._byId.set(id, paper)
    Literature.addPaper(paper)
  }

  static async getId(id, optionalEntity) {
    var paper = this.byId(id)
    if (paper) return paper
    if (optionalEntity) {
      paper = await Paper.ensure(optionalEntity)    
    } else {
      var entry = await Literature.getPaperEntry(id)
      if (entry) {
        paper = new Paper(entry.value)
      } else {
        // download it individually
        var resp = await fetch("academic://expr:Id=" + id, {
            method: "GET", 
            headers: {
              "content-type": "application/json"}})
        if (resp.status != 200) {
          return // should we note it down that we did not found it?
        }
        var json = await resp.json()
        paper = await Paper.ensure(json) // json.entity ?    
      }
    }
    return paper
  }

  static async allBibtexEntries() {
    return FileIndex.current().db.bibliography.toArray()
  }
  
  static async importBibtexId(id) {
    var paper = Paper.byId(id)
    if (paper) {
      var source = paper.toBibtex()
      
      var importURL = (await this.allBibtexEntries())
            .map(ea => ea.url)
            .find(ea => ea && ea.match(/_incomming\.bib$/))
      if (!importURL) {
        lively.notify("no _incomming.bib found")
      } else {
        var libcontent = await lively.files.loadFile(importURL)
        
        await lively.files.saveFile(importURL, libcontent + "\n" + source )
        lively.notify("PATER imported", "", undefined, () => lively.openBrowser(importURL))
      }
    } else {
      lively.notify("ERROR not paper with id '${this.microsoftid}' found")
    }
  }
  
  
  constructor(value) {
    if (!value) throw new Error("value is missing")
    this.value = value
  }
  
  get authors() {
    return (this.value.AA || []).map(ea => new Author(ea)) 
  }

  get authorNames() {
    return (this.value.AA || []).map(ea => ea.DAuN) 
  }

  
  get year() {
    return this.value.Y 
  }

  get title() {
    return (this.value.DN || "")// "Original paper title"
      .replace(/["{}]/g,"")  // some cleanup
  }

  get doi() {
    return this.value.DOI 
  }
  
  get microsoftid() {
    return this.value.Id 
  }
  
  get bibtexType() {
    return ({
      'a': "article", 
      'b': "book", 
      'c': "incollection", 
      'p': "inproceedings"})[this.value.BT]  
  }
  
  get booktitle() {
    return this.value.BV
  }
  
  get key() {
    return this.toBibtexEntry().citationKey 
  }
  
  get keywords() {
    return (this.value.F || []).map(ea => ea.DFN)    
  }
  
  
  async findBibtexFileEntries() {
    var key = this.key
    var entries = await Paper.allBibtexEntries()
        
    return entries.filter(ea => ea.key == key)    
  }
   
  toBibtexEntry() {
    var entry = {
      entryTags: {
        author: this.authors.map(author => author.name).join(" and "), 
        title: this.title,
        year: this.year,
        microsoftid: this.microsoftid,
      },
      entryType: this.bibtexType
    }
    if (this.booktitle) { entry.entryTags.booktitle = this.booktitle }
    if (this.doi) { entry.entryTags.doi = this.doi }

    if (this.references) {
        entry.entryTags.microsoftreferences = this.references.map(ea => ea.microsoftid).join(",")
    }
    if (this.referencedBy) {
        entry.entryTags.microsoftreferencedby = this.referencedBy.map(ea => ea.microsoftid).join(",")
    }

    entry.citationKey = Bibliography.generateCitationKey(entry)
    return entry
  }
  
  get abstract() {
    var index = this.value.IA && this.value.IA.InvertedIndex
    if (!index) return
    var result = []
    for(var word of Object.keys(index)) {
      for (var pos of index[word]) {
        result[pos] = word
      }
    }
    return result.join(" ")
  }

  
  allReferencesRequery(references) {
    if (!references || references.length == 0) return 
    return `Or(${ references.map(ea => 'Id=' + ea).join(",")})`
  } 
  
  
  async academicQueryToPapers(query) {
    if (!query) return []
    try {
      var response = await new AcademicScheme().rawQueryExpr(query, 1000)
    } catch(e) {
      console.warn("[academic] Error academicQueryToPapers " + query + "... BUT WE CONTINUE ANYWAY")
      return null
    }
    var result = []
    for(var entity of response.entities) {
      result.push(await Paper.getId(entity.Id, entity))
    }
    return result
  }

  async resolveMicrosoftIdsToPapers(references) {
    var papers = []
    var rest = []
    
    // bulk queries are faster
    var entries = await Literature.getPaperEntries(references)
    for(var microsoftid of references) {
      // look each up if in db
      var entry = entries.find(ea => ea && (ea.microsoftid == microsoftid))
      if (entry && entry.value) {
        papers.push(new Paper(entry.value))
      } else {
        rest.push(microsoftid)
      }
    } 
    // bulk load the rest
    if (rest.length > 0) {
      let list = await this.academicQueryToPapers(this.allReferencesRequery(rest))
      if (list) papers = papers.concat(list)
    }
    return papers
  }
  
  async resolveReferences() {
    
    this.references = []
    if (!this.value.RId) return // nothing to do here    
    
    this.references = await this.resolveMicrosoftIdsToPapers(this.value.RId)
    return this.references
  }
  
  async findReferencedBy() {
    if (this.referencedBy || !this.microsoftid) return;
    
    var entry = await Literature.getPaperEntry(this.microsoftid)
    if (entry && entry.referencedBy) {
      this.referencedBy = await this.resolveMicrosoftIdsToPapers(entry.referencedBy)
    } else {
      console.log("FETCH referencedBy " + this.microsoftid)
      
      this.referencedBy = await this.academicQueryToPapers("RId=" + this.microsoftid)  
      if (this.referencedBy) {
        await Literature.patchPaper(this.microsoftid, {
          referencedBy: this.referencedBy.map(ea => ea.microsoftid)})           
      }
    }
    return this.referencedBy
  }
  
  papersToBibtex(papers) {
    return `<lively-bibtex>
      ${
        papers
            .map(ea => `<lively-bibtex-entry>${ea.toBibtex()}</lively-bibtex-entry>`)
            .join("\n")
      }
      </lively-bibtex>` 
  }
  
  static shortPaperCSS() {
    return `
      .paper {
        padding: 5px;
        padding-left: 30px;
      }

      .paper .key {
        margin-left: -30px;      
        font-size: 10pt;
        font-weight: bold;
      }

      .paper .title {
        font-style: italic;
      }

      .paper .title {
        font-style: italic;
      }


      .paper a {
        color: black;
        text-decoration-line: none
      }

      .paper a:hover {
        color: darkblue;
        text-decoration: underline currentcolor; 
      }


    `
  }
    
  async toShortHTML() {
    
    var bibtexEntries = await this.findBibtexFileEntries()
    var pdfs = this.value.S && this.value.S.filter(ea => ea.Ty == 3).map(ea => ea.U);
    
    return `<div class="paper" title="">
      <style>
          .abstract {
            color: gray;
            font-style: italic;
          }
      </style>
      <a class="key" href="bib://${this.key}">[${this.key}]</a>
      <span class="authors">${
        this.authors.map(ea => `<a href="academic://expr:Composite(AA.AuId=${ea.id})?count=1000">${ea.name}</a>`).join(", ")
      }.
      </span>
      <span class="year"><a href="academic://hist:Composite(AA.AuId=${this.authors[0].id})?count=100&attr=Y"> ${this.year}</a>.</span>
      <span class="title"><a href="academic://expr:Id=${this.microsoftid}?count=1">${this.title}</a>. </span>
      <span class="doi"><a href="https://doi.org/${this.doi}" target="_blank">${
        this.doi
      }</a></span>
  
      ${this.htmlJournalSnippet()}
      <span id="conference">${this.value.C ? this.value.C.CN  : ""}</span>
  
       
      ${
        (pdfs && pdfs.length) > 0 ? 
          "(" + pdfs.map(url => `<a href="${url}" title="${url}">pdf ⇗</a>`).join(", ") + `)` : ""
      }
    </div>`
  }
    
  htmlJournalSnippet() {
    return this.value.J ? `<span id="journal">` + `<a href=
        "academic://expr:And(V='${this.value.V }',I='${this.value.I}',Composite(J.JId=${this.value.J.JId}))?count=100"
        }> ` + this.value.J.JN  
          + " Volume " + this.value.V 
          + " Issue" + this.value.I + "</a><span>": ""
  }
    
  async toHTML() {
    await this.resolveReferences() // .then(() => lively.notify("resolved references for " + this.key))
    await this.findReferencedBy()
    
    var bibtexEntries = await this.findBibtexFileEntries()
    var pdfs = this.value.S && this.value.S.filter(ea => ea.Ty == 3).map(ea => ea.U);
    
    return `<div class="paper">
      <style>
          .abstract {
            color: gray;
            font-style: italic;
          }
      </style>
      <h1 class="title">${
        this.title
      } <span class="year">(${
          this.year
        })</span>
      </h1> 
      <h2 class="authors">${
    this.authors.map(ea => `<a href="academic://expr:Composite(AA.AuId=${ea.id})?count=1000">${ea.name}</a>`).join(", ")
      }</h2>
      <div>
      <a href="bib://${this.key}">[${this.key}]</a>
      <span class="doi"><a href="https://doi.org/${this.doi}" target="_blank">${
        this.doi
      }</a></span>
  
      <div>${this.htmlJournalSnippet()}</div>
        <div id="fields">${this.value.F ? "<h3>Fields</h3> " + 
            this.value.F.map(F => `<a href=
        "academic://expr:Composite(F.FId=${F.FId})?count=30"
        }> ` + F.DFN + "</a>").join(" "): "" }</div>

      <lively-script><script>
        import {Paper} from "src/client/protocols/academic.js";
        
        (<button click={() => lively.openInspector(Paper.byId(${this.microsoftid}))}>inspect</button>)
      </script></lively-script> 
  
      </div>
      ${
        pdfs.length > 0 ? 
           "<h3>Online PDFs</h3>" + pdfs.map(url => `<a href="${url}">${url.replace(/.*\//,"")}</a>`) : ""
      }
      <h3>Bibliographies</h3>
      <div>${
        bibtexEntries.length > 0 ?
          bibtexEntries.map(ea => `<a href="${ea.url}">${ea.url.replace(/.*\//,"")}</a>`).join(", ") :    
        
`<lively-script><script>
// here comes some inception....
 import {Paper} from "src/client/protocols/academic.js"
   var container = lively.query(this, "lively-container")
   var result = <button click={async () => {
     await Paper.importBibtexId(${this.microsoftid})
     await lively.sleep(1000) // let the indexer do it's work?
     if (container) container.setPath(container.getPath())
   }}>import bibtex entry</button>
   result
</script></livley-script>`

      }</div>

      <h3>Abstract</h3>
      <div class="abstract">${this.abstract}</div>
      <h3>References</h3>
      ${this.papersToBibtex(this.references)}
      <h3>Referenced By</h3>
      ${this.papersToBibtex(this.referencedBy)}     
  </div>`
  }
  
  toBibtex() {
    var entry = this.toBibtexEntry()
    return BibtexParser.toBibtex([entry], false);
  }
   
  livelyInspect(contentNode, inspector, normal) {
    specialInspect(this, contentNode, inspector, normal)
    contentNode.appendChild(inspector.display(this.toBibtex(), false, "#bibtex", this))
  }
  
}

export default class AcademicScheme extends Scheme {

  get scheme() {
    return "academic";
  }

  resolve() {
    return true;
  }

  static async setSubscriptionKey(key) {
      return focalStorage.setItem(academicSubscriptionKeyId, key);
  }
  
  
  static async getSubscriptionKey() {
    var key = await focalStorage.getItem(academicSubscriptionKeyId);
    if (!key) {
      key = await lively.prompt(`Enter your <a href="https://msr-apis.portal.azure-api.net/developer" target="_">Project Academic Knowledge</a> key`, "");
      await this.setSubscriptionKey(key);
    }
    return key
  }

  response(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 200
    });
  }

  notfound(content, contentType = "text/html") {
    return new Response(content, {
      headers: {
        "content-type": contentType
      },
      status: 303
    });
  }

  academicKnowledgeAttributes() {
    return [
        ["Ty", "Type"],
        ["AA.AfId","Author affiliation ID"],
        ["AA.AfN","Author affiliation name"],
        ["AA.AuId","Author ID"],
        ["AA.AuN","Normalized author name"],
        ["AA.DAuN","Original author name"],
        ["AA.DAfN","Original affiliation name"],
        ["AA.S","Numeric position in author list"],
        ["AW","Unique, normalized words in abstract, excluding common/stopwords"],
        ["BT","BibTex document type ('a':Journal article, 'b':Book, 'c':Book chapter, 'p':Conference paper)"],
        ["BV","BibTex venue name"],
        ["C.CId","Conference series ID"],
        ["C.CN","Conference series name"],
        ["CC","Citation count"],
        ["CitCon","Citation contexts</br></br>List of referenced paper ID's and the corresponding context in the paper (e.g. [{123:[\"brown foxes are known for jumping as referenced in paper 123\", \"the lazy dogs are a historical misnomer as shown in paper 123\"]})"],
        ["D","Date published in YYYY-MM-DD format"],
        ["DN","Original paper title"],
        ["DOI","Digital Object Identifier</br></br>IMPORTANT: The DOI is normalized to uppercase letters, so if querying the field via evaluate/histogram ensure that the DOI value is using all uppercase letters"],
        //["E","Extended metadata</br></br>IMPORTANT: This attribute has been deprecated and is only supported for legacy applications. Requesting this attribute individually (i.e. attributes=Id,Ti,E) will result in all extended metadata attributes being returned in a serialized JSON string</br></br>All attributes contained in the extended metadata are now available as a top-level attribute and can be requested as such (i.e. attributes=Id,Ti,DOI,IA)"],
        ["ECC","Estimated citation count"],
        ["F.DFN","Original field of study name"],
        ["F.FId","Field of study ID"],
        ["F.FN","Normalized field of study name"],
        ["FamId","If paper is published in multiple venues (e.g. pre-print and conference) with different paper IDs, this ID represents the main/primary paper ID of the family. The field can be used to find all papers in the family group, i.e. FamId=<paper_id>"],
        ["I","Publication issue"],
        ["IA","Inverted abstract"],
        ["Id","Paper ID"],
        ["J.JId","Journal ID"],
        ["J.JN","Journal name"],
        ["FP","First page of paper in publication"],
        ["LP","Last page of paper in publication"],
        ["PB","Publisher"],
        ["Pt","Publication type (0:Unknown, 1:Journal article, 2:Patent, 3:Conference paper, 4:Book chapter, 5:Book, 6:Book reference entry, 7:Dataset, 8:Repository"],
        ["RId","List of referenced paper IDs"],
        ["S","List of source URLs of the paper, sorted by relevance"],
        ["Ti","Normalized title"],
        ["V","Publication volume"],
        ["VFN","Full name of the Journal or Conference venue"],
        ["VSN","Short name of the Journal or Conference venue"],
        ["W","Unique, normalized words in title"],
        ["Y","Year published"]
      ].map(ea => ea[0]).join(",")
  }
  
  async rawQueryInterpret(textQuery, count) {
      var interpretation = await fetch(
        `https://api.labs.cognitive.microsoft.com/academic/v1.0/interpret?query=`
            + encodeURI(textQuery)
            + `&complete=1`
            + `&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      if (!interpretation.interpretations[0] || !interpretation.interpretations[0].rules[0]) {
        return {error: "no interpretations", value: interpretation}
      }
      
      var queryExpr = interpretation.interpretations[0].rules[0].output.value
      return this.rawQueryExpr(queryExpr, count)
  }
  
  async rawQueryExpr(queryExpr, count=10, attributes) {
    var attributes =  attributes || this.academicKnowledgeAttributes()    
    var result = await fetch(`cached:https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=`
            + encodeURI(queryExpr)
            + `&count=${count}`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }
  
  async rawQueryHist(queryExpr, attributes=["Y"], count=10) {
    var result = await fetch(`cached:https://api.labs.cognitive.microsoft.com/academic/v1.0/calchistogram?expr=`
            + encodeURI(queryExpr)
            + `&count=${count}`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }

  async entityQuery(queryString, queryType, count, attributes) {
    let raw;
    if (queryType=="expr") {
      raw = (await this.rawQueryExpr(queryString, count, attributes))
    } else {
      raw = (await this.rawQueryInterpret(queryString, count))
    }
    if (raw.entities)  {
      return  raw.entities
    } else {
      return { 
        error: "could not find entities", 
        value: raw
      }
    }
  }

  async content(entities) {
    var content = ``;
    if (entities.error) return `<span class="error">${entities.error}</span>`
    


    if (this.query.startsWith("expr:")) {
      var code = `lively.openMarkdown(lively4url + "/demos/visualizations/academic.md", 
        "Academic Visualizaton", {
          query: ${JSON.stringify(this.query)},
          "count": ${this.count},
          "min_cc_in": 2,
          "min_refs_out": 10,
      })`
      content += `<button onclick="${code.replace(/"/g,"&quot;")}">visualize</button>`
      
      var histogramCode = `lively.openMarkdown(lively4url + "/demos/visualizations/academic-histogram.md", 
        "Academic Histogram", {
          query: ${JSON.stringify(this.query.replace(/^expr\:/,""))},
          "count": ${this.count},
      })`
      content += `<button onclick="${histogramCode.replace(/"/g,"&quot;")}">histogram</button>`
      
      var inspectCode = `
        let url = "academic://${this.query}?count=${this.count}"
        lively.notify("inspect: " + url);
        lively.files.loadJSON(url).then(json => {
           lively.openInspector(json)
        })  
      `
      content += `<button onclick="${inspectCode.replace(/"/g,"&quot;")}">inspect</button>`
    }
    
    
    if (entities.length > 1) {
      content += `<style>${Paper.shortPaperCSS()}</style>\n`
      for(var entity of entities) {
        let paper = await Paper.ensure(entity)
        content += await paper.toShortHTML();
      }      
    } else if (entities.length == 1) {
      let paper = await Paper.ensure(entities[0])
      content += await paper.toHTML() + "\n";
    } else {
      content += "<h1>No entities found</h1>" + "\n";
    }
    return content;
  }

  async GET(options) {
    var query = this.url.replace(new RegExp(this.scheme + "\:\/\/"), "");
    if (query.length < 2) return this.response(`{"error": "query to short"}`);
    
    
    var argsString = query.replace(/.*\?/,"")
    query = query.replace(/\?.*/,"") // strip arguments
   
    this.query = decodeURI(query);
    
    // adhoc url paremeter decoding...
    var args = {}
    argsString.split(/[?&]/).forEach(ea => {
      var pair = ea.split("=")
      args[pair[0]] = pair[1]
    })
    this.count = args["count"] || 10
    
    var attributes = args["attr"]; // optional
   
    // example: 
    //  "expr:Id=3" -> expr is query type
    var typeRegex = /^([a-z]*):/
    var m = query.match(typeRegex)
    query = decodeURI(query);
    if (m) {
      var queryType = m[1]
      query = query.replace(typeRegex,"")
    }
    
    
    options = options || {}
    var headers = new Headers(options.headers); // #Refactor we should unify options before
    
    if (queryType=="meta") {
      var schemas = await MicrosoftAcademicEntities.schemas()
      var result = schemas
      var path = query.split("/")
      for(let key of path) {
        try {
          if (key) {
            result = result[key]
          }
        } catch(e) {
          this.response("could not find " + query + " in schemas");
        }
      }
      
      
      return this.response(JSON.stringify(result, undefined, 2), "application/json");
    }
    
    if (queryType=="raw") {
      let raw = await this.rawQueryExpr(query, this.count, attributes)
      return this.response(JSON.stringify(raw, undefined, 2), "application/json");      
    }
    
    if (queryType=="hist") {
      if (headers.get("content-type") == "application/json") {
        let raw = (await this.rawQueryHist(query, attributes, this.count))
        return this.response(JSON.stringify(raw, undefined, 2), "application/json");
      } else {
        return this.response(`
<html>
<lively-script><script>
  (async () => {
      var url = lively4url + "/demos/visualizations/academic-histogram.md"
      var comp = await (<lively-markdown style="width:100%; height:100%"></lively-markdown>);
      var src = await fetch(url).then(r => r.text());
      comp.parameters = {
        query: ${JSON.stringify(decodeURI(query))},
        attr: "${attributes}",
        "count": 100,
      };
      comp.setContent(src);
      comp.parentElement.setAttribute("title", "Academic Histogram");
      return comp;
    })()
</script><lively-script>        
        

</html>
`)        
  
      
      
      }
    } 
    
    let entities = await this.entityQuery(query, queryType, args.count, attributes);
    if (options && options.headers) {
      if (headers.get("content-type") == "application/json") {
        return this.response(JSON.stringify(entities), "application/json");
      }
      
      if (headers.get("content-type") == "application/bibtex") {
        var papers = []
        for(let ea of entities) {
          papers.push(await Paper.ensure(ea))
        }        
        return this.response(papers.map(ea => ea.toBibtex()).join("\n"), "application/bibtex");
      } 
    }
    // default is HTML
    var content = await this.content(entities);
    return this.response(content);
  }

  async OPTIONS(options) {
    var content = JSON.stringify({}, undefined, 2);
    return new Response(content, {
      headers: {
        "content-type": "application/json"
      },
      status: 200
    });
  }

}

PolymorphicIdentifier.register(AcademicScheme);

// import Tracing from "src/client/tracing.js"
// Tracing.traceClass(Paper)
