'use strict';

import Morph from './Morph.js';
import lively from 'src/client/lively.js';

export default class Search extends Morph {
  initialize() {
    this.windowTitle = "File Search";
    var container = this.get(".container");
    lively.html.registerButtons(this);
    lively.html.registerInputs(this);
    
    this.shadowRoot.querySelector("#rootsInput").value = lively4url.replace(/.*\//,"");
    
    lively.addEventListener("lively-search", this.get('#searchInput'), "keyup", (evt) => { 
        if(evt.keyCode == 13) { 
          try {
            this.onSearchButton(); 
          } catch(e) {
            console.error(e);
          }
        }
    });
      
    var search = this.getAttribute("search");
    if(search) {
      this.get("#searchInput").value = search;
      this.searchFile();
    }
  }

  clearLog(s) {
    this.get("#searchResults").innerHTML="";
  }

  browseSearchResult(url, pattern) {
    return lively.openBrowser(url, true, pattern);
  }

  log(s) {
    s.split(/\n/g).forEach( entry => {
      
      var m = entry.match(/^([^:]*):(.*)$/);
      if (!m) return ;
      var file = m[1];
      var pattern = m[2];
      var url = lively4url + "/../" + file;
      var item = document.createElement("tr");
      item.innerHTML = `<td><a>${file}</a></td><td><span ="pattern">${pattern}</span></td>`;
      var link = item.querySelector("a");
      link.href = entry;
      link.onclick = () => {
        this.browseSearchResult(url, pattern);
        return false;
      };
      this.get("#searchResults").appendChild(item);
    });
  }

  onSearchButton() {
      this.setAttribute("search", this.get("#searchInput").value);
      this.searchFile();
  }
  
  getSearchURL() {
    return "https://lively-kernel.org/lively4S2/_search/files" // #DEV
    if (document.location.host == "livelykernel.github.io")
      return "https://lively-kernel.org/lively4/_search/files";
    else
      return lively4url + "/../_search/files";
  }
  
  searchFile(text) {
    if (text) {
      this.setAttribute("search", text); // #TODO how to specify data-flow / connections...
      this.get("#searchInput").value = text;
    }
    // if (this.searchInProgres) return;
    this.searchInProgres = true;
    this.clearLog();
    var search = this.get("#searchInput").value;
    if (search.length < 3) {
      this.searchInProgres = false;
      return; // this.log("not searching for " + search)
    }
    fetch(this.getSearchURL(), {
      headers: { 
  	   "searchpattern": search,
  	   "rootdirs": this.get("#rootsInput").value,
  	   "excludes": this.get("#excludesInput").value,
    }}).then(r => r.text()).then( t => {
      this.searchInProgres = false;
      this.clearLog();
      this.log(t);
    });
  }
  
}
