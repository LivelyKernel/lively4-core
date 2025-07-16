/*MD # Literature


## #TODO maybe also use OpenAlex as Microsoft Academics replacement
 
```javascript {.snippet}
  fetch("https://api.openalex.org/works/mag:2036425115").then(r => r.json())
```


MD*/

import Dexie from "src/external/dexie3.js"
import BibtexParser from 'src/external/bibtexParse.js';
import MarkdownIt from "src/external/markdown-it.js";
import Bibliography from "src/client/bibliography.js"
import FileIndex from "src/client/fileindex.js";
import {pt} from "src/client/graphics.js"
import toTitleCase from "src/external/title-case.js"
import moment from "src/external/moment.js"
 
import Preferences from 'src/client/preferences.js'

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
   return this.value.name // "Original author name"
  }
  
  get id() {
    return this.value.authorId 
  }
  
  livelyInspect(contentNode, inspector, normal) {
    specialInspect(this, contentNode, inspector, normal)
  }
}

export class LiteratureReference {
  constructor(id, type = 'alexid') {
    if (typeof id === 'string') {
      this.id = id
      this.type = type
    } else if (id && typeof id === 'object') {
      // Allow passing an object with id and type properties
      this.id = id.id || id.alexid || id.doi || id.key
      this.type = id.type || type
    } else {
      throw new Error('LiteratureReference requires a valid identifier')
    }
  }

  get alexid() {
    if (this.type === 'alexid') {
      return this.id
    }
    // TODO: Add conversion logic for other ID types
    return null
  }

  get key() {
    return this.type + "_" + this.id
  }
  
  get citationKey() {
    if (this.type == "bibtex")
        return this.id
    return null
  }

  toString() {
    return this.id
  }

  static fromAlexId(alexid) {
    return new LiteratureReference(alexid, 'alexid')
  }

  static fromDOI(doi) {
    return new LiteratureReference(doi, 'doi')
  }

  static fromBibtexKey(key) {
    return new LiteratureReference(key, 'bibtex')
  }

  equals(other) {
    if (!(other instanceof LiteratureReference)) {
      return false
    }
    return this.id === other.id && this.type === other.type
  }
}

export class Scholar {
  
  static fields() {
   return "externalIds,url,title,abstract,venue,publicationVenue,year,referenceCount,citationCount,influentialCitationCount,isOpenAccess,fieldsOfStudy,s2FieldsOfStudy,authors,journal,tldr,openAccessPdf,references,references.authors,references.year,references.externalIds,references.title,references.citationCount,references.referenceCount,citations,citations.authors,citations.year,citations.externalIds,citations.title,citations.citationCount,citations.referenceCount"
  }
}


export class Paper {
  
