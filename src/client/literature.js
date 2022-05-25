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

export class Scholar {
  
  static fields() {
   return "externalIds,url,title,abstract,venue,year,referenceCount,citationCount,influentialCitationCount,isOpenAccess,fieldsOfStudy,s2FieldsOfStudy,authors"
  }
}


export class Paper {
  
  static async ensure(raw) {
    var existing = await Literature.getPaperEntry(raw.scholarid)
    if (!existing) {
      var p = new Paper(raw)
      if(!raw.paperId) {
        throw new Error("paperId is missing (scholarid)")
      }

      Paper.setById(raw.paperId, p)      
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
        var resp = await fetch("scholar://data/paper/" + id + "?fields="+ Scholar.fields(), {
            method: "GET", 
            headers: {
              "content-type": "application/json"}})
        if (resp.status != 200) {
          return // should we note it down that we did not found it?
        }
        var json = await resp.json()
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
      var source = paper.toBibtex()
      
      await this.importBibtexSource(source)
    } else {
      lively.notify(`ERROR no paper with id '${this.scholarid}' found`)
    }
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

  
  get year() {
    return this.value.year 
  }

  get title() {
    return (this.value.title || "")// "Original paper title"
      .replace(/["{}]/g,"")  // some cleanup
  }

  get doi() {
    return this.value.externalIds.DOI 
  }
  
  get scholarid() {
    return this.value.paperId 
  }
  
  get bibtexType() {
    return ({
      'a': "article", 
      'b': "book", 
      'c': "incollection", 
      'p': "inproceedings"})[this.value.BT]  
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
        
    return entries.filter(ea => ea.key == key)    
  }
   
  toBibtexEntry() {
    var entry = {
      entryTags: {
        author: this.authors.map(author => author.name).join(" and "), 
        title: this.title,
        year: this.year,
        scholarid: this.scholarid,
      },
      entryType: this.bibtexType
    }
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

  
  allReferencesRequery(references) {
    if (!references || references.length == 0) return 
    return `Or(${ references.map(ea => 'Id=' + ea).join(",")})`
  } 
  
  
  async scholarQueryToPapers(query) {
    if (!query) return []
    try {
      var response = await lively.files.loadJSON("scholar://data/paper/search?query=" + query) // + "&count=" + 1000
    } catch(e) {
      console.warn("[scholar] Error scholarQueryToPapers " + query + "... BUT WE CONTINUE ANYWAY")
      return null
    }
    var result = []
    for(var entity of response.data) {
      result.push(await Paper.getId(entity.paperId))
    }
    return result
  }

//   async resolveMicrosoftIdsToPapers(references) {
//     var papers = []
//     var rest = []
    
//     // bulk queries are faster
//     var entries = await Literature.getPaperEntries(references)
//     for(var scholarid of references) {
//       // look each up if in db
//       var entry = entries.find(ea => ea && (ea.scholarid == scholarid))
//       if (entry && entry.value) {
//         papers.push(new Paper(entry.value))
//       } else {
//         rest.push(scholarid)
//       }
//     } 
//     // bulk load the rest
//     if (rest.length > 0) {
//       let list = await this.scholarQueryToPapers(this.allReferencesRequery(rest))
//       if (list) papers = papers.concat(list)
//     }
//     return papers
//   }
  
//   async resolveReferences() {
    
//     this.references = []
//     if (!this.value.RId) return // nothing to do here    
    
//     this.references = await this.resolveMicrosoftIdsToPapers(this.value.RId)
//     return this.references
//   }
  
//   async findReferencedBy() {
//     if (this.referencedBy || !this.scholarid) return;
    
//     var entry = await Literature.getPaperEntry(this.scholarid)
//     if (entry && entry.referencedBy) {
//       this.referencedBy = await this.resolveMicrosoftIdsToPapers(entry.referencedBy)
//     } else {
//       console.log("FETCH referencedBy " + this.scholarid)
      
//       this.referencedBy = await this.scholarQueryToPapers("RId=" + this.scholarid)  
//       if (this.referencedBy) {
//         await Literature.patchPaper(this.scholarid, {
//           referencedBy: this.referencedBy.map(ea => ea.scholarid)})           
//       }
//     }
//     return this.referencedBy
//   }
  
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
            this.cachedPapersById.set(ea.scholarid, ea)
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
    var db = new Dexie("scholar");

    db.version(1).stores({
        papers: 'scholarid,authors,year,title,key,keywords,booktitle',      
    }).upgrade(function () {
    })
    
    
    return db
  }
}










// import Tracing from "src/client/tracing.js"
// Tracing.traceObject(Literature)
