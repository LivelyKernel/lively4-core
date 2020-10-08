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

### Example:  

```javascript{.example}
  import {MicrosoftAcademicEntities} from "src/client/protocols/academic-scheme.js"
  MicrosoftAcademicEntities.schemas()
``` 

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
    var md = new MarkdownIt();
    var content = await fetch(this.baseURL + "reference-" + entityName + "-entity-attributes.md").then(r => r.text());
    var html = md.render(content);
    var div = <div></div>;
    div.innerHTML = html;
    var tbody = div.querySelector("tbody");
    return tbody ? Array.from(tbody.querySelectorAll("tr").map(ea => Array.from(ea.querySelectorAll("td").map(td => td.textContent))).map(ea => ({ name: ea[0], description: ea[1], type: ea[2], operations: ea[3] }))) : [];
  }

  static async allSchemas() {
    var all = {};
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
  
  static ensure(raw) {
    var p = new Paper(raw)
    if (raw.microsoftid) {
      Paper.setById(raw.microsoftid, p)
    }
    return p
  }
  
  static byId(id) {
    if (!this._byId) return
    return this._byId.get(id)
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
      paper = Paper.ensure(optionalEntity)    
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
      paper = Paper.ensure(json.entity)    
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
    return `Or(${ references.map(ea => 'Id=' + ea).join(",")})`
  } 
  
  
  async academicQueryToPapers(query) {
    var response = await new AcademicScheme().rawQueryExpr(query, 100)
    var result = []
    for(var entity of response.entities) {
      result.push(await Paper.getId(entity.Id, entity))
    }
    return result
  }

  async resolveMicrosoftIdsToPapers(references) {
    return this.academicQueryToPapers(this.allReferencesRequery(references))
  }
  
  async resolveReferences() {
    this.references = []
    if (!this.value.RId) return // nothing to do here    
    this.references = await this.resolveMicrosoftIdsToPapers(this.value.RId) 
  }
  
  async findReferencedBy() {
    this.referencedBy = await this.academicQueryToPapers("RId=" + this.microsoftid)
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
      <lively-script><script>
        import {Paper} from "src/client/protocols/academic.js"
        
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
          
        `
<lively-script><script>
// here comes some inception....
import {Paper} from "src/client/protocols/academic.js"
var container = lively.query(this, "lively-container")
var result = <button click={async () => {
  await Paper.importBibtexId(${this.microsoftid})
  await lively.sleep(1000) // let the indexer do it's work?
  if (container) container.setPath(container.getPath())
}}>import bibtex entry</button>
result
</script></livley-script>
`
      }</div>

      <h3>Keywords</h3>
      ${
        this.value.F.map(ea => `<a href="academic://expr:Composite(F.FId=${ea.FId})">${ea.DFN}</a>`)
      }
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
  
  async rawQueryExpr(queryExpr, count=10) {
    var attributes =  this.academicKnowledgeAttributes()    
    var result = await fetch(`cached:https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=`
            + encodeURI(queryExpr)
            + `&count=${count}`
            + `&attributes=${attributes}`
            +`&subscription-key=${await AcademicScheme.getSubscriptionKey()}`).then(r => r.json())
      return result
  }

  async entityQuery(queryString, queryType, count) {
    let raw;
    if (queryType=="expr") {
      raw = (await this.rawQueryExpr(queryString, count))
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
    if (entities.length > 1) {
      for(var entity of entities) {
        let paper = Paper.ensure(entity)
        content += `<lively-bibtex-entry>${await paper.toBibtex()}</lively-bibtex-entry>`;
      }      
    } else if (entities.length == 1) {
      let paper = Paper.ensure(entities[0])
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
   
    // adhoc url paremeter decoding...
    var args = {}
    argsString.split(/[?&]/).forEach(ea => {
      var pair = ea.split("=")
      args[pair[0]] = pair[1]
    })
    
    
    // example: 
    //  "expr:Id=3" -> expr is query type
    var typeRegex = /^([a-z]*):/
    var m = query.match(typeRegex)
    query = decodeURI(query);
    if (m) {
      var queryType = m[1]
      query = query.replace(typeRegex,"")
    }
    
    
    let entities = await this.entityQuery(query, queryType, args.count);
    if (options && options.headers) {
      var headers = new Headers(options.headers); // #Refactor we should unify options before
      if (headers.get("content-type") == "application/json") {
        return this.response(JSON.stringify(entities), "application/json");
      }
      
      if (headers.get("content-type") == "application/bibtex") {
        return this.response(entities.map(ea => Paper.ensure(ea).toBibtex()).join("\n"), "application/bibtex");
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