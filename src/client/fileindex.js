/*
 * File Index for Static Analys and Searching
 *
 */

import Dexie from "src/external/dexie.js"
import Strings from "src/client/strings.js"
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;
import * as cop from "src/client/ContextJS/src/contextjs.js";
import Files from "src/client/files.js"
import Paths from "src/client/paths.js"

import babelPluginSyntaxJSX from 'babel-plugin-syntax-jsx'
import babelPluginSyntaxDoExpressions from  'babel-plugin-syntax-do-expressions'
import babelPluginSyntaxFunctionBind from 'babel-plugin-syntax-function-bind'
import babelPluginSyntaxGenerators from 'babel-plugin-syntax-async-generators'

import Bibliography from 'src/client/bibliography.js'
import BibtexParser from 'src/external/bibtexParse.js'
import Markdown from "src/client/markdown.js"

// import moment from "src/external/moment.js";  
import diff from 'src/external/diff-match-patch.js';

const dmp = new diff.diff_match_patch();

const syntaxPlugins = [babelPluginSyntaxJSX, babelPluginSyntaxDoExpressions, babelPluginSyntaxFunctionBind, babelPluginSyntaxGenerators]

const FETCH_TIMEOUT = 5000
const MAX_FILESIZE = 200000

const t = babel.types;

import { wait } from 'utils';


