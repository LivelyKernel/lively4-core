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
        if(evt.keyCode == 13) { this.onSearchButton() }
      })
  }

  // #TODO pull into Morph?  
  q(selector) {
    return this.shadowRoot.querySelector(selector)
  }
  
  // #TODO into Morph or Tool
  clearLog(s) {
    var editor= this.q("#log").editor
    if (editor) editor.setValue("")
  }

  log(s) {
    var editor = this.q("#log").editor
    if (editor) editor.setValue(editor.getValue() + "\n" + s)
  }

  async onSearchButton() {
    if (this.searchInProgres) return;
    this.searchInProgres = true
    this.clearLog()
    var search = this.q("#searchInput").value
    if (search.length < 3) {
      this.searchInProgres = false 
      return // this.log("not searching for " + search)
    } 
    this.log("searching for " + search)
    fetch("https://lively-kernel.org/lively4S2/_search/files", {
      headers: new Headers({ 
  	   "searchpattern": search,
  	   "rootdir": this.q("#rootInput").value,
    })}).then(r => r.text()).then( t => {
      this.searchInProgres = false 
      this.log(t)
    })
  }
  
}
