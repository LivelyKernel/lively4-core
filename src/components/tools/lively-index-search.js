"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js"
import _ from 'src/external/lodash/lodash.js'
import Strings from "src/client/strings.js"


export default class IndexSearch extends Morph {
  initialize() {
    this.windowTitle = "File Search";
    this.registerButtons();
    this.get("lively-separator").toggleCollapse()
    // this.get("lively-editor").hideToolbar();
    
    lively.html.registerInputs(this);
    
    var onScopeOrSearchInputEnter = (evt) => { 
      if(evt.code == "Enter") { 
        this.onSearchButton(); 
      }
    }
    this.get("#searchInput").addEventListener("keyup", onScopeOrSearchInputEnter);
    this.get("#scopeInput").addEventListener("keyup", onScopeOrSearchInputEnter);
    
    /* #ActiveExpression #Example
    this.events = {}
    this.get("#searchInput").addEventListener("keyup", evt => {
      this.events.searchInputKeyUp = evt; 
      this.events.searchInputKeyUp = null
    });
    this.get("#scopeInput").addEventListener("keyup", evt => {
      this.events.scopeInputKeyUp = evt;
      this.events.scopeInputKeyUp = null      
    });
    
    
    aexpr(() => this.events.scopeInputKeyUp || this.events.searchInputKeyUp).onChange(evt => {
      if(evt && evt.code == "Enter") { 
        this.events.scopeInputEnter = evt 
        this.events.scopeInputEnter = null
      }
    });

    aexpr(() => this.events.scopeInputKeyUp || this.events.searchInputKeyUp).onChange(evt => {
      if(evt && evt.code == "Enter") { 
        this.events.inputEnter = evt 
        this.events.inputEnter = null
      }
    });

    aexpr(() => this.events.inputEnter).onChange(evt => {
      this.onSearchButton();
    });
    */
    
    aexpr(() => this.get("#scopeInput").value).onChange(v => this.scope = v);
    aexpr(() =>  this.scope).onChange(v => this.get("#scopeInput").value = v);
      
    var search = this.getAttribute("search");
    if(search) {
      this.get("#searchInput").value = search;
      this.searchFile();
    }
  }
  

  focus() {
    this.get("#searchInput").focus();
  }
  clearLog(s) {
    this.get("#searchResults").innerHTML="";
  }

  get mode() {
    return this.getAttribute("mode");
  }
  
  set mode(mode) {
    return this.setAttribute("mode", mode);
  }
  
  get scope() {
    return this.getAttribute("scope");
  }
  
  set scope(scope) {
     return this.setAttribute("scope", scope);
  }

  
  onReplaceModeButton() {
    if (this.mode == "replace") {
      this.mode = undefined
    } else {
      this.mode = "replace"      
    }
  }
  
  
  async showSearchResult(url, lineAndColumn) {
    var editor =  this.get("#editor")
    
    // unhide editor, when it is needed
    if (editor.style.flexGrow < 0.01) { // #Hack
      this.get("lively-separator").toggleCollapse()    
    }
    
    editor.setURL(url)
    await editor.loadFile()
    
    var codeMirror = await editor.awaitEditor()
    codeMirror.setSelection(
      {line: lineAndColumn.line, ch: lineAndColumn.column},
      {line: lineAndColumn.line, ch: lineAndColumn.column + 
        (lineAndColumn.selection ? + lineAndColumn.selection.length : 0)})
    codeMirror.focus()
    codeMirror.scrollIntoView(codeMirror.getCursor(), 200)
    
    
  }

  browseSearchResult(url, pattern) {
    return lively.openBrowser(url, true, pattern, undefined, /* lively.findWorldContext(this)*/);
  }

