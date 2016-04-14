'use strict'

import Morph from './Morph.js';
import files from '../../src/client/files.js';
import * as componentLoader from '../../src/client/morphic/component-loader.js';

export default class ComponentBin extends Morph {
  initialize() {
    this.loadComponentList().then((compList) => {
      this.createTiles(compList);
      this.showTiles(this.sortAlphabetically(this.componentList));
    });

    this.searchField = this.getSubmorph("#search-field");
    this.searchField.addEventListener('keyup', (e) => { this.searchFieldChanged(e) });
    this.searchField.addEventListener('focus', (e) => { e.target.select(); });
  }

  loadComponentList() {
    return new Promise((resolve, reject) => {
      var templatesUrl = lively4url + "/templates/";
      files.statFile(templatesUrl).then(response => {
        try {
          // depending in the content type, the response is either parsed or not,
          // github always returns text/plain
          response = JSON.parse(response);
        } catch (e) {
          // it was already json
        }

        resolve(response.contents.filter(file => {
            return file.type === "file" && file.name.match(/\.html$/);
          }).map(file => {
                    return {
            "name": file.name.replace(/\.html$/,"")
              .replace(/lively-/,"").replace(/-/g," "),
            "html-tag": file.name.replace(/\.html$/,""),
            "description": "",
            "author": "",
            "date-changed": "",
            "categories": ["default"],
            "tags": [],
            "template": file.name}
          }));
      })
    });
  }

  createTiles(compList) {
    this.componentList = compList.map((compInfo) => {
      var tile = document.createElement("lively-component-bin-tile");
      tile.setBin(this);
      tile.configure(compInfo);

      compInfo.tile = tile;

      return compInfo;
    });
  }

  showTiles(filteredCompList) {
    var list = this.getSubmorph(".tile-pane");

    // remove all tiles
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    filteredCompList.forEach((compInfo) => {
      list.appendChild(compInfo.tile);
    });
  }

  inWindow() {
    return this.getSubmorph("#open-in-checkbox").checked;
  }

  searchFieldChanged(evt) {
    var subList = this.findByName(this.searchField.value);
    subList = this.sortAlphabetically(subList);

    this.showTiles(subList);
  }

  sortAlphabetically(compList) {
    return compList.sort((a, b) => {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }

  findByName(string) {
    return this.componentList.filter((comp) => {
      return comp.name.toLowerCase().indexOf(string.toLowerCase()) >= 0;
    });
  }
}
