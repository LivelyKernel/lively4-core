'use strict';

import Morph from './Morph.js';
import * as search from 'src/external/lively4-search/client/search.js';

import lively from "src/client/lively.js"

export default class SearchWidget extends Morph {

  initialize() {
    lively.addEventListener("SearchWidget", this.getSubmorph("#searchField"), 
      "keyup", (evt) => { this.searchFieldKeyup(evt)});
    
    lively.html.registerButtons(this)
    
    this.getSubmorph("#searchSpinner").style.display  = "none"
    this.getSubmorph("#searchResults-github").style.display  = "none"

    this.hide();
  }

  onSearchButton() {
    let query = this.getSubmorph("#searchField").value;
    this.search(query);
  }

  onConfigButton() {
    var comp  = document.createElement("lively-index-manager");
    return lively.components.openInWindow(comp);
  }

  onCloseButton() {
    this.hide()
  }

  get query() {
    return this.getSubmorph("#searchField").value
  }
  
  set query(s) {
    return this.search(s)
  }
  
  get isVisible() {
    return this.style.display != "none"
  }

  set isVisible(bool) {
    if (bool)
      this.style.display = "block"
    else
      this.style.display = "none"
  }

  searchFieldKeyup(evt) {
    // enter
    if (evt.keyCode == 13) {
      let query = this.getSubmorph("#searchField").value;
      this.search(query);
    }
  }

  hide() {
    $(this).hide();
  }

  toggle() {
    if ($(this).is(":visible")) {
      this.hide();
      return false;
    }
    $(this).show();
    this.getSubmorph("#searchField").focus();
    this.getSubmorph("#searchField").setSelectionRange(0, this.getSubmorph("#searchField").value.length);
    return true;
  }

  getLabel(str) {
    // try to cut off host
    try {
      let u = new URL(str);
      str = u.pathname;
    } catch (error) {
      // no host to cut off
    }
    // shorten the string
    return str.length < 60 ? str : str.slice(0,15) + " [...] " + str.slice(-40);
  }

  search(query, triggeredByShow=false) {
    // Search was triggered by the shortcut, but the selection hasn't changed
    if (triggeredByShow && this.getSubmorph("#searchField").value == query) return;

    console.log(`[Search] searching for '${query}'`);


    // In case the search was opened by keyboard shortcut
     this.getSubmorph("#searchField").value = query;

    // Clear search results
    this.getSubmorph("#searchResults").show([]);
    // this.getSubmorph("#searchResults-github").show([]);

    $(this.getSubmorph("#noResults")).hide();
    $(this.getSubmorph("#searchSpinner")).show();
    $(this.getSubmorph("#noResults-github")).hide();
    // $(this.getSubmorph("#searchSpinner-github")).show();

    let results = [];
    let resultsGithub = [];
    let searchPromises = search.search(query);

    searchPromises.forEach(prom => {
      prom.then(newResults => {
        newResults.forEach(res => {
          res.label = this.getLabel(res.path);
        });
        
        newResults = newResults.filter(ea => ! ea.path.match(/node_modules/))
        // newResults = newResults.filter(ea => ! ea.path.match(/src\/external/))

        // Update search results
        if (newResults.length && newResults[0].type == "github") {
          resultsGithub = resultsGithub.concat(newResults);
          this.getSubmorph("#searchResults-github").show(resultsGithub, query);
          $(this.getSubmorph("#searchSpinner-github")).hide();
        } else {
          results = results.concat(newResults);
          this.getSubmorph("#searchResults").show(results, query);
          $(this.getSubmorph("#searchSpinner")).hide();
        }
      });
    });

    Promise.all(searchPromises).then(r => {
      $(this.getSubmorph("#searchSpinner-github")).hide();
      $(this.getSubmorph("#searchSpinner")).hide();
      if (results.length == 0) $(this.getSubmorph("#noResults")).show();
      if (resultsGithub.length == 0) $(this.getSubmorph("#noResults-github")).show();
    });
  }
}
