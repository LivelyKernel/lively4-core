'use strict';

import Morph from './Morph.js';
import * as githubSearch from '../../src/client/search/github-search.js';
import * as dropboxSearch from '../../src/client/search/dropbox-search.js';

export default class SearchBar extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.setupButton = this.getSubmorph("#setupButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked() });
    this.setupButton.addEventListener("click", (evt) => { this.setup() });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt) });

    this.githubSearch = githubSearch;
    this.dropboxSearch = dropboxSearch;

    this.searchableMounts = {
      "dropbox": [],
      "github": []
    };

    this.setup();
  }

  setup() {
    this.findAvailableMounts();
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

  enableSearch(path) {
     let checkbox = this.getSubmorph(`input[data-path='${path}']`);
     checkbox.checked = "true";
     checkbox.disabled = '';
     checkbox.parentNode.classList.remove("disabled");
  }

  search(query) {
    console.log(`[Search] searching for '${query}'`);

    // Clear search results
    this.searchResults.show([]);

    let results = []
    for (let mountType in this.searchableMounts) {
      let mounts = this.searchableMounts[mountType];
      for (let i in mounts) {
        let mount = mounts[i];
        if (this.isSearchEnabled(mount.path)) {
          mount.find(query, mount.options).then( (res) => {
            // Update search results
            results = results.concat(res);
            this.searchResults.show(results, query);
          });
        }
      }
    }
  }



  findAvailableMounts() {
    let mountRequest = new Request("https://lively4/sys/mounts")
    fetch(mountRequest).then(
      async (response) => {
        let mounts = await response.json();
        console.log(`[Search] found the following mounts: ${mounts}`);
        var mountsList = this.getSubmorph("#mounts-list");
        mountsList.innerHTML = "";
        mounts.forEach(mount => {
          mountsList.innerHTML += `
            <li class="disabled">
              <input data-path='${mount.path}' type='checkbox' disabled> ${mount.path} (${mount.name})
            </li>`;
        });

        mounts.forEach( (mount) => {
          if (this.searchableMounts[mount.name]) {
            let search = this[`${mount.name}Search`];

            // Call the searchs setup function
            search.setup(mount).then( () => {
              // After the setup bind the find function and enable the mounts checkbox
              mount.find = search.find;
              this.enableSearch(mount.path);
              this.searchableMounts[mount.name].push(mount);
            });
          }
        });

      }, (error) => {
        console.log(`[Search] could not get list of mounts for searching: ${error}`);
    });
  }
}
