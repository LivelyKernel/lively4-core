/*
 * Bootlog DB
 *
 */
import Dexie from "src/external/dexie3.js"

export default class Bootlog {

  static current() {
    if (!this._current) {
      this._current = new Bootlog("bootlog")
    }
    return this._current
  }
  
  clear() {
    this.db.files.clear()
  }

  constructor(name) {
    this.name = name
    this.db = this.bootlogDB()
  }

  bootlogDB() {
    var db = new Dexie(this.name);
    db.version("1")
      .stores({
        logs: '++id,url, date, mode',
      })
      .upgrade(function () {});
    return db;
  }
  
  async addLogs(logArray) {
    this.db.transaction("rw", this.db.logs, () => {
      for(var ea of logArray) {
        this.db.logs.put(ea)
      }
    })
  }

}
