/*
 * File Index for Static Analysis and Searching
 *
 * #TODO How do we get this a) into a web worker and b) trigger this for changed files 
 * 
 */
import Dexie from "src/external/dexie.js"
import Strings from "src/client/strings.js"
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import * as cop from "src/client/ContextJS/src/contextjs.js";
import Files from "src/client/files.js"


const FETCH_TIMEOUT = 5000

export default class FileIndex {

  static current() {
    // FileIndex._current = null
    if (!this._current) {
      this._current = new FileIndex("analysis_file_cache")
    }
    return this._current
  }

  toString() {
    return "["+this.name+":FileIndex]"
  }

  clear() {
    this.db.files.clear()   
    this.db.modules.clear()
    this.db.links.clear()
    this.db.classes.clear()
    this.db.versions.clear()
    // this.db.delete() 
  }

  constructor(name) {
    this.name = name
    this.db = this.fileCacheDB()
  }

  fileCacheDB() {
    var db = new Dexie(this.name);

    db.version("1").stores({
        files: 'url,name,type,version,modified,options,title,tags',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user'
    }).upgrade(function () {
    })
    return db 
  }

  async toArray() {
    return this.db.files.where("name").notEqual("").toArray()
  }

  async update() {
    await this.updateTitleAndTags()
    await this.updateAllModuleSemantics()
    await this.updateAllLinks()
    await this.updateAllLatestVersionHistories() 
  }
  
  async updateTitleAndTags() {
    return this.showProgress("update title", () => {
      return this.db.files.where("name").notEqual("").modify((ea) => {
         this.extractTitleAndTags(ea)
      });
    })
  }

