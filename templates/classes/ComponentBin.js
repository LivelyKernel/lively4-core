'use strict'

import Morph from './Morph.js';
import { statFile, loadFile } from '../../src/client/file-editor.js';
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
      // ugly as sh*t!
      // var currentLocation = window.lively4Url || (window.location.hostname === "localhost" ? "http://localhost:" + window.location.port + "/" : "https://lively4/");
      var currentLocation = window.location.hostname === "localhost" ? "http://localhost:" + window.location.port + "/lively4-core/" : "https://lively4/";
      var templatesUrl = currentLocation + "templates/";
      statFile(templatesUrl).then(response => {
        try {
          // depending in the content type, the response is either parsed or not,
          // github always returns text/plain
          response = JSON.parse(response);
        } catch (e) {
          // it was already json
        }

        var infoFilesPromises = response.contents.filter(file => {
          return file.type === "file" && file.name.slice(-5) === ".json";
        }).map(file => {
          return loadFile(templatesUrl + file.name)
        });

        Promise.all(infoFilesPromises).then(files => {
          // save the parsed list
          var componentList;
          // same issue as above with content type...
          try {
            componentList = files.map(JSON.parse);
          } catch (e) {
            componentList = files;
          }
          resolve(componentList);
        });
      }).catch(err => {
        console.log(err);
      });
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
