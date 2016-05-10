'use strict';

import Morph from './Morph.js';
import { search as githubSearch } from '../../src/client/search/github-search.js';
import * as dbSearch from '../../src/client/search/dropbox-search.js';

export default class SearchBar extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.setupButton = this.getSubmorph("#setupButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked() });
    this.setupButton.addEventListener("click", (evt) => { this.setup() });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt) });

    this.searchableMounts = {
      "dropbox": [],
      "github": []
    };

    this.setup();
  }

  async setup() {
    this.findAvailableMounts();
    // some dummy index
    this.lunrIdx = await dbSearch.loadSearchIndex("https://lively4/dropbox/lively-search/lively4-core/src/client/index.l4idx");
  }

  searchButtonClicked() {
    let query = this.searchField.value;
    this.search(query);
  }

  searchFieldKeyup(evt) {
    // enter
    if (evt.keyCode == 13) {
      let query = this.searchField.value;
      this.search(query);
    }
  }

  isSearchEnabled(path) {
    return this.getSubmorph(`input[data-path='${path}']`).checked;
  }

  async search(query) {
    console.log("[Search] searching for '" + query + "'");

    // let dbFileNames = await dbSearch.getSearchableFileNames(this.searchableMounts.dropbox[0].options);
    // console.log(JSON.stringify(dbFileNames));

    let results = []
    
    for (let mountType in this.searchableMounts) {
      let mounts = this.searchableMounts[mountType];
      for (let i in mounts) {
        let mount = mounts[i];
        if (this.isSearchEnabled(mount.path)) {
          results = results.concat(await mount.find(query, mount.options));
          // update search results
          this.searchResults.show(results, query);
        }
      }
    }

    this.searchResults.show(results, query);
  }

  findAvailableMounts() {
    $.ajax({
        url: "https://lively4/sys/mounts",
        type: 'GET',
        success: (text) => {
          var mounts = JSON.parse(text);
          console.log(mounts);
          var mountsList = this.getSubmorph("#mounts-list");
          mountsList.innerHTML = "";
          mounts.forEach(mount => {
            let enabled = this.searchableMounts[mount.name];
            mountsList.innerHTML += `
              <li ${enabled ? '' : 'class="disabled"'}>
                <input data-path='${mount.path}' type='checkbox' ${enabled ? 'checked' : 'disabled'}> ${mount.path} (${mount.name})
              </li>`;
          });

          this.searchableMounts.dropbox = mounts.filter(mount => { return mount.name == "dropbox" }).map((mount) => {
            mount.find = (query) => {
              if (this.lunrIdx) {
                console.log("[search] done with lunr");
                return this.lunrIdx.search(query).map(res => { res.path = res.ref; return res; });
              }
              return [];
            }
            return mount;
          });

          this.searchableMounts.github = mounts.filter(mount => { return mount.name == "github" }).map((mount) => {
            mount.find = githubSearch;
            return mount;
          });
        },
        error: function(xhr, status, error) {
          console.log("could not get list of mounts for searching: " + error);
        }
      });
  }
}