  extractTitleAndTags(file) {
    if (!file.content) return;
    file.title = file.content.split("\n")[0].replace(/## /,"")
    file.tags = Strings.matchAll('(?: )(#[A-Za-z0-9]+)(?=[ \n])(?! ?{)', file.content)
      .map(ea => ea[1])
  }
  
  async updateAllModuleSemantics() {
    this.db.transaction('rw', this.db.files,  this.db.classes, this.db.modules, () => {
      this.db.files.where("type").equals("file").each((file) => {
        this.addModuleSemantics(file)
      })
    })
  }
  
  async addModuleSemantics(file) {
    if (file.name && file.name.match(/\.js$/)) { 
      var result = this.extractModuleSemantics(file)
      this.updateModule(file.url, result)
      this.updateClasses(file, result)
    }
  }
  
  extractModuleSemantics(file) {
    var ast = this.parseSource(file.url, file.content)
    if(!ast) {
      console.info('Could not parse file:', file.url)
      return []
    }
    var results = this.parseModuleSemantics(ast)
    return results;
  }
  
  async updateClasses(file, semantics) {
    if (!semantics || !semantics.classes) {
      return
    }
    
    for (var clazz of semantics.classes) {
      if (clazz.superClassName && !clazz.superClassUrl) {
        let superClass = semantics.classes.find(item => item.name == clazz.superClassName)
        clazz.superClassName = (superClass) ? superClass.superClassName : ''
        clazz.superClassUrl = (superClass) ? file.url : ''
      } else if (clazz.superClassName && clazz.superClassUrl) {
        clazz.superClassUrl = await System.resolve(clazz.superClassUrl, file.url)
      }
      clazz.url = file.url
      clazz.nom = clazz.methods ? clazz.methods.length : 0
      await this.addClass(clazz)
    }
  } 
  
  async addClass(clazz) {
    await this.db.classes.where({name: clazz.name, url: clazz.url}).delete()
    this.db.classes.put(clazz)
  }

  async updateModule(fileUrl, semantics) {
    if (!semantics || !semantics.dependencies) {
      return
    }
   
    let resolvedDependencies = await ModuleDependencyAnalysis.resolveModuleDependencies(fileUrl, semantics.dependencies)
    this.db.transaction("rw", this.db.modules, () => {
      this.db.modules.put(resolvedDependencies)
    })
  }
  
  async updateAllLinks() {
    await this.db.transaction('rw', this.db.files, this.db.links, () => {
      this.db.files.where("type").equals("file").each((file) => {
        this.addLinks(file) 
      })
    })
    console.log('updateAllLinks() finished.')
  }
  
  async addLinks(file) {
    BrokenLinkAnalysis.extractLinks(file).then(links => {
      this.db.transaction("rw!", this.db.links, async () => {
        this.db.links.where("url").equals(file.url).delete()
        if (links) {
          this.db.links.bulkPut(links)
        }
      })
    })
  }
  
 async extractLinks(file) {   
    if (!file || !file.content) {
      return [];
    }
    var links = new Array()
    var extractedLinks =  file.content.match(/(((http(s)?:\/\/)(w{3}[.])?)([a-z0-9\-]{1,63}(([\:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,})([\_\/\#\-[a-zA-Z0-9]*)?[#.?=%;a-z0-9]*)/g)
    
    if(!extractedLinks) {
      return [];
    }
    for (const extractedLink of extractedLinks) {
      var link = {
        link: extractedLink,
        location: extractedLink.includes(window.location.hostname) ? "internal" : "external",
        url: file.url,
        status: links.find(link => link.link == extractedLink) ? extractedLink : await this.validateLink(extractedLink)
      }
      links.push(link)   
    }
   return links;
 }
  
 async validateLink(link) { 
  return await fetch(link, { 
    method: "GET", 
    mode: 'no-cors', 
    redirect: "follow", // manual, *follow, error
    referrer: "no-referrer", // no-referrer, *client
  })
  .then((response) => {
    if (response.type === "basic") { // internal link
      if (response.ok) {
        return "alive"
      } else {
        return "dead"
      } 
    } else if (response.type === "opaque") { // external link
      return "alive"
    }
  })
  .catch((error) => {console.log(error, "Link: " + link); return "dead"})
  }
    
  async updateAllVersions() {
     await this.db.transaction('rw', this.db.files, this.db.versions, () => {
      return this.db.files.where("type").equals("file").toArray()
    }).then((files) => {
      files.forEach(file => {
        if (file.name && file.name.match(/\.js$/))
          this.addVersion(file)
      })
    }) 
  }
  
  async addVersion(file) {
      let response = await Files.loadVersions(file.url) 
      let json = await response.json()
      let versions = json.versions
      for (let i = 0; i < versions.length-2; ++i) { // length-2: last object is always null
        let version = versions[i]
        let versionPrevious = versions[i+1]
        var modifications = await this.findModifiedClassesAndMethods(file.url, version, versionPrevious)
        this.db.transaction("rw", this.db.versions, () => {
          this.db.versions.bulkPut(modifications)
        })
        if (i >= 9) break; // consider latest ten versions
      }
  } 
  
  async findModifiedClassesAndMethods(fileUrl, latestVersion, previousVersion) {
    let modifications = new Array()
    let latestContent = await Files.loadFile(fileUrl, latestVersion.version)
    let previousContent = await Files.loadFile(fileUrl, previousVersion.version)
    let astLastest = await this.parseSource(fileUrl, latestContent)
    let astPrevious = await this.parseSource(fileUrl, previousContent)

    if (!astLastest || !astPrevious) {
      return modifications
    }

    let latest = await this.parseModuleSemantics(astLastest)
    let previous = await this.parseModuleSemantics(astPrevious)
    // classes
    for (let classLatest of latest.classes) {
      try {
        let previousClass = previous.classes.find(clazz => clazz.name == classLatest.name)
        if (!previousClass) { // added class
          modifications.push({
            url: fileUrl,
            class: classLatest.name,
            method: "+null+",
            date: latestVersion.date,
            user: latestVersion.author,
            commitId: latestVersion.version,
            action: (!previousClass) ? "added" : "modified"
          })
        }
        
        // methods
        for (let methodLastest of classLatest.methods) {
          if (!previousClass) { // added method
             modifications.push({
                url: fileUrl,
                class: classLatest.name,
                method: methodLastest.name,
                date: latestVersion.date,
                user: latestVersion.author,
                commitId: latestVersion.version,
                action: "added"
              })
          } else {
            let methodPreviousClass = previousClass.methods.find(method => method.name == methodLastest.name)
            if ((!methodPreviousClass) || (methodPreviousClass && latestContent.substring(methodLastest.start, methodLastest.end) != previousContent.substring(methodPreviousClass.start, methodPreviousClass.end)) ) { // added or modified method
              modifications.push({
                url: fileUrl,
                class: classLatest.name,
                method: methodLastest.name,
                date: latestVersion.date,
                user: latestVersion.author,
                commitId: latestVersion.version,
                action: (!methodPreviousClass) ? "added" : "modified"
              })
            }
          }
        }
      
        if (!previousClass) continue;
        for (let methodPreviousClass of previousClass.methods) {
          let latestClassMethod = classLatest.methods.find(method => method.name == methodPreviousClass.name)
          if (!latestClassMethod) { // deleted method
            modifications.push({
              url: fileUrl,
              class: classLatest.name,
              method: methodPreviousClass.name,
              user: latestVersion.author,
              date: latestVersion.date,
              commitId: latestVersion.version,
              action: "deleted"
            })
          }
        }
      } catch(error) {
        console.error("Version history couldn't created for class: ", classLatest, error)
      }
    }
    return modifications 
  }
  
  parseModuleSemantics(ast) {
    let classes = []
    let dependencies = []
    let importDeclarations = new Map()
    babel.traverse(ast,{
      ImportDeclaration(path) {
        if (path.node.source && path.node.source.value) {
          let specifierNames = []
          let moduleUrl = path.node.source.value
          if (path.node.specifiers) { 
            path.node.specifiers.forEach(function(item) {
              if (item.type === "ImportNamespaceSpecifier") {
                specifierNames.push('*')
                importDeclarations.set('*', moduleUrl)
              } else {
                specifierNames.push(item.local.name)
                importDeclarations.set(item.local.name, moduleUrl)
              }
            })
          }
          let dependency = {
            url: path.node.source.value,
            names: specifierNames
          }
           dependencies.push(dependency)
        }
      },
      ClassDeclaration(path) {
        let superClassName = ''
        let superClassUrl = ''
        if (path.node.id) {
          let clazz = {
            name: path.node.id.name,
            start: path.node.start, // start byte 
            end: path.node.end,     // end byte
            loc: path.node.loc.end.line - path.node.loc.start.line + 1
          }
          superClassName = (path.node.superClass) ? path.node.superClass.name : ''
          superClassUrl = importDeclarations.get(superClassName)
          let methods = []
          if (path.node.body.body) {
            path.node.body.body.forEach(function(item) {
              if(item.type === "ClassMethod") {
                let method = {
                  name: item.key.name,
                  loc: item.loc.end.line - item.loc.start.line + 1,
                  start: item.start,
                  end: item.end,
                }
                methods.push(method)
              }
            })
          }
          clazz.methods = methods
          clazz.superClassName = superClassName
          clazz.superClassUrl = superClassUrl
          classes.push(clazz)
        } 
      }
    })
    return {classes, dependencies}
  }
  
  // ********************************************************

  showProgress(label, func) {
    ShowDexieProgress.currentLabel = label
    return cop.withLayers([ShowDexieProgress], () => {
        return func()
    })
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

  async updateFile(url) {
    console.log("FileCache Analysis updateFile " + url)
    var stats = await fetch(url, {
      method: "OPTIONS"
    }).then(r => r.clone().json())
    this.addFile(url, stats.name, stats.type, stats.size, stats.modified)
  } 
    
  async addFile(url, name, type, size, modified) {    
    if (url.match("/node_modules") || url.match(/\/\./) ) {
      // console.log("FileIndex ignore  " + url)
      return
    }    
    console.log("FileIndexAnalysis addFile " + url)

    var file = {
      url: url,
      name: name,
      size: size,
      modified: modified
    }
    
    if (name.match(/\.((css)|(js)|(md)|(txt)|(x?html))$/)) {
      if (size < 100000) {
        let response = await fetch(url)
        file.version = response.clone().headers.get("fileversion")
        file.content = await response.clone().text()    
      }
    }

    let fileType = url.replace(/.*\./,"")
    if(type == "directory") {
      type = "directory"
    }
    file.type = type
    
    await this.db.transaction("rw", this.db.files, () => { 
      this.db.files.put(file) 
    })
    
    if (file.content) {
      this.extractTitleAndTags(file) 
      this.addLinks(file)

      if (file.name.match(/\.js$/)) {
        this.addModuleSemantics(file)
        this.addVersion(file)
      }      
    }
  }

  async dropFile(url) {
    console.log("FileIndexAnalysis drop " + url + " from index")
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
        console.log("FileIndex Analysis fetch failed ", baseURL, r)
      }
    })
    if (!json) {
      console.log("FileIndex Analysis could not update " + baseURL)
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
    console.log("FileIndex Analysis updateDirectory finished")
  }

  async addDirectory(baseURL) {
    this.updateDirectory(baseURL, true) // much faster and better
  }
  showAsTable() {
    var result= []
    this.db.files.each(ea => {
      result.push({
        url:ea.url,
        size: ea.size,
        title: (ea.title) ? ea.title.replace(/</g, "&lt;").slice(0,100) : "",
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
    })
  }
}

class BrokenLinkAnalysis {
  
  static async extractLinks(file) {
    if (!file || !file.content || file.url.includes("/src/external/") || file.url.match(/\.js$/)) {
      return [];
    }
  
    var links = new Array()
    var extractedLinks =  new Array()
    
    if (file.url.match(/\.md$/)) {
       let patternMdFiles = /(?<=(\]:\s*)|(\]\s*\())((http(s)?:\/\/(w{3}[.])?([a-z0-9.-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,})([a-zA-Z0-9\/\.\-\_#.?=%;]*))|((([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+([a-zA-Z0-9\-_#.?=%;]+)?))/gm
           // /(?<=<|\[.*\]:\s*|\[.*\]\)|src\s*=\s*('|")|href\s*=\s*('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z_-]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      extractedLinks = file.content.match(patternMdFiles)
    } else if (file.url.match(/\.(css|(x)?html)$/)) {
      let patternHtmlCssFiles = /(?<=(src\s*=\s*|href\s*=\s*|[a-zA-Z0-9\-_]+\s*\{\s*.*\s*:\s*)('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      extractedLinks = file.content.match(patternHtmlCssFiles)
    }
    if(!extractedLinks) {
      return [];
    }
  
    for (const extractedLink of extractedLinks) {
      if (/^http|https|www/g.test(extractedLink)) {
        let link = {
          link: extractedLink,
          location: extractedLink.includes('lively-kernel.org') ? "internal" : "external",
          url: file.url,
          status: await this.validateLink(extractedLink),
        }
        links.push(link)  
      } else if (/^\//g.test(extractedLink) || /^src/g.test(extractedLink)) {
        let fullLink = lively4url + '/' + extractedLink
        let link = {
          link: extractedLink,
          location: "internal",
          url: file.url,
          status: await this.validateLink(fullLink),
        }
        links.push(link)
      } else if (/^\./g.test(extractedLink) || /^[A-Za-z\_\-]/g.test(extractedLink)) {
        let fullLink = file.url.replace(file.name, extractedLink)
        let link = {
          link: extractedLink,
          location: "internal",
          url: file.url,
          status: await this.validateLink(fullLink),
        }
        links.push(link)
      } else {
        console.error('extracted link: ',extractedLink )
      }
    }
    return links
  }
      
  
 static async validateLink(link) { 
  return BrokenLinkAnalysis.fetch(link, { 
    method: "GET", 
    mode: 'no-cors', 
    redirect: "follow"
  }, FETCH_TIMEOUT) 
  .then((response) => {
    if (response.type === "basic") { // internal link
      if (response.ok) {
        return "alive"
      } else {
        return "broken"
      } 
    } else if (response.type === "opaque") { // external link
      return "alive"
    }
  })
  .catch(() => {return "broken"})
  }

  static async fetch(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout: ' + url)), timeout)
        )
    ]);
  }
}

class ModuleDependencyAnalysis {
  
   static async resolveModuleDependencies(fileUrl, dependencies) {
    let resolvedDependencies = new Array()
    for (const dependency of dependencies) {
      let resolvedDependency = await System.resolve(dependency.url, fileUrl)
      if (!resolvedDependency) {
        resolvedDependencies.push(dependency.url)  
      } else {
        resolvedDependencies.push(resolvedDependency)
      }
    }
     
    return {
      url: fileUrl,
      dependencies: resolvedDependencies
    }
  }
}


cop.layer(self, "ShowDexieProgress").refineClass(FileIndex.current().db.Collection, {
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