function getBaseURL(url) {
  return url.replace(/[#?].*/,"")
}

export default class FileIndex {

  static current() {
    // FileIndex._current = null
    if (!this._current) {
      this._current = new FileIndex("file_index")
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
    this.db.exports.clear()
    // this.db.delete() 
  }

  constructor(name) {
    this.name = name
    this.db = this.fileCacheDB()
  }

  fileCacheDB() {
    var db = new Dexie(this.name);

    db.version(1).stores({
        files: 'url,name,type,version,modified,options,title,tags,versions',
        history: '[url+version],url,name,type,version,modified,options,title,tags',
        commits: 'hash,message,date',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user'
    }).upgrade(function () {
    })
    
    db.version(2).stores({
        files: 'url,name,type,version,modified,options,title,tags,versions',
        history: '[url+version],url,name,type,version,modified,options,title,tags',
        commits: 'hash,message,date',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user',
        exports: 'url,*functions,*classes'
    }).upgrade(function () {
    })
     db.version(3).stores({
        files: 'url,name,type,version,modified,options,title,tags,versions',
        bibliography: 'key, type, title, author, year, references, organization',
        history: '[url+version],url,name,type,version,modified,options,title,tags',
        commits: 'hash,message,date',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user',
        exports: 'url,*functions,*classes'
    }).upgrade(function () {
    })
   
    db.version(4).stores({
        files: 'url,name,type,version,modified,options,title,tags,versions,bibkey',
        bibliography: 'key, type, title, author, year, references, organization',
        history: '[url+version],url,name,type,version,modified,options,title,tags',
        commits: 'hash,message,date',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user',
        exports: 'url,*functions,*classes'
    }).upgrade(function () {
    })

    
    db.version(5).stores({
        files: 'url,name,type,version,modified,options,title,*tags,*versions,bibkey',  // references
        bibref: '[url+key], key, url, type, title, author, year, *references, organization',
        history: '[url+version],url,name,type,version,modified,options,title,*tags',
        commits: 'hash,message,date',
        links: '[link+url], link, url, location, status',
        modules: 'url, *dependencies',
        classes: '[name+url], name, url, loc, start, end, superClassName, superClassUrl, [superClassName+superClassUrl], *methods', 
        versions: '[class+url+method+commitId+date], [class+method], [class+url+action], [class+url+method], class, url, method, commitId, date, action, user',
        exports: 'url,*functions,*classes'
    }).upgrade(function () {    })
    
    db.version(6).stores({
      files: "url,name,type,version,modified,options,title,*tags,*versions,bibkey,*references"
    }).upgrade(function () {    })
    
    db.version(7).stores( {
      bibref: '[url+key], key, url, type, title, *authors, year, *references, organization'
    }).upgrade(function () {    })
    db.version(8).stores({
      
    }).upgrade(function () {    })
    db.version(9).stores({
      bibliography: null
    }).upgrade(function () {    })
    db.version(10).stores({
      bibref: null,
    }).upgrade(function () {    })
    db.version(11).stores({
      bibliography: '[url+key], key, url, type, title, *authors, year, *references, organization'
    }).upgrade(function () {    })
    db.version(12).stores({
      bibliography: '[url+key], key, url, type, title, *authors,*keywords, year, *references, organization'
    }).upgrade(function () {    })
    db.version(13).stores({
      files: "url,name,type,version,modified,options,title,*tags,*versions,bibkey,*references, *unboundIdentifiers"
    }).upgrade(function () {    })
    db.version(14).stores({
      bibliography: '[url+key], key, url, type, title, *authors,*keywords, year, *references, organization, microsoftid, doi'
    }).upgrade(function () {    })
    db.version(15).stores({
      bibliography: '[url+key], key, url, type, title, *authors,*keywords,*fields, year, *references, organization, microsoftid, doi'
    }).upgrade(function () {    })

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
  
  async updateAllBibkeys() {
    var result = []
    await this.db.transaction('rw', this.db.files, () => {
      this.db.files.where("type").equals("file").each((file) => {
        if (file.url.match(/\.pdf$/)) {
          file.bibkey = Bibliography.urlToKey(file.url)
          this.db.files.put(file)
          result.push(file)
        }
      })
    })
    return result
  }

  
  async addBibrefs(file) {
    if (file.url.match(/\.bib$/) && file.content) {    
      console.log('[fileindex] addBibrefs')
      
      var all = new Set()
      var visited = new Set()
      await this.db.bibliography.each(ea => {
        if (ea.url == file.url) all.add(ea.key)
      })
   
      var bib = BibtexParser.toJSON(file.content)
      bib.forEach(entry => {
        var refentry = {
              key: entry.citationKey  || "undefined",
              url: file.url,
              source: BibtexParser.toBibtex([entry], false),
              type: entry.entryType,
              references: []
         }
        
          if (entry.entryTags) {
              refentry.authors = Bibliography.splitAuthors(entry.entryTags.author || entry.entryTags.Author)
              refentry.title = Bibliography.cleanTitle(entry.entryTags.title || entry.entryTags.Title)
              refentry.year = entry.entryTags.year || entry.entryTags.Year
              refentry.keywords = (entry.entryTags.keywords || entry.entryTags.Keywords || "").split(", ")
              refentry.fields = (entry.entryTags.fields || entry.entryTags.Fields || "").split(", ")
              refentry.organization = entry.entryTags.organization || entry.entryTags.Organization
              refentry.microsoftid = entry.entryTags.microsoftid
              refentry.doi = entry.entryTags.doi
          }
        visited.add(refentry.key)
        this.db.bibliography.put(refentry)
      })
      
      // delete remaining entries
      all.forEach(key => {
        if (!visited.has(key)) {
          console.log("[fileindex] delete bibtex entry " + file.url + " " + key)
          this.db.bibliography.where({url: file.url, key: key}).delete()
        }
      })
    }
  }
  
  async updateAllBibrefs() {
    var result = []
    await this.db.transaction('rw', this.db.files, this.db.bibliography, () => {
      this.db.files.where("type").equals("file").each((file) => {
        this.addBibrefs(file)
      })
    })
    return result
  }

  
  
  async updateAllModuleSemantics() {
    await this.db.transaction('rw', this.db.files,  this.db.classes, this.db.modules, () => {
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
      this.updateExportEntry(file.url, result)
      this.updateUnboundIdentifiers(file, result)
    }
  }
  
  extractModuleSemantics(file) {
    try {
      var ast = this.parseSource(file.url, file.content)
      if(!ast) {
        console.info('Could not parse file:', file.url)
        return []
      }
      var results = this.parseModuleSemantics(ast)
     } catch(e) {
      console.warn('[fileindex] extractModuleSemantics ', e)
    }
    return results;
  }
  
  async updateClasses(file, semantics) {
    if (!semantics || !semantics.classes) {
      return
    }
    var classNames = []
    for (var eaClass of semantics.classes) {
      if (eaClass.superClassName && !eaClass.superClassUrl) {
        let superClass = semantics.classes.find(item => item.name == eaClass.superClassName)
        eaClass.superClassName = (superClass) ? superClass.superClassName : ''
        eaClass.superClassUrl = (superClass) ? file.url : ''
      } else if (eaClass.superClassName && eaClass.superClassUrl) {
        eaClass.superClassUrl = await System.resolve(eaClass.superClassUrl, file.url)
      }
      eaClass.url = file.url
      eaClass.nom = eaClass.methods ? eaClass.methods.length : 0
      classNames.push(eaClass.name)
      await this.addClass(eaClass)
    }
    var allClasses = await this.db.classes.where({url: file.url}).toArray()
    
    // deleted obsolete classes
    var obsoleteClasses = allClasses.filter(ea => !classNames.includes(ea.name))
    for(let eaClass of obsoleteClasses) {
     await this.db.classes.where({name: eaClass.name, url: eaClass.url}).delete() 
    }
  } 
  
  async addClass(clazz) {
    await this.db.classes.where({name: clazz.name, url: clazz.url}).delete()
    this.db.classes.put(clazz)
  }
  
  async updateExportEntry(url, semantics) {
    if (!semantics || (!semantics.functionExports && !semantics.classExports)) {
      return
    }
    if (semantics.functionExports.length > 0 || semantics.classExports.length > 0) {
      let exportEntry = {
        url: url,
        functions: semantics.functionExports,
        classes: semantics.classExports
      }
      await this.addExportEntry(exportEntry)
    }
  }
  
  async addExportEntry(exportEntry) {
    await this.db.exports.where({url: exportEntry.url}).delete()
    this.db.exports.put(exportEntry)
  }
  
  async updateUnboundIdentifiers(file, semantics) {
    if (!semantics || (!semantics.unboundIdentifiers)) {
      return
    }
    if (semantics.unboundIdentifiers.length > 0) {
      file.unboundIdentifiers = semantics.unboundIdentifiers
        .filter((value, index, self) => self.indexOf(value) === index);
      this.db.files.put(file);
    }
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
  
  /* extract links and check status */
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
  
  
  /* checks status of links */
  async checkLink(link, statusCache=new Map()) {
    var normalizedLink = Paths.normalizePath(link.link, link.url)
    console.log("[fileindex] checkLink " + link.url + " -> " +normalizedLink)
    var status = statusCache.get(normalizedLink)
    if (!status) {
      status = await this.validateLink(normalizedLink)
      statusCache.set(normalizedLink, status)
    }
    if (status == "broken") {
      console.warn("[fileindex ] broken link " + link.url + " -> " + link.link)
    }
    await this.db.transaction("rw", this.db.links, () => {
      this.db.links.where({url: link.url, link: link.link}).modify({status:  status})
    })
    return status
  }

  async checkLinks(links) {
    var statusCache = new Map()
    for(var link of links) {
      await this.checkLink(link, statusCache)
      console.log("[fileindex] updated status " + link.link + " " + link.status )
    }
  }
  
  async checkLinksFile(url) {
    return this.checkLinks(await this.db.links.where({url: url}).toArray())
  }

  async checkAllLinks() {
    return this.checkLinks(await this.db.links.toArray())
  }
  
  async extractLinks(file) { 
   return BrokenLinkAnalysis.extractLinks(file)
  }
  
  async validateLink(link) { 
    return BrokenLinkAnalysis.validateLink(link)
  }
    
  async updateAllVersions() {
     await this.db.transaction('rw', this.db.files, this.db.versions, () => {
      return this.db.files.where("type").equals("file").toArray()
    }).then((files) => {
      files.forEach(file => {
        if (file.name && file.name.match(/\.js$/))
          this.addVersions(file)
      })
    }) 
  }
  
  async loadVersions(url) {
    try {
      let response = await await fetch(url, {
            method: "OPTIONS",
            headers: {
              showversions: true,
              "debug-initiator": "fileindex.js#loadVersions"
            }
          })
      let text = await response.text()
      return JSON.parse(text).versions
    }  catch(e) {
      console.error("[fileindex] could not parse versions for " + url, e) 
      // throw new Error("[fileindex] could not parse versions for " + url, e) 
    }
    return []
  }
  
  
  async addVersions(file) {

    let versions = (await this.loadVersions(file.url)).filter(ea => ea)
    
    for (let version of versions) {
      var historicFileResult  = await this.db.history.where({
        'url': "" + file.url, 
        'version': "" + version.version}).toArray()
      if (historicFileResult.length > 0) {
        // console.log("[fileindex] found ", historicFileResult)
      } else {
        // console.log("[fileindex] NEW VERSION " + file.url)
        
        if (!version.parents) throw new Error("parents missing")
        var parentVersionHash = version.parents.split(" ")[0]
        
        var historicFile = {
          url: file.url,
          type: file.type,
          name: file.name,
          version: version.version,
          previous: parentVersionHash
        }
        // console.log("[fileindex] add history", historicFile)
        await this.db.transaction("rw", this.db.history, () => { 
          this.db.history.put(historicFile) 
        })

        var modifications = await this.findModifiedClassesAndMethods(file.url, version, parentVersionHash)
        // console.log("[fileindex] add method modifications ", modifications)
        this.db.transaction("rw", this.db.versions, () => {
          this.db.versions.bulkPut(modifications)
        })          
        
        
        // if (i >= 9) break; // consider latest ten versions        
      }
    }
  } 
  
  async loadVersion(url, version) {
    if (!window.FileIndexFileCache) {
      window.FileIndexFileCache = new Map()
    }
    var key = url + "@" +version
    var cached = window.FileIndexFileCache.get(key)
    if (!cached) {
      cached =  await Files.loadFile(url, version)
      window.FileIndexFileCache.set(key, cached)
    }
    return cached
  }
  
  findSameMethodInClass(aClass, aMethod) {
    return aClass.methods.find(method => 
        method.name == aMethod.name 
        && method.static == aMethod.static
        && method.kind == aMethod.kind)
  }
  
  findSameClassInModule(aModule, aClass) {
    return aModule.classes.find(ea => ea.name == aClass.name)
  }
  
  createModification(fileUrl, action, version, previousVersionHash, aClass, aMethod, source="") {
    var result =  {
        url: fileUrl,
        class: aClass.name,
        method: "+null+",
        date: version.date,
        user: version.author,
        commitId: version.version,
        previousCommitId: previousVersionHash,
        action: action,
        source: source
    }
    if (aMethod) {
      result.method = aMethod.name
      result.static = aMethod.static,
      result.kind = aMethod.kind
      result.start = aMethod.start
      result.end = aMethod.end
    }
    return result
  }
  
  
  async findModifiedClassesAndMethods(fileUrl, latestVersion, previousVersionHash) {
    console.log("findModifiedClassesAndMethods ", fileUrl, latestVersion, previousVersionHash)
    let modifications = new Array()
    let latestContent = await this.loadVersion(fileUrl, latestVersion.version)
    let previousContent = await this.loadVersion(fileUrl, previousVersionHash)
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
        let previousClass = this.findSameClassInModule(previous, classLatest)
        if (!previousClass) { // added class
          modifications.push(this.createModification(
            fileUrl,
            (!previousClass) ? "added" : "modified", 
            latestVersion,  previousVersionHash, 
            classLatest))
        }
        // methods
        for (let methodLastest of classLatest.methods) {
          var latestSource = latestContent.substring(methodLastest.start, methodLastest.end)
          var modification = this.createModification(fileUrl, "added", latestVersion,  previousVersionHash, classLatest, methodLastest, latestSource)
         
          if (!previousClass) { // added method
            modifications.push(modification)
          } else {
            let methodPreviousClass = this.findSameMethodInClass(previousClass, methodLastest)
            if (methodPreviousClass) {
              var prevSource = previousContent.substring(methodPreviousClass.start, methodPreviousClass.end)
              if (prevSource != latestSource) {
                modification.action = "modified"
                var diff1 = dmp.diff_main(prevSource, latestSource);
                modification.patch = dmp.patch_toText(dmp.patch_make(diff1))
                modification.previousSource = prevSource
                modifications.push(modification) 
              } else {
                // the source was the same in the previous version
              }
            } else  {
              // method was not there in previous version
              modification.action = "added"
              modifications.push(modification) 
            }
          }
        }
      
        if (!previousClass) continue;
        for (let methodPreviousClass of previousClass.methods) {
          let latestClassMethod =  this.findSameMethodInClass(classLatest, methodPreviousClass) 
          if (!latestClassMethod) { // deleted method
            modifications.push(
              this.createModification(fileUrl, "deleted", latestVersion,  previousVersionHash, classLatest, methodPreviousClass, ""))
          }
        }
      } catch(error) {
        console.error("Version history couldn't created for class: ", classLatest, error)
      }
    }
    return modifications 
  }
  
  parseModuleSemantics(ast) {
    let classes = [];
    let dependencies = [];
    let importDeclarations = new Map();
    let functionExports = [];
    let classExports = [];
    let unboundIdentifiers = [];
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
                  kind: item.kind,
                  static: item.static,
                  end: item.end,
                  leadingComments: item.leadingComments
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
      },
      ExportNamedDeclaration(path) {
        if(t.isFunctionDeclaration(path.node.declaration)) {
          functionExports.push(path.node.declaration.id.name)
        }
        if(t.isClassDeclaration(path.node.declaration)) {
          classExports.push(path.node.declaration.id.name)
        }
      },
      Identifier(path) {
        if (!(FileIndex.hasASTBinding(path))) {
          unboundIdentifiers.push(path.node.name);
        }
      }
    })
    return {classes, dependencies, functionExports, classExports, unboundIdentifiers}
  }
  
  static getBindingDeclarationIdentifierPath(binding) {
    return this.getFirstSelectedIdentifierWithName(binding.path, binding.identifier.name);
  }
  
  static getFirstSelectedIdentifierWithName(startPath, name) {
    if (t.isIdentifier(startPath.node, { name: name })) {
      return startPath;
    }
    var first;
    startPath.traverse({
      Identifier(path) {
        if (!first && t.isIdentifier(path.node, { name: name })) {
          first = path;
          path.stop();
        }
      }
    });
    return first;
  }
  
  static hasASTBinding(identifier) {
    if (!identifier.scope.hasBinding(identifier.node.name)) return false;

    const binding = identifier.scope.getBinding(identifier.node.name);
    if (!binding) return false;
    
    const identifierPaths = [...new Set([FileIndex.getBindingDeclarationIdentifierPath(binding), ...binding.referencePaths, ...binding.constantViolations.map(cv => FileIndex.getFirstSelectedIdentifierWithName(cv, binding.identifier.name))])];
    return identifierPaths.includes(identifier);
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
          plugins: [...syntaxPlugins],
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
      console.log('FileIndex, could not parse: ' + filename, e)
      return undefined
    }
  }
  
  async updateFile(url) {
    url = getBaseURL(url)
    console.log("[fileindex] updateFile " + url)
    var stats = await fetch(url, {
      method: "OPTIONS", 
      headers: {
        "debug-initiator": "fileindex.js#updateFile"
      }
    }).then(r => r.clone().json())
    
    if (!stats.error) {
      let name = url.replace(/.*\//,"")
      await this.addFile(url, name, stats.type, stats.size, stats.modified)
    }
  } 
    
  async addFile(url, name="", type, size, modified, slowdown=false, indexVersions=false) {
    var start = performance.now()
    var addedContent = false
    if (url.match("/node_modules") || url.match(/\/\./) ) {
      // console.log("FileIndex ignore  " + url)
      return
    }    
    console.log("[fileindex] addFile " + url)

    if (type == "file") {
       
    }
    
    var file = {
      url: url,
      name: name,
      size: size,
      modified: modified
    }
  
    if (name.match(/\.((css)|(js)|(md)|(txt)|(tex)|(bib)|(x?html))$/)) {
      if ((size < MAX_FILESIZE) || name.match(/\.((bib))$/) ) {
        let response = await fetch(url, {
          method: "GET",
          headers: {
            "debug-initiator": "fileindex.js#addFile"
          }
        })
        file.version = response.clone().headers.get("fileversion")
        file.content = await response.clone().text() 
        
        // only load versions for our small text files... 
        console.log("[fileindex] load versions for " + url)

        if (indexVersions) {
          var versionsJSON = (await this.loadVersions(url))
          if (versionsJSON) {
            file.versions = versionsJSON.map(ea => ea && ea.version).filter(ea => ea)  
          } else {
            console.warn("[lively-index] could not versions for " +url)
          }          
        }
        addedContent = true
      }
    }

    let fileType = url.replace(/.*\./,"")
    if(type == "directory") {
      type = "directory"
    }
    file.type = type
    
    if (file.content) {
      this.extractTitleAndTags(file) 
      this.addLinks(file)
      if (file.name.match(/\.md$/)) {
        file.references = Markdown.extractReferences(file.content)
      }
    }
    
    if (file.name.match(/\.pdf$/)) {
      file.bibkey = Bibliography.urlToKey(file.url)
    }
    
    file.unboundIdentifiers = []
    
    
    await this.db.transaction("rw", this.db.files, () => { 
      this.db.files.put(file) 
    })
    
    if (file.name.match(/\.bib$/)) {
      await this.db.transaction("rw", this.db.bibliography, () => { 
        this.addBibrefs(file)
      })
    }

    if (file.name.match(/\.js$/)) {
      await this.addModuleSemantics(file)
      // await this.addVersions(file) // #Disabled for now, this is expensive!
    }
    
    console.log("[fileindex] addFile "+ url + " FINISHED (" + Math.round(performance.now() - start) + "ms)")
    
    if (slowdown && addedContent) {
      console.log("[fileindex] wait a second")
      await wait(1000) // slow down the indexing
    }
  }

  async dropFile(url) {
    console.log("FileIndex drop " + url + " from index")
    this.db.transaction("rw", this.db.files, () => {
      this.db.files.delete(url)
    })
  }

  async removeDirectory(baseURL) {
    var files = await this.toArray()
    for(let ea of files) {
      let eaURL = ea.url
      if (eaURL.startsWith(baseURL)) {
        this.dropFile(eaURL)
      }     
    }
  }
  
  async updateDirectory(baseURL, showProgress, updateDeleted, indexVersion=false) {
    var json = await fetch(baseURL, {
      method: "OPTIONS",
      headers: {
        filelist  : true,
        "debug-initiator": "fileindex.js#updateDirectory"
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
    
    let files = json.contents || []
    files = files.filter(ea => !ea.name.match(/(\.svn)|(\.git)/))
    
    if (showProgress) {
      var progress = await lively.showProgress("add " + baseURL.replace(/\/$/,"").replace(/.*\//,""))
      var total = files.length
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
      for(let ea of files) {
          if (showProgress) progress.value = i++ / total;
          let eaURL = baseURL.replace(/\/$/,"") + ea.name.replace(/^\./,"")
          let name = eaURL.replace(/.*\//,"")
          if (lastModified.get(eaURL) !== ea.modified) {
            await this.addFile(eaURL, name, ea.type, ea.size, ea.modified, true, indexVersion)
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
    return this.updateDirectory(baseURL, true) // much faster and better
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
    var statusCache = new Map()
    var extractedLinks =  new Array()
    
    if (file.url.match(/\.md$/)) {
      // #BUG prevents loading in #FireFox due to invalid regexp group
      // FF RegExp version does not support lookbehinds. https://stackoverflow.com/questions/49816707/firefox-invalid-regex-group
      // #TODO Refactor

      // let patternMdFiles = /(?<=(\]:\s*)|(\]\s*\())((http(s)?:\/\/(w{3}[.])?([a-z0-9.-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,})([a-zA-Z0-9\/\.\-\_#.?=%;]*))|((([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+([a-zA-Z0-9\-_#.?=%;]+)?))/gm
      //      // /(?<=<|\[.*\]:\s*|\[.*\]\)|src\s*=\s*('|")|href\s*=\s*('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z_-]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      // extractedLinks = file.content.match(patternMdFiles)
      
      
    } else if (file.url.match(/\.(css|(x)?html)$/)) {
      
      // #TODO Refactor
      
      // let patternHtmlCssFiles = /(?<=(src\s*=\s*|href\s*=\s*|[a-zA-Z0-9\-_]+\s*\{\s*.*\s*:\s*)('|"))((((http(s)?:\/\/)(w{3}[.])?)([a-z0-9-]{1,63}(([:]{1}[0-9]{4,})|([.]{1}){1,}([a-z]{2,})){1,}))|([./]+|[a-zA-Z\-_]))([a-zA-Z0-9\-_]+\.|[a-zA-Z0-9\-_]+\/)+((\.)?[a-zA-Z0-9\-_#.?=%;]+(\/)?)/gm
      // extractedLinks = file.content.match(patternHtmlCssFiles)
    }
    if(!extractedLinks) {
      return [];
    }
    for (const extractedLink of extractedLinks) {
      var normalizedLink = Paths.normalizePath(extractedLink, file.url)
      var status = statusCache.get(normalizedLink)
      if (!status) {
        status = await this.validateLink(normalizedLink)
        statusCache.set(normalizedLink, status)
      }
      
      let link = {
        link: extractedLink,
        location: extractedLink.includes('lively-kernel.org') ? "internal" : "external",
        url: file.url,
        status: status,
      }
      links.push(link)  
    }
    return links
  }
   
  static async validateLink(url) { 
    console.log("[fileindex] validateLink " + url)  
    try {
      var response = await  BrokenLinkAnalysis.fetch(url, { 
        method: "GET", // "GET" or "HEAD" or "OPTIONS" 
        mode: 'no-cors', 
        redirect: "follow",
        referrer: "no-referrer", // no-referrer, *client
      }, FETCH_TIMEOUT) 

      if (response.type === "basic") { // internal link
        if (response.ok) {
          return "alive"
        } else {
          return "broken"
        } 
      } else if (response.type === "opaque") { // external link
        return "alive"
      }
    } catch(e) {
      return "broken"
    } 
    return "alive" // at least nothing went wrong?
  }

  static async fetch(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => {
              reject(new Error('Fetch timeout: ' + url))
        }, timeout)
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


if (self.lively4fetchHandlers) {  
  
  // remove old instances of me
  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isFileIndexHandler);
  self.lively4fetchHandlers.unshift({
    isFileIndexHandler: true,
    handle(request, options) {
      // do nothing
    },
    async finsihed(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      
      var extraSearchRoots = []    
      if (window.lively && lively.preferences) {
        extraSearchRoots = lively.preferences.get("ExtraSearchRoots")  
      }
    
      var serverURL = lively4url.replace(/\/[^/]*$/,"")
      if (url.match(serverURL) || extraSearchRoots.find(ea => url.match(ea))) {
        if (method == "PUT") {
         //  
          // #TODO #PerformanceBug move this to worker and do it async....
          // await FileIndex.current().updateFile(url)
          if (lively.fileIndexWorker) {
            lively.fileIndexWorker.postMessage({message: "updateFile", url: url})
          }
          
        }
        if (method == "DELETE") {
          //
          // await FileIndex.current().dropFile(url)   
          if (lively.fileIndexWorker) {
            lively.fileIndexWorker.postMessage({message: "dropFile", url: url})
          }
        }
      }
    }
  })
  
}
