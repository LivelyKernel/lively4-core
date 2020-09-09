/*MD 
# Files API

MD*/


import { uuid as generateUuid } from 'utils';
import _ from 'src/external/lodash/lodash.js'
import sourcemap from 'src/external/source-map.min.js';

export default class Files {

  static async fillCachedFileMap() {
    var root = lively4url +  "/"
    var filelist =   await fetch(root, {
      method: "OPTIONS",
      headers: {
        filelist: true
      }
    }).then(r => r.json()).then(r => r.contents.map(ea => ea.name.replace(/^\.\//,url)))
    var map = this.cachedFileMap()
    for(var url of filelist) {
      map.set(url, {exists: true})
    }
  }
  
  static cachedFileMap() {
    
    if (!self.lively4cacheFiles) {
      self.lively4cacheFiles = new Map()  // indexDB or dexie are to slow (60ms for simple checking if it is there #TODO)
    } 
    return self.lively4cacheFiles 
  }
  
  static parseSourceReference(ref) {
    if(ref.match("!")) {
      var url = ref.replace(/!.*/,"")
      var args = ref.replace(/.*!/,"").split(/:/)
    } else {
      var m = ref.match(/(.*):([0-9]+):([0-9]+)$/)
      args = [m[2], m[3]]
      url = m[1]
    }
    
    var lineAndColumn
    if (args[0] == "transpiled") {
      // hide transpilation in display and links
      var moduleData = System["@@registerRegistry"][url]
      if (moduleData) {
      var map = moduleData.metadata.load.sourceMap
      var smc =  new sourcemap.SourceMapConsumer(map)
      lineAndColumn = smc.originalPositionFor({
          line: Number(args[1]),
          column: Number(args[2])
        })
      } else {
        lineAndColumn = {line: args[1], column: args[2]}
      }
    } else {
      lineAndColumn = {line: args[0], column: args[1]}
    }
    lineAndColumn.url = url
    lineAndColumn.toString = function() {
        return "" + this.url.replace(lively4url, "") + ":" + this.line + ":" + this.column
    }
    return lineAndColumn
  }
  
  
  static fetchChunks(fetchPromise, eachChunkCB, doneCB) {
    fetchPromise.then(function(response) {
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var all = "";
        (function read() {
          reader.read().then(function(result) {
            var text = decoder.decode(result.value || new Uint8Array, {
              stream: !result.done
            });
            all += text
            if (eachChunkCB) eachChunkCB(text, result)
            if (result.done) {
              if (doneCB) doneCB(all, result)
            } else {
              read() // fetch next chunk
            }
          })
        })()
      })
  }

  static async loadFileResponse(url, version) {
    url = this.resolve(url.toString())
    return fetch(url, {
      headers: {
        fileversion: version
      }
    })
  }

  static async loadFile(url, version) {
    return this.loadFileResponse(url, version).then(response => {
      console.log("file " + url + " read.");
      return response.text();
    })
  }

  static async copyURLtoURL(fromURL, toURL) {
    var blob = await fetch(fromURL, {method: 'GET'}).then(r => r.blob())
    return fetch(toURL, {method: 'PUT', body: blob})
  }
  
  static async saveFile(url, data){
    var urlString = url.toString();
    urlString = this.resolve(urlString)
    if (urlString.match(/\/$/)) {
      return fetch(urlString, {method: 'MKCOL'});
    } else {
      var options = {method: 'PUT', headers: {}, body: data}
      if (url.match && url.match(/\.svg$/)) {
        options.headers['Content-Type'] = 'image/svg+xml'
      }
      return fetch(urlString, options);
    }
  }
  
  static async moveFile(url, newURL) {
    let fromServerURL = this.serverURL(url)
    let toServerURL = this.serverURL(url)
    if (fromServerURL && (fromServerURL == toServerURL)) {
      
      // use special server MOVE/RENAME method
      var result = await fetch(url, {
        method: "MOVE",
        headers: {
          destination: newURL
        }
      }).then(r => r.text())
      lively.notify("MOVE", result)
      return 
    }
    
    var content = await fetch(url).then(r => r.blob())

    // first, save the content...
    var putResponse = await fetch(newURL, {
      method: 'PUT',
      body: content
    })

    if (putResponse.status !== 200) {
      lively.confirm("could not move file to " + newURL)
      return 
    }

    // ok, lets be crazy... we first delete
    var delResponse = await fetch(url, {method: 'DELETE'})
    if (delResponse.status !== 200) {
      lively.notify("could not properly delete " + url, await delResponse.text())
    }

    var getResponse = await fetch(newURL)
    if (getResponse.status !== 200) {
      lively.notify("save again, because we might need to...")
      var putAgainResponse = await fetch(newURL, {
        method: 'PUT',
        body: content
      })
      return 
    }
  }
  
  static async statFile(urlString){
    urlString = this.resolve(urlString)
    return fetch(urlString, {method: 'OPTIONS'}).then(resp => resp.text())
  }

  /**
   * Recursively walks a directory path given as string.
   * @returns an array of files
   */
  static async walkDir(dir) {
    
    var url = dir.replace(/\/?$/,"/")
    
    // iterate on the server vs client (is 400ms vs 4000ms)
    var result = await fetch(url, {
      method: "OPTIONS",
      headers: {
        filelist: true
      }
    }).then(r => r.json()).then(r => r.contents.map(ea => ea.name.replace(/^\.\//,url)))
    return result

//     if(dir.endsWith('/')) { dir = dir.slice(0, -1); }
//     const json = await lively.files.statFile(dir).then(JSON.parse);
//     if(json.type !== 'directory') {
//       throw new Error('Cannot walkDir. Given path is not a directory.')
//     }

//     let files = json.contents
//       .filter(entry => entry.type === 'file')
//       .map(entry => dir + '/' + entry.name);

//     let folders = json.contents
//       .filter(entry => entry.type === 'directory')
//       .map(entry => dir + '/' + entry.name);

//     let subfolderResults = await Promise.all(folders.map(folder => this.walkDir(folder)));
//     subfolderResults.forEach(filesInSubfolder => files.push(...filesInSubfolder));

//     return files;
  }

  // #Depricated
  static async existFile(urlString){
    return this.exists(urlString)
  }

  static async stats(url) {
    return fetch(url, {method: "OPTIONS"}).then(r => r.json())
  }

  static async type(url) {
    return (await this.stats(url)).type
  }

  static async exists(urlString) {
    var cachedInfo = this.cachedFileMap().get(urlString)
    if (cachedInfo) {
      return cachedInfo.exists
    }
    
    // karma / travis cannot handle option requests
    if (window.__karma__) { 
      return fetch(urlString, { 
          method: 'HEAD' 
        }).then(resp => resp.status == 200); 
    }  
  
    var resp = (await fetch(urlString, {method: "OPTIONS"}))
    if (resp.status != 200) return false
    var stats = await resp.json()
    return stats.error ? false : true
  }
  

  static isURL(urlString) {
    return ("" + urlString).match(/^([a-z]+:)?\/\//) ? true : false;
  }
  
  static async isFile(url) {
    return (await this.type(url)) == "file"
  }

  // #TODO: should be 'directiory'
  static async isDirectory(url) {
    return (await this.type(url)) == "file"
  }


  static directory(string) {
    string = string.toString()
    return string.replace(/([^/]+|\/)$/,"")
  }

  
  // #Depricated    
  static resolve(string) {
    if (!this.isURL(string)) {
      var result = lively.location.href.replace(/[^/]*$/, string)
    } else {
      result = string.toString()
    }
    // get rid of ..
    result = result.replace(/[^/]+\/\.\.\//g,"")
    // and .
    result = result.replace(/\/\.\//g,"/")
    
    return result
  }

  /* 
   * #Meta An inline test is a line that evaluates to true?
   * #Meta We coould parse those lines, and generate better feedback, e.g. not just that it does not evaluate to true, but what are the values that are not equal?
   * #Meta Could we run those inline tests in #Travis, too? 
   TESTS:
      lively.files.name("https://foo/bar/bla.txt") == "bla.txt" 
  */
  static name(url) {
    return url.toString().replace(/.*\//,"")
  }
  
 /* 
  TESTS:
      lively.files.extension("https://foo/bar/bla.txt") == "txt" 
      lively.files.extension("https://foo/bar/bla.PNG") == "png"
      lively.files.extension("https://foo/bar/bla") === undefined
   */  
  static extension(url) {
    var name = this.name(url)
    if (!name.match(/\./)) return undefined
    return name.toLowerCase().replace(/.*\./,"")    
  }
  
  
  /*# Generate tmpfile url for lively4 server
   *
   * lively.files.tempfile() // e.g. https://lively-kernel.org/lively4/_tmp/3b8a7fcc-11dd-463e-8d32-dcc46575a4fd
   *
   */
  static tempfile() {
    // #Dependency to #Lively4Server 
    return  lively.files.directory(lively4url) + "_tmp/" + generateUuid()  
  }

  /*
    lively.files.stringToBlob("hello world")
   */
  static stringToBlob(string) {
    var encoded = encodeURIComponent(string)
    return fetch(`data:text/plain;charset=utf-8,${encoded}`).then(r => r.blob())
  }
  
  /* 
    lively.files.stringToBlob("hello world").then(b => lively.files.readBlobAsText(b))
   */ 
  static readBlobAsText(fileOrBlob) {
    return new Promise(resolve => {        
      const reader = new FileReader();
      reader.onload = event => {
        resolve(event.target.result)
      }
      reader.readAsText(fileOrBlob); 
    })
  }

  static readBlobAsDataURL(fileOrBlob) {
    return new Promise(resolve => {        
      const reader = new FileReader();
      reader.onload = event => {
        resolve(event.target.result)
      }
      reader.readAsDataURL(fileOrBlob); 
    })
  }  
  
  static get versionHistoriesLoaded() {
    if (!this._versionHistoriesLoaded) this._versionHistoriesLoaded = new Map();
    return this._versionHistoriesLoaded
  }
  
  static async loadVersions(url, cached) {
    
    var useCached  = cached || false;
    // Fuck... some custom clever chaching logic? Should we generalize it?
    if (cached === undefined) {
      var maxCacheTime = 1000 * 60 * 5; // 5min in ms
      var lastLoaded = this.versionHistoriesLoaded.get(url)
      if (lastLoaded && ((Date.now() - lastLoaded)  < maxCacheTime)) {
        useCached = true
        // lively.notify("use cached version history")
      } else {
        this.versionHistoriesLoaded.set(url, Date.now())
        // lively.notify("update version history")
      }
    } else if (!cached) {
        this.versionHistoriesLoaded.set(url, Date.now())
    }
    
    var versionscache = await caches.open("file_versions")
    if (cached) {
      var resp = await versionscache.match(url)
      if (resp) return resp      
    }
    resp = await fetch(url, {
      method: "OPTIONS",
      headers: {
         showversions: true   
      }      
    })
    versionscache.put(url, resp.clone())
    return resp
  }
  
  
  static async _sortIntoFileTree(root, path, element) {
    // console.log("sort into " + path + " " + element.name )
    var next = path.shift()
    if (!next) {      
      root.children.push(element)
      return
    }
    var dir = root.children.find(ea => ea.name == next)
    if (!dir) {
      dir = {
        name: next,
        children: []
      }
      root.children.push(dir)
    }
    this._sortIntoFileTree(dir, path, element)
  }
  
  static async fileTree(url) {
    var tree = {
      name: url,
      children: []
    }
    var list = (await fetch(url, {
      method: "OPTIONS",
      headers: {
        filelist: true
      }
    }).then(r => r.json())).contents
    if (!list) return;
    
    for(var ea of list) {
      if (ea.name !== ".") {
        var path = ea.name.replace(/^\.\//,"").replace(/[^/]*$/,"").split("/").filter(ea => ea)
        var absolute = ea.name.replace(/^\.\//, url)
        var element = {
            name: ea.name.replace(/.*\//,""),
            modified: ea.modified,
            url: absolute,
            size: ea.size,
            type: ea.type
          }
        if (element.type == "directory") element.children = [];
        this._sortIntoFileTree(tree, path, element)        
      }
    }
    return tree
  }
  
  // Files.visualizeFileTreeMap(lively4url )
  static async visualizeFileTreeMap(url) {
    var tree = await lively.files.fileTree(url)
    if (tree) {
      lively.openComponentInWindow("d3-treemap").then( async tm => {
        tm.setTreeData(tree)
      })
    } else {
      lively.notify("Could not create tree for " + url)
    }
  }
  
  static isVideo(url) {
    return url.toString().match(/((ogm)|(m4v)|(mp4)|(mov)|(avi)|(flv)|(mpe?g)|(mkv)|(ogv))$/i)
  }
  
  static isAudio(url) {
    return url.toString().match(/((mp3)|(m4a)|(ogg))$/i)
  }

  static isPicture(url) {
    return url.toString().match(/((svg)|(png)|(jpe?g)|(gif))$/i)
  }
  
  static async generateMarkdownFileListing(root) { 
    var anchors = Array.from(root.querySelectorAll("a"))
    var imgs = Array.from(root.querySelectorAll("[src]"))
    
    var links = anchors.map(ea => ea.getAttribute("href")).filter(ea => !ea.match(/search:/)).concat(
          imgs.map(ea => ea.getAttribute("src")))
    
    var result = document.createElement("div")

    var source = "" // the generated markdown source that should be added
    var fileNames = [];

    var list = document.createElement("ul")
    var url = ("" + lively.query(root, "lively-container").getURL()).replace(/[^/]+$/,"");
    
    var files = (await fetch(url, {
      method: "OPTIONS"
    }).then(r => r.json())).contents
    files.forEach(ea => {
      // var item = document.createElement("li")
      var name =  ea.type == "directory" ? 
        ea.name + "/" :
        ea.name
      
      var ref = name.replace(/ /g, "%20")
      if (name == "index.md") return // don't include yourself
      
      fileNames.push(ref)
      // item.textContent = name
      if (!links.includes(ref)) {
        // list.appendChild(item)  
        source += `  - [${name}](${ref})\n`
      }
    })

    links.filter(ea => !fileNames.includes(ea) && !ea.match("/")).forEach(ea => {
      var item = document.createElement("li")
       if (ea == "index.md") return // don't include yourself
      item.textContent = "Missing " + ea
      list.appendChild(item)
    })
    result.appendChild(list)

    var code = document.createElement("pre")
    code.textContent = source.length > 0 ? "## Please Insert Me\n" + source : ""
    result.appendChild(code)

    return result
  }
  
  static async checkoutGithubFile(url) {
    return await this.withSynctoolDo(async (syncTool, respository, branch, path ) => {
      var serverURL = syncTool.getServerURL()    
      if (!url.match(serverURL)) { // we are in a checked out repo....
        return undefined // not information for files we do not manage...
      }
      return await syncTool.gitControl("checkout", undefined, {
        gitfilepath: path.replace(/^\//,"") // no leading / expected....
      })
    }, url) 
  }

  static async withSynctoolDo(func, url) {     
    // #Idea, could't we ask the server for this set directly, since we ask it indirectly anyway? as special OPTIONS request #TODO
    try {
      var container = <div style="display:none"></div> // hide the uglyness, at least in the UI
      document.body.appendChild(container)
      var syncTool = await lively.create("lively-sync", container); // #Hack #Ugly
      
      var serverURL = this.serverURL(url) 
      if (!serverURL) return
      syncTool.setServerURL(serverURL) 

      var m = url.replace(serverURL,"").replace(/^\//,"").match(/([^/]*)(\/*.*)/)
      var repository = m[1]
      var path = m[2]
      console.log("set repository: "  + repository)
      syncTool.setRepository(repository)
      await syncTool.updateLoginStatus()
      var branch = syncTool.getBranch()
      return await func(syncTool, repository, branch, path)
    } finally {
      container.remove() // we really opened a graphical object for this
    }
  }
  
  static async unzip(url) {
    var blob = fetch(url).then(r => r.blob())
    return  JSZip.loadAsync(blob)
  }
  
  
  static async githubFileInfo(url) {
    return await this.withSynctoolDo(async (syncTool, respository, branch, path ) => {
      var serverURL = syncTool.getServerURL()      
      var remoteURL = await syncTool.gitControl("remoteurl")
      remoteURL = remoteURL.replace(/\n/,"")
      
      var userAndRepository = remoteURL.replace(/https:\/\/github.com\//,"").replace(/git@github.com:/,"").replace(/\.git/,"")
      var [user, repo] = userAndRepository.split("/")
      
      var result =  {
        url,
        user,
        repo,
        serverURL,
        respository,
        path: path && path.replace(/^\//,""),
        remoteURL,
        branch,
        rawURL: remoteURL + "/raw/" + branch + path
      }
      
      if (!remoteURL || !branch || !path) {
        console.warn("Github fileInfo not complete: " + JSON.stringify(result))
        return null
      }
      
      return result  
    }, url) 
  }
  
  static getEnding(path) {
    return path.toString().replace(/[#?].*/,"").replace(/.*\./,"");
  }
  
  
  static serverURL(url) {
    // #TODO to replace this static list, we could add this info OPTION requests... 
    
  
    var knownServers = [
      lively4url.replace(/\/[^/]+$/,""),
      "https://lively-kernel.org/voices",
      "https://lively-kernel.org/research",
      "https://lively-kernel.org/lively4S2",
      "https://lively-kernel.org/lively4",
      "http://localhost:9005",
      "http://localhost:9006",
    ]
    
    for(var ea of knownServers) {
      if (url.startsWith(ea)) {
        return ea        
      }
      
    }
    return null // don't know?
  }

  static repositoryName(url) {  
    var serverURL = this.serverURL(url)
    if (!serverURL) return null
    var repo =  url.replace(serverURL +"/", "").replace(/\/.*/,"");
    return repo
  }
  
  static async setURLAsBackground(url) {
    document.querySelectorAll("lively-background").forEach(ea => ea.remove())

    var back = await (<lively-background class="lively-content" ></lively-background>) 
    document.body.appendChild(back)
    back.url = url
  }
  
  
  /*MD ## Git Infos MD*/
  static hasGitMergeConflict(source) {
    return source.match(/<<<<<<<(.|\n)*=======(.|\n)*>>>>>>>/m)
  }
  
  static extractGitMergeConflictVersions(sourceWithConflict) {
     var versions = _.uniq(sourceWithConflict.split("\n")
      .filter(ea => ea.match(/^(<<<<<<<)|(>>>>>>>) /))
      .map(ea => ea.replace(/^(<<<<<<<)|(>>>>>>>) /, "")))
     return versions
  }
  
  
  
  
}




