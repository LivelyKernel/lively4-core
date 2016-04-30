'use strict';

import Morph from './Morph.js';

export default class Search extends Morph {
  initialize() {
    this.windowTitle = "File Search"
    var container = this.q(".container");
    lively.html.registerButtons(this)
    lively.html.registerInputs(this)
    
    lively.addEventListener("lively-search", this.q('#searchInput'), "keyup",
      (evt) => { 
        if(evt.keyCode == 13) { 
          try {
            this.onSearchButton() 
          } catch(e) {
            console.error(e)
          }
        }
      })
      
    var search = this.getAttribute("search")
    if(search) {
      this.q("#searchInput").value = search
      this.searchFile()
    }
  }

  // #TODO pull into Morph?  
  q(selector) {
    return this.shadowRoot.querySelector(selector)
  }
  
  // #TODO into Morph or Tool
  clearLog(s) {
    this.q("#searchResults").innerHTML=""
  }

  browseSearchResult(url, pattern) {
    var comp = document.createElement("lively-container");
    lively.components.openInWindow(comp).then(function (win) {
        comp.editFile(url).then( () => {
          comp.getAceEditor().editor.find(pattern)  
        })
        
    });
  }

  log(s) {
    
    s.split(/\n/g).forEach( entry => {
      
      var m = entry.match(/^([^:]*):(.*)$/)
      if (!m) return 
      var file = m[1]
      var pattern = m[2]
      var url = lively4url + "/../" + this.q("#rootInput").value + "/" + file
      var item = document.createElement("li")
      var link = document.createElement("a")
      link.innerHTML = file
      link.href = entry
      link.onclick = () => {
        this.browseSearchResult(url, pattern)
        return false;
      }
      var text = document.createElement("span")
      text.classList.add("pattern")
      text.innerHTML = pattern
      item.appendChild(link)
      item.appendChild(text)
      this.q("#searchResults").appendChild(item)
    })
  }

  async onSearchButton() {
      this.setAttribute("search", this.q("#searchInput").value);
      this.searchFile();
  }
  
  getSearchURL() {
    if (document.location.host == "livelykernel.github.io")
      return "https://lively-kernel.org/lively4/_search/files";
    else
      return lively4url + "/../_search/files";
  }
  
  searchFile(text) {
    if (text) {
      this.setAttribute("search", text); // #TODO how to specify data-flow / connections...
      this.q("#searchInput").value = text
    }
    
    console.log("search")
    // if (this.searchInProgres) return;
    this.searchInProgres = true
    this.clearLog()
    var search = this.q("#searchInput").value
    if (search.length < 3) {
      this.searchInProgres = false 
      return // this.log("not searching for " + search)
    } 
    this.log("searching for " + search)
    
    
    fetch(this.getSearchURL(), {
      headers: new Headers({ 
  	   "searchpattern": search,
  	   "rootdir": this.q("#rootInput").value,
    })}).then(r => r.text()).then( t => {
      this.searchInProgres = false 
      this.clearLog()
      this.log(t)
    })
  }
  
}
