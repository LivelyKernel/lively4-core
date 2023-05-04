/*MD # Search Root Management MD*/

import _ from 'src/external/lodash/lodash.js' 
import FileIndex from "src/client/fileindex.js"

export default class SearchRoots {
  
  static getSearchRoots() {
    return lively.preferences.get("ExtraSearchRoots")
  }

  static setSearchRoots(roots) {
    return lively.preferences.set("ExtraSearchRoots", roots)
  }
  
  /*
   * add url to local file index rember to search there  
   */
  static addSearchRoot(url) {
    var roots = this.getSearchRoots()
    roots = _.uniq(roots.concat([url]))
    this.setSearchRoots(roots)
    return this.updateSearchRoot(url)     
  }

  static updateSearchRoot(url) {
    return FileIndex.current().addDirectory(url)     
  }

  static removeSearchRoot(url, cleanIndex=true) {
    var roots = this.getSearchRoots();
    roots = roots.filter(ea => ea != url)
    this.setSearchRoots(roots)
    if (cleanIndex) {
      FileIndex.current().removeDirectory(url)     
    }
  }

  static isSearchRoot(url) {
    return this.getSearchRoots().find(ea => ea == url)
  }
  
  static async updateAllSearchRoots() {
    
    for(var ea of this.getSearchRoots()) {
      await this.updateSearchRoot(ea)
    }
  }
}