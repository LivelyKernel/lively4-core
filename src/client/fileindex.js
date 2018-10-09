/*
 * File Index for Static Analys and Searching
 *
 * #TODO How do we get this a) into a web worker and b) trigger this for changed files
 *
 */
import Dexie from "src/external/dexie.js"
import Strings from "src/client/strings.js"
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import * as cop from "src/client/ContextJS/src/contextjs.js";

export default class FileIndex {

  static current() {
    // FileIndex._current = null
    if (!this._current) {
      this._current = new FileIndex("file_cache")
    }
    return this._current
  }

  toString() {
    return "["+this.name+":FileIndex]"
  }

  clear() {
    this.db.files.clear()
    // this.db.delete()
  }

  constructor(name) {
    this.name = name
    this.db = this.fileCacheDB()
  }

  fileCacheDB() {
    var db = new Dexie(this.name);

    db.version("1").stores({
        files: 'url,name,type,version,modified,options,title,tags,classes,functions',
        modules: '++id,url,name,dependencies',
        classes: '++id,url,name,methods',
        methods: '++id,url,name'
    }).upgrade(function () {
    })

    return db
  }

  async toArray() {
    return this.db.files.where("name").notEqual("").toArray()
  }

  async update() {
    await this.updateTitleAndTags()
    await this.updateFunctionAndClasses()
  }

  async updateFunctionAndClasses() {
    return this.showProgress("extract functions and classes", () => {
      return this.db.files.where("type").equals("js").modify((ea) => {
        this.extractFunctionsAndClasses(ea)
      })
    })
  }

  async updateTitleAndTags() {
    return this.showProgress("update title", () => {
      return this.db.files.where("name").notEqual("").modify((ea) => {
         this.extractTitleAndTags(ea)
      });
    })
  }

  showProgress(label, func) {
    ShowDexieProgress.currentLabel = label
    return cop.withLayers([ShowDexieProgress], () => {
        return func()
    })
  }

