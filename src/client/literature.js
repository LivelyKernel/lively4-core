import Dexie from "src/external/dexie.js"

export default class Literature {
  
  static async ensurePaperEntry(paper) {
    var raw = await this.db.papers.get(paper.microsoftid) 
    if (!raw) {
      raw = this.addPaper(paper)
    }
    return  raw
  }
  
  static async deleteEmptyAuthorPapers() {    
    var entries = await Literature.db.papers.toArray()
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
    return raw
  }

  static async patchPaper(id, obj) {
    var raw = await this.ensurePaperEntry({microsoftid: id})
    raw = Object.assign(raw, obj)
    return this.db.papers.put(raw) 
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