  static create(raw) {
    if (Preferences.get("UseOpenAlex")) {
      return new AlexPaper(raw) // #TODO, we don't actually use the entry, but only the raw data in value?
    } else {  
      return new Paper(raw)
    }
  }
  
  
  static async ensure(raw) {
    var existing = await Literature.getPaperEntry(raw.scholarid)
    if (!existing) {
      var p = Paper.create(raw)
      
      if(!p.paperId) {
        throw new Error("paperId is missing")
      }
      Paper.setById(p.paperId, p)      
    } else {
      p = Paper.create(existing.value)
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
  
  static async getScholarPaper(paperQuery) {
    var json = await this.fetchPaper(paperQuery)
    if (json  && json.paperId) {
      return this.getId(json.paperId, json)
    }
  }
  
  static async fetchPaper(idOrQuery) {
    let resp
    if (Literature.useOpenAlex()) {
      resp = await fetch("alex://data/" + idOrQuery, {
          method: "GET", 
          headers: {
            "content-type": "application/json"}})
    } else {
      // download it individually
      resp = await fetch("scholar://data/paper/" + idOrQuery + "?fields="+ Scholar.fields(), {
          method: "GET", 
          headers: {
            "content-type": "application/json"}})
    }
    if (resp.status != 200) {
      return // should we note it down that we did not found it?
    }
    return resp.json()
    
  }
  
    
  static async getPaperEntry(id) {
    var map = await this.papersById()
    var entry = map.get(id)
    if (entry) return entry
    // maybe something ch
    // return this.db.papers.get({scholarid: id})  
  }
  
  static async getId(id, optionalEntity) {
    if (Preferences.get("UseOpenAlex")) {
      var response = await fetch("alex://data/" + id)
      let content = await response.text()
      let json
      try {
        json = JSON.parse(content)
      } catch(e) {
        throw new Error("OpenAlex Error " +  content)
      }
      
      
      return new AlexPaper(json)
    }
    
    var paper = this.byId(id)
    if (paper) return paper
    if (optionalEntity) {
      paper = await Paper.ensure(optionalEntity)    
    } else {
      var entry = await Literature.getPaperEntry(id)
      if (entry) {
        paper = Paper.create(entry.value)
      } else {
        var json = await this.fetchPaper(id)
        if (json.error) {
          lively.warn("[literature] getId failed", json.error)
          return
        }
        paper = await Paper.ensure(json)    
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
      this.importBibtexPaper(paper)
    } else {
      lively.notify(`ERROR no paper with id '${this.scholarid}' found`)
    }
  }
  
  static async importBibtexPaper(paper) {
    var source = paper.toBibtex()
    await this.importBibtexSource(source)
  }
    
  static async importBibtexSource(source) {
    var importURL = (await this.allBibtexEntries())
          .map(ea => ea.url)
          .find(ea => ea && ea.match(/_incoming\.bib$/))
    if (!importURL) {
      lively.notify("no _incoming.bib found")
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
    return (this.value.authors || []).map(ea => new Author(ea)) 
  }

  get authorNames() {
    return (this.value.authors || [])
  }
  
  get paperId() {
    return this.value.paperId
  }
  
  get year() {
    return this.value.year 
  }

  get title() {
    return (this.value.title || "")// "Original paper title"
      .replace(/["{}]/g,"")  // some cleanup
  }

  get doi() {
    return this.value.externalIds && this.value.externalIds.DOI 
  }
  
  get scholarid() {
    return this.value.paperId 
  }
  
  get bibtexType() {
    return ({
      'a': "article", 
      'b': "book", 
      'c': "incollection", 
      'p': "inproceedings"})[this.value.BT] || "misc"
  }
  
  get booktitle() {
    return this.value.venue
  }
  
  get key() {
    return this.toBibtexEntry().citationKey 
  }
  
  get keywords() {
    return (this.value.fieldsOfStudy || [])
  }
  
  hasPublicationInfo() {
    return false // TODO
  }
  
  
  async findBibtexFileEntries() {
    var key = this.key
    var entries = await Paper.allBibtexEntries()
    return entries.filter(ea => (ea.key == key) || ea.doi && (ea.doi == this.doi)).filter(ea => !ea.url.match(/_marker/))
  }
  
  
  // #important
  toBibtexEntry() {
    var entry = {
      entryTags: {
        author: this.authors.map(author => author.name).join(" and "), 
        title: this.title,
        year: this.year
      },
      entryType: this.bibtexType
    }
    
    if (this.scholarid) entry.entryTags.scholarid =  this.scholarid
    if (this.alexid) entry.entryTags.alexid =  this.alexid
    if (this.booktitle) { entry.entryTags.booktitle = this.booktitle }
    if (this.doi) { entry.entryTags.doi = this.doi }

    if (this.references) {
        entry.entryTags.microsoftreferences = this.references.map(ea => ea.scholarid).join(",")
    }
    if (this.referencedBy) {
        entry.entryTags.microsoftreferencedby = this.referencedBy.map(ea => ea.scholarid).join(",")
    }
    entry.citationKey = Bibliography.generateCitationKey(entry)
    return entry
  }

  get abstract() {
    return this.value.abstract
  }
  
  async scholarQueryToPapers(references) {
    if (!references) return []
    try {
      var response = await fetch(`scholar://data/paper/batch?fields=${Scholar.fields()}`, {
        method: "POST",
        body: JSON.stringify({"ids": references})
      }).then(r => r.json())  
    } catch(e) {
      console.warn("[scholar] Error scholarQueryToPapers " + references + "... BUT WE CONTINUE ANYWAY")
      return null
    }
    var result = []
    for(var entity of response) {
      result.push(await Paper.getId(entity.paperId))
    }
    return result
  }

  async resolvePaperIdsToPapers(references) {
    var papers = []
    var rest = []
    
    references = references.filter(ea => ea)
    
    // bulk queries are faster
    var entries = await Literature.getPaperEntries(references)
    for(var scholarid of references) {
      // look each up if in db
      var entry = entries.find(ea => ea && (ea.scholarid == scholarid))
      if (entry && entry.value) {
        papers.push(new Paper(entry.value))
      } else {
        rest.push(scholarid)
      }
    } 
    // bulk load the rest
    if (rest.length > 0) {
      let list = await this.scholarQueryToPapers(rest)
      if (list) papers = papers.concat(list)
    }
    return papers
  }
  
  async resolveReferences() {
    
    this.references = []
    
    if (!this.value.references) return
    this.references = await this.resolvePaperIdsToPapers(this.value.references.map(ea => ea.paperId))
    return this.references
  }
  
  async findReferencedBy() {
    
    throw new Error("#TODO")
    
    if (this.referencedBy || !this.scholarid) return;
    
    var entry = await Literature.getPaperEntry(this.scholarid)
    if (entry && entry.referencedBy) {
      this.referencedBy = await this.resolvePaperIdsToPapers(entry.referencedBy)
    } else {
      console.log("FETCH referencedBy " + this.scholarid)
      
      this.referencedBy = await this.scholarQueryToPapers("RId=" + this.scholarid)  
      if (this.referencedBy) {
        await Literature.patchPaper(this.scholarid, {
          referencedBy: this.referencedBy.map(ea => ea.scholarid)})           
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
     return `<literature-paper mode="short" scholarid="${this.scholarid}"></literature-paper>`
  }

  async toHTML() {
    return `<literature-paper scholarid="${this.scholarid}"></literature-paper>`
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


export class AlexAuthor {
 
  constructor(value) {
    this.value = value
  }

  get name() {
   return this.value.author.display_name // "Original author name"
  }
  
  get id() {
    return this.value.author.id 
  }
  
  livelyInspect(contentNode, inspector, normal) {
    specialInspect(this, contentNode, inspector, normal)
  }
}

export class AlexPaper extends Paper {

  
  get alexid() {
    return this.value && this.value.id && this.value.id.replace("https://openalex.org/","")
  }
  
  get paperId() {
    return this.alexid
  }
  
  get authors() {
    return (this.value.authorships || []).map(ea => new AlexAuthor(ea)) 
  }


  get year() {
    return this.value.publication_year 
  }

  get doi() {
    return this.value.doi && this.value.doi.replace("https://doi.org/","")
  }

  get bibtexType() {
    // https://docs.openalex.org/api-entities/works/work-object#type
    var type = this.value.type
    switch(type) {
      case "article": return "article"; // TODO distinguish conference article from journal?
      case "book-chapter": return "article";
      case "dataset": return "misc"
      case "preprint": return "misc"
      case "dissertation": return "phdthesis";
      case "book": return "book";
      case "review": return "misc"
      case "paratext":return "misc"
      case "libguides":return "misc"
      case "letter":return "misc"
      case "other":return "misc"
      case "reference-entry":return "misc"
      case "report":return "misc"
      case "editorial":return "misc"
      case "peer-review":return "misc"
      case "erratum":return "misc"
      case "standard":return "misc"
      case "grant":return "misc"
      case "supplementary-materials":return "misc"
    }
    return "misc"
  }
  
  get abstract() {
    var index = this.value.abstract_inverted_index 
    if (!index) return
    var result = []
    for(var word of Object.keys(index)) {
      for (var pos of index[word]) {
        result[pos] = word
      }
    }
    return result.join(" ")
  }
  
  get booktitle() {
    var title = this.value?.primary_location?.source?.display_name
    return title || ""
  }
  
  get keywords() {
    return [] // #TODO
  }
  
  
  get referenced_works_ids() {
    if (this.value && this.value.referenced_works) {
      return this.value.referenced_works
         .map(ea => {
          var m = ea.match(/https:\/\/openalex.org\/(.*)/)
          return m && m[1]
        })
        .filter(ea => ea)
    }
    return []
  }
  
  get cited_by_works_ids() {
    if (this.value && this.value.cited_by_works) {
      return this.value.cited_by_works
        .map(ea => {
          var m = ea.match(/https:\/\/openalex.org\/(.*)/)
          return m && m[1]
        })
        .filter(ea => ea)
    }
    return []
  }
  
  async toShortHTML() {
     return `<literature-paper mode="short" alexid="${this.alexid}"></literature-paper>`
  }
  
  async toDataHTML() {
    return `<literature-paper alexid="${this.alexid}">${JSON.stringify(this.value)}</literature-paper>`
  }
  
    async toShortDataHTML() {
    return `<literature-paper mode="short" alexid="${this.alexid}">${JSON.stringify(this.value)}</literature-paper>`
  }
  
  async store() {
     var serialized = JSON.stringify(this.value)     
     await fetch("alex://data/" + this.alexid, {method: "PUT", body: serialized})
  }

  async ensureCrossRefs(force) {
    // we load the citations and references for the papers, so we know where to connect it...

    // materialize citations
    if (force || (this.value && !this.value.cited_by_works && this.value.cited_by_api_url)) {
      var url = this.value.cited_by_api_url.replace("https://api.openalex.org/", "alex://data/") + "&select=id"
      var results = await Literature.fetchAllPages(url)
      this.value.cited_by_works = results.map(ea => ea.id)
      await this.store()
      console.log("updated AlexPaper " + this.alexid)
    }
    
  }
}

export class MiscPaper extends Paper {
 
  constructor(value) {
    super(value)
    this.entries = []
  }
  
  isLoaded() {
     return this._loadPromise
  }
  
  load() {
    if (this._loadPromise) return this._loadPromise
    this._loadPromise = new Promise(async resolve => {
      if (this.value.type == "bibtex") {
        this.entries = await FileIndex.current().db.bibliography.where("key").equals(this.value.id).toArray()
  
        
        this.entry = Bibliography.bestEntry(this.entries)
        // lively.notify("load " + this.value.id + " " + this.year, "found " + this.entries +" entries <br>" + JSON.stringify(this.entry))
        
        
        for(let entry of this.entries) { 
          if (entry.alexid) {
             this.alexid = entry.alexid
          }
        }

        this.files = await FileIndex.current().db.files.where("bibkey").equals(this.value.id).toArray()

        var referencesBib = this.files.filter(ea => ea.url.endsWith(".bib"))[0]
        
        if (referencesBib) {
          this.referencesEntries = await FileIndex.current().db.bibliography
            .where("url").equals(referencesBib.url).toArray()
          
          this.value.referenced_works_count = this.referencesEntries.length
          
//             var references = {}

//             for(let ea of entries) {
//               var bibkey  = Bibliography.urlToKey(ea.url)
//               if (bibkey) {
//                 var list = references[bibkey] || []  
//                 list.push(ea.key)
//                 references[bibkey] = list      
//               }
//             }
        }

      }
      resolve(true)
    })
    return this._loadPromise
  }
    
  ensureCrossRefs() {
    
  }
   
  
  get key() {
     return this.value.citationKey
  }
  
  get title() {
    return this.entry && this.entry.title
  }

  get year() {
    return this.entry && this.entry.year
  }
  
  get authors() {
    if (!this.entry|| !this.entry.authors) return []
    return this.entry.authors.map(ea => {return {name: ea}})
  }

  
  // alex paper API
  get referenced_works_ids() {
    return  []
  }
  
  get cited_by_works_ids() {
     return  []
  }
  
  // misc paper API
  get referenced_works_refs() {
    if (!this.referencesEntries) return [];
    return this.referencesEntries.map(ea => LiteratureReference.fromBibtexKey(ea.key))
  }

  
}


export default class Literature {
  
  static useOpenAlex() {
    return Preferences.get("UseOpenAlex")
  }
  
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
            this.cachedPapersById.set(ea.paperid, ea)
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
    this.cachedPapers = null
    this.cachedPapersById  = null
    this.isLoadingCache = false
  }
  
  static async ensurePaperEntry(paper) {
    var raw = await this.db.papers.get(paper.scholarid) 
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
      .forEach(ea => Literature.db.papers.delete(ea.scholarid))
  
  }
  
  static async addPaper(paper) {
    var raw = {
        scholarid: paper.scholarid,
        alexid: paper.alexid,
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
    this.cachedPapers = this.cachedPapers.filter(ea => ea.scholarid == raw.scholarid)
    this.cachedPapers.push(raw)
    this.cachedPapersById.set(raw.scholarid, raw)
  }
  
  static async patchPaper(id, obj) {
    var raw = await this.ensurePaperEntry({scholarid: id})
    raw = Object.assign(raw, obj)
    await this.db.papers.put(raw) 
    await this.updateCache(raw)
  }
  
    
  static async removePaper(scholarid) {
    if (!scholarid) return
    Literature.cachedPapersById.delete(scholarid)
    var collection = this.db.papers.where("scholarid").equals(scholarid)
    var removed =  await collection.toArray()
    collection.delete()
    for(let ea of removed) {
      lively.warn("[literature] removed paper " + ea.scholarid + " " + ea.title)
    }
  }
  
  
  static async getPaperEntry(id) {
    var map = await this.papersById()
    var entry = map.get(id)
    if (entry) return entry
    // maybe something ch
    // return this.db.papers.get({scholarid: id})  
  }
  
  static async getPaperEntries(references) {
    var all = await this.papers()
    return all.filter(ea => references.includes(ea.scholarid))
    
    // (reasonably fast)
    // return this.db.papers.bulkGet(references)
    
    // (SLOW)
    // return (await this.db.papers.toArray())
    //     .filter(ea => references.includes(ea.scholarid))  
  }

  static get db() {
    if (Preferences.get("UseOpenAlex")) {
        return this.alexdb
    } 
    return this.scholardb
  }
  
  static get scholardb() {
    var db = new Dexie("scholar");

    db.version(1).stores({
        papers: 'scholarid,authors,year,title,key,keywords,booktitle',      
    }).upgrade(function () {
    })
    
    
    return db
  }
  
  static get alexdb() {
    var db = new Dexie("openalex");

    db.version(1).stores({
        papers: 'alexid,doi,authors,year,title,key,keywords,booktitle',      // deprecated....
    }).upgrade(function () {
    })
    db.version(2).stores({
        works: 'id,doi,publication_year,title,ids.mag',      
    }).upgrade(function () {
    })
    db.version(3).stores({
        works: 'id,doi,publication_year,title,ids.mag,*references,*citations',      
    }).upgrade(function () {
    })
    db.version(4).stores({
        works: 'id,doi,publication_year,title,ids.mag,*referenced_works,*cited_by_works',      
    }).upgrade(function () {
    })
    
    
    return db
  }
  
  
  
  static extractDOI(input) {
    if (!input || !input.trim) return null;
    // Trim and normalize input
    const trimmed = input.trim();

    // Regex to match a DOI pattern
    const doiRegex = /^10\.\d{4,9}\/\S+$/;

    // If it's already a DOI
    if (doiRegex.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);
      const doi = url.pathname.slice(1); // remove leading '/'
      return doiRegex.test(doi) ? doi : null;
    } catch (e) {
      // Not a valid URL, fallback to searching for DOI inside input
      const match = trimmed.match(/10\.\d{4,9}\/\S+/);
      return match ? match[0] : null;
    }
  }

  static async fetchAllPages(baseUrl, perPage = 100) {
    let allResults = [];
    let page = 1;

    while (true) {
      const url = `${baseUrl}&per-page=${perPage}&page=${page}`;

      const response = await fetch(url);
      if (response.status != 200) {
        lively.warn("Error loading " +url, await response.text())  
        break;
      }
      
      const json = await response.json();

      if (!json.results || json.results.length === 0) break;

      allResults = allResults.concat(json.results);

      // Break if there's no clear pagination mechanism or we've loaded all results
      if (!json.meta || !json.meta.next_cursor) break;

      page += 1;
    }

    return allResults;
  }
  
  static async fetchAlexPapersPreviews(ids) {
    if (ids.length > 0) {
      const baseUrl = 'cached://alex://data/works?filter=ids.openalex:' + ids.join('|') +
                      '&select=id,title,publication_year,referenced_works_count,cited_by_count,authorships';

      const allResults = await this.fetchAllPages(baseUrl);
      let papers = allResults.map(ea => new AlexPaper(ea));
      papers.forEach(ea => ea.isPreview = true);
      return papers
    } else {
      return []
    } 
  }
}










// import Tracing from "src/client/tracing.js"
// Tracing.traceObject(Literature)
