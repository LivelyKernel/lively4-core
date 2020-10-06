import Dexie from "src/external/dexie.js"

export default class Literature {
  
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
    
    // await this.db.transaction("rw", this.db.papers, () => { 
      this.db.papers.put(raw) 
    // })
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