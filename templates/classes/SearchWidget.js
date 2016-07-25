'use strict';

import Morph from './Morph.js';
import * as search from 'src/external/lively4-search/client/search.js';

export default class SearchWidget extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.configButton = this.getSubmorph("#configButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");
    this.searchResultsGithub = this.getSubmorph("#searchResults-github");
    this.spinner = this.getSubmorph("#searchSpinner");
    this.spinnerGithub = this.getSubmorph("#searchSpinner-github");
    this.noResults = this.getSubmorph("#noResults");
    this.noResultsGithub = this.getSubmorph("#noResults-github");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked(); });
    this.configButton.addEventListener("click", (evt) => { this.configButtonClicked(); });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt); });

    $(this.spinner).hide();
    $(this.spinnerGithub).hide();

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
    if (triggeredByShow && this.searchField.value == query) return;

    console.log(`[Search] searching for '${query}'`);


    // In case the search was opened by keyboard shortcut
     this.searchField.value = query;

    // Clear search results
    this.searchResults.show([]);
    this.searchResultsGithub.show([]);

    $(this.noResults).hide();
    $(this.spinner).show();
    $(this.noResultsGithub).hide();
    $(this.spinnerGithub).show();

    let results = [];
    let resultsGithub = [];
    let searchPromises = search.search(query);

    searchPromises.forEach(prom => {
      prom.then(newResults => {
        newResults.forEach(res => {
          res.label = this.getLabel(res.path);
        });

        // Update search results
        if (newResults.length && newResults[0].type == "github") {
          resultsGithub = resultsGithub.concat(newResults);
          this.searchResultsGithub.show(resultsGithub, query);
          $(this.spinnerGithub).hide();
        } else {
          results = results.concat(newResults);
          this.searchResults.show(results, query);
          $(this.spinner).hide();
        }
      });
    });

    Promise.all(searchPromises).then(r => {
      $(this.spinnerGithub).hide();
      $(this.spinner).hide();
      if (results.length == 0) $(this.noResults).show();
      if (resultsGithub.length == 0) $(this.noResultsGithub).show();
    });
  }
}