  onSearchResults(list, search) {
    list = _.sortBy(list, ea => ea.url)
    let lastPrefix
    for (var ea of list) {
      let pattern = ea.text;
      let url = ea.url;
      let item = document.createElement("tr");
      let filename = ea.file.replace(/.*\//,"")
      let dirAndFilename = ea.url.replace(/.*\/([^/]+\/[^/]+$)/,"$1")
      let prefix = url.replace(dirAndFilename, "")
      if (lastPrefix != prefix) {
         this.get("#searchResults").appendChild(<tr class="prefix"><td colspan="3" click={() => {
                 this.scope = prefix
                 this.searchFile()
               }}>{prefix}</td></tr>);
      }
      lastPrefix = prefix
      let path = ea.url.replace(this.serverURL(),"")
      let lineAndColumn = {
        line: ea.line, 
        column: ea.column,
        selection: ea.selection }
      
      item.innerHTML = `<td class="filename"><a>${dirAndFilename.slice(0,60)}</a></td>
        <td class="line">${ea.line + 1}:</td>
        <td><span ="pattern">${
    
        pattern
          .replace(/</g,"&lt;")
          .replace(new RegExp("(" +search + ")"), "<b>$1</b>") 
  
      }</span></td>`;
      let link = item.querySelector("a");
      link.setAttribute("href", ea.url);
      link.title = ea.file
      link.onclick = (evt) => {
        if (evt.shiftKey || evt.ctrlKey) {
          this.browseSearchResult(url, lineAndColumn);
        } else {
          this.showSearchResult(url, lineAndColumn);
        }
        return false;
      };
      this.get("#searchResults").appendChild(item);
    }
  }

  async searchAndReplace(pattern, replace) {
    this.mode = "replace"
    // #TODO refactor
    this.get("#searchInput").value = pattern
    this.setAttribute("search", pattern);
    this.get("#replaceInput").value = replace
    
    await this.searchFile()
    await this.replaceInFiles(pattern, replace)
  }
  
  async replaceInFiles(pattern, replace) {
    if(this.searchInProgres || !this.files) {
      this.log("please search files first")
      return
    }
    let toReplace = []
    let regex = new RegExp(pattern, "g")
    for (let url of this.files.map(ea => ea.url).uniq()) {
      let getRequest = await fetch(url)
      let lastVersion = getRequest.headers.get("fileversion")
      let contents = await getRequest.text()
      let newcontents = contents.replace(regex, replace)
      if (contents == newcontents) {
        this.log("pattern did not match " + pattern) 
      }
      toReplace.push({url: url, lastversion: lastVersion, oldcontent: contents, newcontent: newcontents})
    }
  
    if (!await lively.confirm("Replace <b>" + pattern + "</b> with <b>" + replace + "</b> in " + toReplace.length + " files?" +
                             `<ul style="font-size: 10pt">${
                                toReplace.map(ea => "<li>" 
                                              + ea.url.replace(/.*\//,"") 
                                              + " (" + Strings.matchAll(regex, ea.oldcontent).length + " occurence(s))"
                                              + "</li>").join("")
                              }<ul>`))  {
      lively.warn("replacing files canceled")
      return 
    }
    this.clearLog()
    for (var ea of toReplace) {
      let url = ea.url
      let headers = {}
      if (ea.lastVersion) {
        headers.lastversion = ea.lastVersion
      }
      let putRequest = await fetch(url, {
        method: "PUT",
        body: ea.newcontent,
        headers: headers
      })
             
      var item = <tr>
            <td>replaced</td>
            <td class="filename">
              <a click={(evt) => {
                evt.preventDefault(); 
                this.browseSearchResult(url, replace)}
               } href={url}>{url.replace(/.*\//,"")}</a></td>
            <td><b>{pattern}</b></td>
            <td>with</td>
            <td><b>{replace}</b></td>
          </tr>;
      this.get("#searchResults").appendChild(item);
    
      if (putRequest.status == 200) {
        // #Idea: show diff?
        lively.notify("Replaced in " + url)
      } else {
        lively.warn("could not change " + url + ", because " + putRequest )
      }  
    }
  }
  
  onSearchButton() {
    this.setAttribute("search", this.get("#searchInput").value);
    this.searchFile();
  }
  
  onReplaceButton() {
    this.replaceInFiles(
      this.get("#searchInput").value,
      this.get("#replaceInput").value)
  }
  
  onEnableReplaceButton() {
    if (this.getAttribute("replace") == "true") {
      this.setAttribute("replace", "false")
    } else {
      this.setAttribute("replace", "true")
    }
  }
  
  onScopeModeButton() {
    if (this.scope) {
      this.removeAttribute("scope")
    } else {
      this.scope = lively4url
    }
  }

  async searchFile(text) {
    this.clearLog()
    if (text) {
      this.setAttribute("search", text); // #TODO how to specify data-flow / connections...
      this.get("#searchInput").value = text;
    }
    // if (this.searchInProgres) return;
    var search = this.get("#searchInput").value;
    if (search.length < 2) {
      this.log("please enter a longer search string");
      this.searchInProgres = false;
      return; 
    }
    this.clearLog();
    this.get("#searchResults").innerHTML = "searching ..." + JSON.stringify(search);
    let start = Date.now();
    var list = await this.searchFilesList(search )
    this.searchInProgres = false;
    this.clearLog();
    //this.log('found');
    this.log(`finished in ${Date.now() - start}ms`);
    return this.onSearchResults(list, search);
  }

  serverURL() {
     return lively4url.replace(/[^/]*$/,"")
  }
  
  
  /*
   * find all root directories/repositories that should be search by looking, what browsers/editors the user has opened
   */ 
  findRootsInBrowsers() {
    var browsers = document.body.querySelectorAll("lively-container")
    var urls = browsers.map(ea => ea.getPath())
    var serverURL =  this.serverURL()
    var rootURLs = urls.filter(ea => ea.match(serverURL)).map(ea => {
      var m = ea.match(new RegExp("(" + serverURL + "[^/]*/).*"))
      return m && m[1]
    })
    return _.uniq(rootURLs)
  }
  
  async searchFilesList(pattern) {
    this.searchInProgres = true;
    
    var search = new RegExp(pattern)
    var result = []
    var scope = this.scope
    var searchTime = await lively.time(async () => {
      var root = lively4url; // there are other files in our cache... too 
      var roots = [root].concat(lively.preferences.get("ExtraSearchRoots")).concat(this.findRootsInBrowsers())
      return FileIndex.current().db.files.each(file => {
        if (roots.find(eaRoot => file.url.startsWith(eaRoot)) && file.content && (!scope || file.url.match(scope))) {
          var m = file.content.match(search)
          if (m) {
            result.push({file: file, match: m})
          }
        }
      })  
    })
    
    var list = []
    result.forEach( ea => {
      console.log("found " + ea.file.url)
      var lines = ea.file.content.split("\n")
      lines.forEach((eaLine, index) => {
        var m = eaLine.match(pattern)
        if (m) {
          var lineNumber = index
          // var lineNumber = index + 1 // first line is "1"
          list.push({
            file: ea.file.url.toString().replace(/[.*\/]/,""), 
            url: ea.file.url.toString(),
            line: lineNumber,
            column: m.index,
            text: eaLine,
            selection: m[0]
          })          
        }
      })
    })
    this.files = list
    this.searchInProgres = false;
    return list
  }

  log(s) {
    var entry = <tr><td class="logentry" colspan="2">{s}</td></tr>
    this.get("#searchResults").appendChild(entry)
  }
  
 
  livelyMigrate(other) {
    this.get("#searchInput").value =  other.get("#searchInput").value
    this.get("#replaceInput").value =  other.get("#replaceInput").value

  }
  
}
