import Dexie from "src/external/dexie3.js"

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
    this.invalidateCache()
    return raw
  }

  static async patchPaper(id, obj) {
    var raw = await this.ensurePaperEntry({microsoftid: id})
    raw = Object.assign(raw, obj)
    this.invalidateCache()
    return this.db.papers.put(raw) 
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
