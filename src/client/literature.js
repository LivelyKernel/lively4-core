import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"
 

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
        paper = await Paper.ensure(json[0])    
      }
    }
    return paper
  }

  static async allBibtexEntries() {
    return FileIndex.current().db.bibliography.toArray()
  }
  
  static async importBibtexId(id) {
    if (id === undefined) {
      throw new Error("importBibtexId missing id")
    }
    var paper = await Paper.getId(id)
    if (paper) {
      var source = paper.toBibtex()
      
      await this.importBibtexSource(source)
    } else {
      lively.notify(`ERROR no paper with id '${this.microsoftid}' found`)
    }
  }
    
  static async importBibtexSource(source) {
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
  
  hasPublicationInfo() {
    return this.value.J || this.value.C
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
      var response = await lively.files.loadJSON("academic://raw:" + query + "&count=" + 1000)
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
     return `<academic-paper mode="short" microsoftid="${this.microsoftid}"></academic-paper>`
  }

  async toHTML() {
    return `<academic-paper microsoftid="${this.microsoftid}"></academic-paper>`
  }
  
  async generateFilename() {
    var entry = this.toBibtexEntry()
    var bibentry = await (<lively-bibtex-entry></lively-bibtex-entry>)
    bibentry.value = entry
    var filename = bibentry.generateFilename(entry)
    return filename + ".pdf"
  }
  
  async toImportURL() {
    var filename = await this.generateFilename()
    var baseURL = await Paper.importBaseURL()
    if (!baseURL) {
      throw new Error("[Paper] toImportURL error: could not find baseURL " + Paper.importBaseURLDirName())
    }
    return baseURL + filename 
  }
  
  toBibtex() {
    var entry = this.toBibtexEntry()
    return BibtexParser.toBibtex([entry], false);
  }
   
  livelyInspect(contentNode, inspector, normal) {
    specialInspect(this, contentNode, inspector, normal)
    contentNode.appendChild(inspector.display(this.toBibtex(), false, "#bibtex", this))
  }
  
  static importBaseURLDirName() {
    return "_incoming" // #TODO add to preferences....
  }
  
  static async importBaseURL() {
    // #TODO make this also more customizeable
    var files =  await FileIndex.current().db.files.toArray()
    var file = files.find(ea => ea.url.match(`/${this.importBaseURLDirName()}/`))
    return file && file.url.replace(/[^/]*$/,"")
  }
  
}


export default class Literature {
  
  
  static async ensureCache() {
    if (this.isLoadingCache) {
      await this.isLoadingCache
    }
      
    if (!this.cachedPapers || !this.cachedPapersById) {
      this.isLoadingCache = new Promise(async resolve => {
        try {
          var start = Date.now()
          this.cachedPapers = await this.db.papers.toArray()
          console.log("[literature] ensureCache indexdb " + (Date.now() - start))

          this.cachedPapersById = new Map()
          for(var ea of this.cachedPapers) {
            this.cachedPapersById.set(ea.microsoftid, ea)
          }
          console.log("[literature] ensureCache total " + (Date.now() - start))          
        } finally {
          resolve()
        }
      })
      await this.isLoadingCache
      this.isLoadingCache = false
    }
  }
  
  static async papers() {
    await this.ensureCache()    
    return this.cachedPapers 
  }

  static async papersById() {
    await this.ensureCache()    
    return this.cachedPapersById 
  }

  
  static invalidateCache() {
    console.log("[literature] invalidate Cache")
    debugger
    this.cachedPapers = null
    this.cachedPapersById  = null
    this.isLoadingCache = false
  }
  
  static async ensurePaperEntry(paper) {
    var raw = await this.db.papers.get(paper.microsoftid) 
    if (!raw) {
      raw = this.addPaper(paper)
    }
    return  raw
  }
  
  static async deleteEmptyAuthorPapers() {    
    var entries = await this.papers()
    this.invalidateCache()
    return entries
      .filter(ea => !ea.authors)
      .forEach(ea => Literature.db.papers.delete(ea.microsoftid))
  
  }
  
  static async addPaper(paper) {
    var raw = {
        microsoftid: paper.microsoftid,
        authors: paper.authorNames,
        year: paper.year,
        title: paper.title,
        key: paper.key,
        keywords: paper.keywords,
        booktitle: paper.booktitle,
        value: paper.value,
        abstract: paper.abstract    
    }
    await this.db.papers.put(raw)

    await this.updateCache(raw)
    
    return raw
  }

  static async updateCache(raw) {
    await this.ensureCache()
    
    // manual cache update, because invalidating is very expensive
    this.cachedPapers = this.cachedPapers.filter(ea => ea.microsoftid == raw.microsoftid)
    this.cachedPapers.push(raw)
    this.cachedPapersById.set(raw.microsoftid, raw)
  }
  
  static async patchPaper(id, obj) {
    var raw = await this.ensurePaperEntry({microsoftid: id})
    raw = Object.assign(raw, obj)
    await this.db.papers.put(raw) 
    await this.updateCache(raw)
  }
  
  static async getPaperEntry(id) {
    var map = await this.papersById()
    var entry = map.get(id)
    if (entry) return entry
    // maybe something ch
    // return this.db.papers.get({microsoftid: id})  
  }
  
  static async getPaperEntries(references) {
    var all = await this.papers()
    return all.filter(ea => references.includes(ea.microsoftid))
    
    // (reasonably fast)
    // return this.db.papers.bulkGet(references)
    
    // (SLOW)
    // return (await this.db.papers.toArray())
    //     .filter(ea => references.includes(ea.microsoftid))  
  }
  
  static get db() {
    var db = new Dexie("literature");

    db.version(1).stores({
        papers: 'microsoftid,authors,year,title,key,keywords,booktitle',      
    }).upgrade(function () {
    })
    
    
    return db
  }
}










// import Tracing from "src/client/tracing.js"
// Tracing.traceObject(Literature)
