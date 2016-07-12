'use strict';

import Morph from './Morph.js';
import * as search from '../../src/client/search/search.js';

export default class SearchWidget extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.configButton = this.getSubmorph("#configButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");
    this.spinner = this.getSubmorph(".fa-spinner");
    this.noResults = this.getSubmorph("#noResults");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked(); });
    this.configButton.addEventListener("click", (evt) => { this.configButtonClicked(); });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt); });

    $(this.spinner).hide();

    this.hide();
  }

  searchButtonClicked() {
    let query = this.searchField.value;
    this.search(query);
  }

  configButtonClicked() {
    var comp  = document.createElement("lively-index-manager");
    return lively.components.openInWindow(comp);
  }

  searchFieldKeyup(evt) {
    // enter
    if (evt.keyCode == 13) {
      let query = this.searchField.value;
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
    this.searchField.focus();
    this.searchField.setSelectionRange(0, this.searchField.value.length);
    return true;
  }

  getLabel(str) {
    // shorten the string
    return str.length < 60 ? str : str.slice(0,15) + " [...] " + str.slice(-40);
  }

  search(query, triggeredByShow=false) {
    // Search was triggered by the shortcut, but the selection hasn't changed
    if (triggeredByShow && this.searchField.value == query) return;

    console.log(`[Search] searching for '${query}'`);


    // In case the search was opened by keyboard shortcut
     this.searchField.value = query;

    // Clear search results
    this.searchResults.show([]);

    $(this.noResults).hide();
    $(this.spinner).show();

    let results = [];
    let searchPromises = search.search(query);

    searchPromises.forEach(prom => {
      prom.then(newResults => {
        newResults.forEach(res => {
          res.label = this.getLabel(res.path);
        });

        // Update search results
        results = results.concat(newResults);
        this.searchResults.show(results, query);
        $(this.spinner).hide();
      });
    });
    
    Promise.all(searchPromises).then(r => {
      if (results.length == 0) $(this.noResults).show();
    });
  }
}
