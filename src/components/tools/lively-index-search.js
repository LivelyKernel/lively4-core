"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js"
import _ from 'src/external/lodash/lodash.js'
import Strings from "src/client/strings.js"
import Bindings from "src/client/bindings.js"

/*MD # Search (and Replace) Tool MD*/

export default class IndexSearch extends Morph {
  async initialize() {
    this.windowTitle = "File Search";
    this.registerButtons();
    this.get("lively-separator").toggleCollapse()
    // this.get("lively-editor").hideToolbar();
    
    lively.html.registerInputs(this);
    
    this.registerAttributes(["pattern", "mode", "scope", "replace"])
    this.bindAttributeWithInputField("scope", this.get("#scopeInput"))
    this.bindAttributeWithInputField("pattern", this.get("#searchInput"))
    this.bindAttributeWithInputField("replace", this.get("#replaceInput"))
    
    this.registerSignalEnter(this.shadowRoot)
    this.get("#replaceInput").addEventListener("enter-pressed", () => this.onReplaceInputEnter());
    this.get("#searchInput").addEventListener("enter-pressed", () => this.onSearchButton());
    this.get("#scopeInput").addEventListener("enter-pressed", () => this.onSearchButton());
    
    // kick off search...
    if(this.pattern) {
      await this.search();
      
      if(this.replace) {
        await this.updateReplacePreview();
      }
    }
  }
  
  // #TODO pull up into own module, because of active expressions...
  bindAttributeWithInputField(name, inputField) {
    aexpr(() => inputField.value).onChange(v => this[name] = v);
    aexpr(() =>  this[name]).onChange(v => inputField.value = v);
    inputField.value = this[name] // force ui update
  }

  // #TODO pull up into morph
  registerAttributes(list) {
    for(let name of list) {
      this.registerAttribute(name)
    }
  }
  
  // #TODO pull up into morph #private
  registerAttribute(name) {
    Object.defineProperty(this, name, {
      get() { 
        return this.getAttribute(name); 
      },
      set(newValue) { 
        this.setAttribute(name, newValue)
      },
      enumerable: true,
      configurable: true
    });
  }

  /*MD ## HTML Element MD*/
  
  focus() {
    this.get("#searchInput").focus();
  }
  /*MD ## Events MD*/ 
  
  onScopeModeButton() {
    if (this.scope) {
      this.removeAttribute("scope")
    } else {
      this.scope = lively4url
    }
  }
  
  onSearchButton() {
    this.search();
  }
 
  onReplaceModeButton() {
    if (this.mode == "replace") {
      this.mode = undefined
    } else {
      this.mode = "replace"      
    }
  }

  onReplaceInputEnter() {
    this.updateReplacePreview()
  }
  
  onReplaceButton() {
    this.replaceInFiles()
  }
  /*MD ## Search MD*/
  
  async search(text) {
    this.clearLog()
    if (text) {
      this.pattern = text;
    }

    if (this.pattern.length < 2) {
      this.log("please enter a longer search string");
      this.searchInProgres = false;
      return; 
    }
    this.clearLog();
    
    // check regular expression syntax
    try {
      new RegExp(this.pattern)
    } catch(e) {
      this.log("" + e);
      return
    }
    
    this.get("#searchResults").innerHTML = "searching ..." + JSON.stringify(this.pattern);
    let start = Date.now();
    await this.searchFilesList()
    this.searchInProgres = false;
    this.clearLog();
    //this.log('found');
    this.log(`finished in ${Date.now() - start}ms`);
    await this.updateSearchResults();
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
  
  async searchFilesList(pattern=this.pattern) {
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



  // #important
  updateSearchResults(search=this.pattern) {
    var list = _.sortBy(this.files, ea => ea.url)
    let lastPrefix
    for (var ea of list) {
      let pattern = ea.text;
      let url = ea.url;
      let item = <tr></tr>;
      ea.item = item
      let filename = ea.file.replace(/.*\//,"")
      let dirAndFilename = ea.url.replace(/.*\/([^/]+\/[^/]+$)/,"$1")
      let prefix = url.replace(dirAndFilename, "")
      if (lastPrefix != prefix) {
         this.get("#searchResults").appendChild(<tr class="prefix"><td colspan="3" click={() => {
                 this.scope = prefix
                 this.search()
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
  
  /*MD ## Search and Replace MD*/

  async searchAndReplace(pattern, replace) {
    this.mode = "replace"
    this.pattern = pattern;
    this.replace = replace
    
    await this.search()
    await this.updateReplacePreview()
    await this.replaceInFiles()
  }
  
  // #important #refactor
  async replaceInFiles(pattern=this.pattern, replace=this.replace) {
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
  
  updateReplacePreview() {
    for (var file of this.files) {
      if (file.item) {
        file.item.querySelectorAll("#replace").forEach(td => td.remove());
        var replacedText = file.text
        var replacePreviewColumn = <td id="replace">{replacedText}</td>
        file.item.appendChild(replacePreviewColumn)
      }
    }    
  }
  
  
  /*MD ## Helper MD*/
  // #private
  log(s) {
    var entry = <tr><td class="logentry" colspan="2">{s}</td></tr>
    this.get("#searchResults").appendChild(entry)
  }
  
  clearLog(s) {
    this.get("#searchResults").innerHTML="";
  }
  
  // #private
  serverURL() {
     return lively4url.replace(/[^/]*$/,"")
  }

  /*MD ## Lively API MD*/
  livelyMigrate(other) {
   
  }
  
}