  extractTitleAndTags(file) {
    if (!file.content) return;
    file.title = file.content.split("\n")[0].replace(/## /,"")
    file.tags = Strings.matchAll('(?: )(#[A-Za-z0-9]+)(?=[ \n])(?! ?{)', file.content)
      .map(ea => ea[1])
  }

  extractFunctionsAndClasses(file) {
    // lively.notify("file " +file.url + " " + file.content.length)
    var ast = this.parseSource(file.url, file.content)
    var result = this.parseFunctionsAndClasses(ast)
    // lively.notify("result " + result.functions)
    file.classes = result.classes
    file.functions  = result.functions
    console.log("classes " + file.classes)
  }

  parseFunctionsAndClasses(ast) {
    var functions = []
    var classes = []
    babel.traverse(ast,{
      Function(path) {
        if (path.node.key) {
          functions.push(path.node.key.name)
        } else if (path.node.id) {
          functions.push(path.node.id.name)
        }
      },
      ClassDeclaration(path) {
        if (path.node.id) {
          classes.push(path.node.id.name)
        }
      }
    })
    return {functions, classes}
  }

  parseSource(filename, source) {
    try {
      return babel.transform(source, {
          babelrc: false,
          plugins: [],
          presets: [],
          filename: filename,
          sourceFileName: filename,
          moduleIds: false,
          sourceMaps: true,
          compact: false,
          comments: true,
          code: true,
          ast: true,
          resolveModuleSource: undefined
      }).ast
    } catch(e) {
      console.log('FileIndex, could not parse: ' + filename)
      return undefined
    }
  }

  async addFile(url, name, type, size, modified) {
    
    if (url.match("/node_modules") || url.match(/\/\./) ) {
      // console.log("FileIndex ignore  " + url)
      return
    }
    
    console.log("FileIndex update  " + url)
    
    
    var file = file = {
      url: url,
      name: name,
      size: size,
      modified: modified
    }
    
    if (name.match(/\.((css)|(js)|(md)|(txt)|(x?html))$/)) {
      if (size < 100000) {
        let response = await fetch(url)
        file.version = response.headers.get("fileversion")
        file.content = await response.text()    
      }
    };


    // await new Promise(resolve => setTimeout(resolve, 100))

    // let options = await fetch(url,
    //  {method: "OPTIONS", headers: {showversions: true}}).then(resp => resp.json())
    //  versions: options.versions
    

    let fileType = url.replace(/.*\./,"")
    if(type == "directory") {
      type = "directory"
    }
    file.type = type
    
    if (file.content) {
      this.extractTitleAndTags(file)
      if (type == "js") {
        this.extractFunctionsAndClasses(file)
      }      
    }
    this.db.transaction("rw", this.db.files, () => {
      this.db.files.put(file)
    })
  }

  async dropFile(url) {
    console.log("FileIndex drop " + url + " from index")
    this.db.transaction("rw", this.db.files, () => {
      this.db.files.delete(url)
    })
  }

  
  
  async updateDirectory(baseURL, showProgress, updateDeleted) {
    var json = await fetch(baseURL, {
      method: "OPTIONS",
      headers: {
        filelist  : true
      }
    }).then(r => {
      if (r.status == 200) {
        return r.json()
      } else {
        console.log("FileIndex fetch failed ", baseURL, r)
      }
    })
    if (!json) {
      console.log("FileIndex could not update " + baseURL)
      return
    }
    
    if (showProgress) {
      var progress = await lively.showProgress("add " + baseURL.replace(/\/$/,"").replace(/.*\//,""))
      var total = json.contents.length
      var i=0
    }

    var lastModified= new Map()
    var visited = new Set()
    var all = new Set()
    await this.db.files.each(file => {
      all.add(file.url)
      lastModified.set(file.url, file.modified) // #Workaround #PerformanceBug in #IndexDB 
    })
    
    try {
      for(let ea of json.contents) {
          if (showProgress) progress.value = i++ / total;

          let eaURL = baseURL.replace(/\/$/,"") + ea.name.replace(/^\./,"")
          let name = eaURL.replace(/.*\//,"")
          if (lastModified.get(eaURL) !== ea.modified) {
            await this.addFile(eaURL, name, ea.type, ea.size, ea.modified)
          }
          visited.add(eaURL)
      }
      all.forEach(eaURL => {
        if (eaURL.startsWith(baseURL) && !visited.has(eaURL)) {
          this.dropFile(eaURL)
        }
      })
      
      
    } finally {
      if (showProgress) progress.remove()
    }
    
    console.log("FileIndex updateDirectory finished")
  }

  async addDirectory(baseURL) {
    

    
    this.updateDirectory(baseURL, true) // much faster and better
  }
    
//   async addDirectory(baseURL, depth) {
//     console.log("addDirectory " + baseURL + " "  + depth)
//     var contents = (await fetch(baseURL, {method: "OPTIONS"}).then( resp => resp.json())).contents
//     var progress = await lively.showProgress("add " + baseURL.replace(/.*\//,""))
//     var total = contents.length
//     var i=0
//     try {
//       for(let ea of contents) {
//         progress.value = i++ / total;
//         let eaURL = baseURL.replace(/\/$/,"")  + "/" + ea.name
//         let name = eaURL.replace(/.*\//,"")
//         let size = ea.size;
//         if (name.match(/^\./)) {
//           console.log("ignore hidden file " + eaURL)
//           continue
//         };

//         if (ea.type == "directory" && (depth > 0)) {
//           console.log("[file cache] decent recursively: " + eaURL )
//           this.addDirectory(eaURL, depth - 1)
//         }
//         if (await this.db.files.where("url").equals(eaURL).first()) {
//           console.log("already in cache: " + eaURL)
//         } else {
//           this.addFile(eaURL, name, ea.type,  size, ea.modified /* may be be set */)
//         }
//       }
//     } finally {
//       progress.remove()
//     }
//   }


  showAsTable() {
    var result= []
    this.db.files.each(ea => {
      result.push(
        {url:ea.url,
        size: ea.content.length,
        title: ea.title.replace(/</g, "&lt;").slice(0,100),
        tags: ea.tags,
        classes: ea.classes,
        functions: ea.functions
        })
    }).then(() => {
      var sorted = _.sortBy(result, ea => Number(ea.size)).reverse()

      lively.openComponentInWindow("lively-table").then(table => {
        table.setFromJSO(sorted)
        table.style.overflow = "auto"
        table.column("size").forEach(cell => cell.classList.add("number"))
      })
      console.log("result: " + result.length)
    })
  }
}

cop.layer(window, "ShowDexieProgress").refineClass(FileIndex.current().db.Collection, {
  async modify(func) {
    var i = 0
    var total = await this.count()
    var progress = await lively.showProgress("update");
    if (ShowDexieProgress.currentLabel) {
      progress.textContent = ShowDexieProgress.currentLabel
    }
    var innerFunc = function(ea)  {
      progress.value = i++ / total
      func(ea)
    }
    // #TODO 'cop.proceed' does not work in the async setting...
    var result = await cop.withoutLayers([ShowDexieProgress], async () => {
      return this.modify(innerFunc)
    })
    progress.remove()
    return result
  }
})

