/*
 * File Cache for Static Analys and Searching
 *
 * #TODO How do we get this a) into a web worker and b) trigger this for changed files
 *
 */
import Dexie from "src/external/dexie.js"
import Strings from "src/client/strings.js"
import {babel} from 'systemjs-babel-build';
import * as cop from "src/client/ContextJS/src/contextjs.js";

export default class FileCache {

  static current() {
    // FileCache._current = null
    if (!this._current) {
      this._current = new FileCache("file_cache")
    }
    return this._current
  }

  toString() {
    return "["+this.name+":FileCache]"
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
        files: 'url,name,type,content,version,options,title,tags,classes,functions'
    })
    db.version("2").stores({
        files: 'url,name,type,content,version,options,title,tags,classes,functions',
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
      console.log('FileCache, could not parse: ' + filename)
      return undefined
    }
  }


  async addDirectory(baseURL, depth) {
    console.log("addDirectory " + baseURL + " "  + depth)
    var contents = (await fetch(baseURL, {method: "OPTIONS"}).then( resp => resp.json())).contents
    var progress = await lively.showProgress("add " + baseURL.replace(/.*\//,""))
    var total = contents.length
    var i=0
    try {
      for(let ea of contents) {
        progress.value = i++ / total;
        let eaURL = baseURL.replace(/\/$/,"")  + "/" + ea.name
        let name = eaURL.replace(/.*\//,"")
        let size = ea.size;
        if (name.match(/^\./)) {
          console.log("ignore hidden file " + eaURL)
          continue
        };

        if (ea.type == "directory" && (depth > 0)) {
          console.log("[file cache] decent recursively: " + eaURL )
          this.addDirectory(eaURL, depth - 1)
        }


        if (await this.db.files.where("url").equals(eaURL).first()) {
          console.log("already in cache: " + eaURL)
        } else {
          if (!name.match(/\.((css)|(js)|(md)|(txt)|(x?html))$/)) {
            console.log("ignore " + eaURL)
            continue
          };

          if (size > 100000) {
            console.log("ignore " + eaURL + ", due to oversize " + Math.round (size/1000) + "kb")
            continue
          }

          console.log("load " + eaURL)
          // await new Promise(resolve => setTimeout(resolve, 100))

          // let options = await fetch(eaURL,
          //  {method: "OPTIONS", headers: {showversions: true}}).then(resp => resp.json())
          //  versions: options.versions
          let response = await fetch(eaURL)
          let version = response.headers.get("fileversion")
          let contents = await response.text()


          let type = eaURL.replace(/.*\./,"")
          if(ea.type == "directory") {
            type = "directory"
          }
          var file = {
            url: eaURL,
            name: name,
            size: size,
            type: type,
            content: contents,
            version: version}
          this.extractTitleAndTags(file)
          if (file.type == "js") {
            this.extractFunctionsAndClasses(file)
          }
          this.db.transaction("rw", this.db.files, () => {
            this.db.files.put(file)
          })
        }
      }
    } finally {
      progress.remove()
    }
  }


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

cop.layer(window, "ShowDexieProgress").refineClass(FileCache.current().db.Collection, {
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

