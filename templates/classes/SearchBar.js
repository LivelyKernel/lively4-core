'use strict';

import Morph from './Morph.js';
import * as serverSearch from '../../src/client/search/server-search.js';
import * as githubSearch from '../../src/client/search/github-search.js';
import * as dropboxSearch from '../../src/client/search/dropbox-search.js';

export default class SearchBar extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked() });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt) });

    this.serverSearch = serverSearch;
    this.githubSearch = githubSearch;
    this.dropboxSearch = dropboxSearch;

    this.searchableMounts = {
      "server": [],
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
    checkbox.classList.remove("hidden");
    checkbox.checked = "true";
    checkbox.disabled = '';
     
    let li = checkbox.parentNode;
    li.classList.remove("disabled");
    
    // Remove spinner
    let spinner = li.querySelector("i");
    if (spinner) spinner.remove();
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

        // Add server mount
        mounts.push({
          path: lively4url,
          name: "server"
        });

        console.log(`[Search] found the following mounts: ${mounts}`);
        var mountsList = this.getSubmorph("#mounts-list");
        mountsList.innerHTML = "";
        mounts.forEach(mount => {
          let searchable = this.searchableMounts[mount.name];
          mountsList.innerHTML += `
            <li class="disabled">
              ${(searchable) ? '<i class="fa fa-spinner fa-pulse"></i>' : ''}
              <input data-path='${mount.path}' type='checkbox' ${(searchable) ? 'class="hidden"' : ''} disabled>
              ${mount.path} (${mount.name})
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
