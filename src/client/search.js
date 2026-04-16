/*MD # Repository-wide Search

```
Examples:
   Search.search("lively-ball")
   Search.searchAndRename("lively-ball","lively-baaaaall")
``` 
MD*/

import _ from 'src/external/lodash/lodash.js' 
import FileIndex from "src/client/fileindex.js"

export default class Search {
  
  static getRoot() {
    return lively4url.replace(/[^\/]*$/,"")
  }
  
  /**
   * Search for files by filename pattern
   * 
   * @param {string} pattern - Search pattern (glob or regex)
   * @param {Object} options - Search options
   * @param {Array<string>} options.paths - Root directories to search (default: [lively4url])
   * @param {boolean} options.recursive - Search subdirectories (default: true)
   * @param {string} options.type - Filter by 'file', 'directory', or 'both' (default: 'file')
   * @param {number} options.limit - Maximum number of results (default: 50)
   * @returns {Promise<Array<Object>>} - Array of file objects with url, name, etc.
   */
  static async files(pattern, options = {}) {
    const {
      paths,
      recursive = true,
      type = 'file',
      limit = 50
    } = options;
    
    // Get all files from FileIndex
    const allFiles = [];
    await FileIndex.current().db.files.each(file => allFiles.push(file));
    
    // Get search roots - only add ExtraSearchRoots if no paths were explicitly provided
    const searchRoots = this.getSearchRoots(paths);
    
    // Create regex from pattern
    const searchRegex = new RegExp(pattern, 'i');
    
    // Filter files
    const filteredFiles = allFiles.filter(file => {
      // Check if file is in one of the search roots
      const inSearchRoot = searchRoots.find(root => file.url.startsWith(root));
      if (!inSearchRoot) return false;
      
      // Extract filename (last part of path)
      const filename = file.url.replace(/.*\//ig, '');
      
      // Match pattern against filename
      return filename.match(searchRegex);
    });
    
    // Apply limit
    return filteredFiles.slice(0, limit);
  }
  
  /**
   * Get search roots including ExtraSearchRoots preference
   * @private
   */
  static getSearchRoots(paths) {
    // If paths explicitly provided, use only those
    if (paths !== undefined) {
      return Array.isArray(paths) ? paths : [paths];
    }
    
    // Otherwise, use default (lively4url) plus ExtraSearchRoots
    const roots = [lively4url + "/"];
    
    // Add ExtraSearchRoots from preferences if available
    if (lively.preferences) {
      const extraRoots = lively.preferences.get("ExtraSearchRoots");
      if (extraRoots && Array.isArray(extraRoots)) {
        roots.push(...extraRoots);
      }
    }
    
    return roots;
  }
  

  
  /**
   * Search for class definitions by name pattern
   * 
   * @param {string} pattern - Search pattern (regex supported)
   * @param {Object} options - Search options
   * @param {Array<string>} options.paths - Root directories to search (default: [lively4url])
   * @param {number} options.limit - Maximum number of results (default: 50)
   * @returns {Promise<Array<Object>>} - Array of class objects with name, url, line, etc.
   */
  static async classes(pattern, options = {}) {
    const {
      paths,
      limit = 50
    } = options;
    
    // Get search roots
    const searchRoots = this.getSearchRoots(paths);
    
    // Create regex from pattern
    const searchRegex = new RegExp(pattern, 'i');
    
    // Query FileIndex for classes
    const allClasses = [];
    await FileIndex.current().db.classes.each(classInfo => {
      // Check if class is in search roots
      const inSearchRoot = searchRoots.find(root => classInfo.url.startsWith(root));
      if (!inSearchRoot) return;
      
      // Match pattern against class name
      if (!classInfo.name.match(searchRegex)) return;
      
      // Add to results
      allClasses.push({
        name: classInfo.name,
        superClass: classInfo.superClassName || null,
        url: classInfo.url,
        line: classInfo.start ? this.getLineNumber(classInfo.start) : null,
        isExported: classInfo.exported || false
      });
      
      // Stop if we have enough results
      if (allClasses.length >= limit) return false; // Break iteration
    });
    
    return allClasses;
  }
  
  /**
   * Convert byte position to approximate line number
   * @private
   */
  static getLineNumber(position) {
    // FileIndex stores byte positions, not line numbers
    // This is an approximation - actual line would require parsing
    return Math.floor(position / 40) + 1; // ~40 chars per line average
  }
  
  /**
   * Search for method definitions by name pattern
   * 
   * @param {string} pattern - Search pattern (regex supported)
   * @param {Object} options - Search options
   * @param {Array<string>} options.paths - Root directories to search (default: [lively4url])
   * @param {string} options.className - Filter by class name (optional)
   * @param {number} options.limit - Maximum number of results (default: 50)
   * @returns {Promise<Array<Object>>} - Array of method objects with name, className, url, line, etc.
   */
  static async methods(pattern, options = {}) {
    const {
      paths,
      className,
      limit = 50
    } = options;
    
    // Get search roots
    const searchRoots = this.getSearchRoots(paths);
    
    // Create regex from pattern
    const searchRegex = new RegExp(pattern, 'i');
    
    // Query FileIndex for classes and their methods
    const allMethods = [];
    await FileIndex.current().db.classes.each(classInfo => {
      // Check if class is in search roots
      const inSearchRoot = searchRoots.find(root => classInfo.url.startsWith(root));
      if (!inSearchRoot) return;
      
      // Filter by className if specified
      if (className && classInfo.name !== className) return;
      
      // Check if class has methods
      if (!classInfo.methods || classInfo.methods.length === 0) return;
      
      // Search through methods
      for (const method of classInfo.methods) {
        // Match pattern against method name
        if (!method.name.match(searchRegex)) continue;
        
        allMethods.push({
          name: method.name,
          className: classInfo.name,
          url: classInfo.url,
          line: method.start ? this.getLineNumber(method.start) : null,
          static: method.static || false,
          kind: method.kind || 'method'
        });
        
        // Stop if we have enough results
        if (allMethods.length >= limit) return false; // Break iteration
      }
    });
    
    return allMethods;
  }
  
  static async search(pattern, rootdirs = "lively4-jens", ) {
    if (!pattern) throw new Error("Argument missing: not pattern")
    var root = this.getRoot()
    var result = await fetch(root + "_search/files", {
      headers:  { 
           "searchpattern": pattern,
           "rootdirs": rootdirs,
           "excludes": "node_modules,src/external,vendor/",
        }
    }).then(r => r.text())
    return result.split("\n").filter(ea => ea).map( ea => ea.split(":"))
  }
 
  static async searchAndRename(pattern, replace, dry) {
    if (!pattern) throw new Error("Argument missing: not pattern")
    if (!replace) throw new Error("Argument missing: not replace")
    var root = this.getRoot()

    var files = _.uniq((await Search.search(pattern)).map(ea => ea[0]))
    
    for (let file of files) {
      var url = root + file
      var contents = await fetch(url).then(ea => ea.text())
      var newcontents = contents.replace(new RegExp(pattern, "g"), replace)
      if (dry) {
        lively.notify("would modify " + file)
        continue
      }
      
      var putRequest = await fetch(url, {
        method: "PUT",
        body: newcontents
      })
      if (putRequest.status == 200) {
        lively.notify("Replaced pattern in " + file)
      } else {
        lively.notify("PROBLEM replacing pattern in " + file, putRequest.status)
      }  
    }
    return files
  }
}