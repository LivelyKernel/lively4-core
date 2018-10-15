'use strict';

import Morph from 'src/components/widgets/lively-morph.js';
import lively from 'src/client/lively.js';


export default class Search extends Morph {
  initialize() {
    this.windowTitle = "File Search";
    var container = this.get(".container");
    this.registerButtons();
    lively.html.registerInputs(this);
    
    var roots = this.get("#rootsInput").value 
    if (!roots || roots == "") {
      this.get("#rootsInput").value = lively4url.replace(/.*\//,"");
    }

    ['#rootsInput', '#excludesInput', '#searchInput'].forEach(selector => {
      lively.addEventListener("lively-search", this.get(selector), "keyup", (evt) => { 
          if(evt.keyCode == 13) { 
            try {
              this.onSearchButton(); 
            } catch(e) {
              console.error(e);
            }
          }
      });
    });
      
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

  browseSearchResult(url, pattern) {
    return lively.openBrowser(url, true, pattern, undefined, /* lively.findWorldContext(this)*/);
  }

  onSearchResults(list) {
    for (var ea of list) {
      let pattern = ea.text;
      let url = ea.url;
      let item = document.createElement("tr");
      let filename = ea.file.replace(/.*\//,"")
      item.innerHTML = `<td class="filename"><a>${filename}</a></td><td><span ="pattern">${
        pattern.replace(/</g,"&lt;")}</span></td>`;
      let link = item.querySelector("a");
      link.href = ea.file;
      link.url = url
      link.title = ea.file
      var self = this
      link.onclick = () => {
        this.browseSearchResult(url, pattern);
        return false;
      };
      this.get("#searchResults").appendChild(item);
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
  
  getSearchURL() {
    // return "https://lively-kernel.org/lively4S2/_search/files" // #DEV
    if (document.location.host == "livelykernel.github.io")
      return "https://lively-kernel.org/lively4/_search/files";
    else
      return lively4url + "/../_search/files";
  }
  
  get searchRoot() {
    return this.get("#rootsInput").value
  }

  set searchRoot(value) {
    return this.get("#rootsInput").value = value
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
    var list = await this.searchFilesList(this.searchRoot, search, this.get("#excludesInput").value )
    this.searchInProgres = false;
    this.clearLog();
    //this.log('found');
    this.log(`finished in ${Date.now() - start}ms`);
    this.onSearchResults(list);
  }

  async searchFilesList(root, pattern, exclude) {
    this.searchInProgres = true;
    var result = await fetch(this.getSearchURL(), {
    headers:  { 
         "searchpattern": pattern,
         "rootdirs": root,
         "excludes": exclude,
      }
    }).then(r => r.text())
    var list = result.split("\n").map( ea => {
      console.log("ea " + ea)
      var line = ea.match(/([^:]*):(.*)/)
      return line && {
        file: line[1], 
        url: lively4url.replace(/[^/]*$/,"") + line[1],
        text: line[2] 
      }
    }).filter(ea => ea)
    this.files = list
    this.searchInProgres = false;
    return list
  }

  log(s) {
    var entry = <tr><td class="logentry" colspan="2">{s}</td></tr>
    this.get("#searchResults").appendChild(entry)
  }
  
  async replaceInFiles(pattern, replace) {
    this.clearLog()
    // var root = "https://lively-kernel.org/lively4/"
    // var pattern = "src/external/chai.js"
    // var replace = "src/external/chai.js"
    if(this.searchInProgres || !this.files) {
      this.log("please search files first")
    }
    for (var file of this.files) {
      let url = file.url
      let contents = await fetch(url).then(ea => ea.text())
      let newcontents = contents.replace(pattern, replace)
      let putRequest = await fetch(url, {
        method: "PUT",
        body: newcontents
      })
      this.log("replaced in " + pattern + " with "+ replace + " in " +url)
      if (putRequest.status == 200) {
        // #Idea: show diff?
        lively.notify("Replaced in " + file.file)
      } else {
        throw new Error("could not change " + file)
      }  
    }  
  }
  
  livelyMigrate(other) {
    this.get("#rootsInput").value =  other.get("#rootsInput").value
    this.get("#searchInput").value =  other.get("#searchInput").value
    this.get("#replaceInput").value =  other.get("#replaceInput").value
    this.get("#excludesInput").value =  other.get("#excludesInput").value
  }
  
}
