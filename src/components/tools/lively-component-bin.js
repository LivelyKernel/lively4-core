'use strict'

import Morph from 'src/components/widgets/lively-morph.js';
import files from 'src/client/files.js';
import * as componentLoader from 'src/client/morphic/component-loader.js';

export default class ComponentBin extends Morph {
  initialize() {
    this.windowTitle = "Component Bin"
    this.loadComponentList().then(async (compList) => {
      await this.createTiles(compList);
      this.showTiles(this.sortAlphabetically(this.componentList));
    });

    this.searchField = this.get("#search-field");
    this.searchField.addEventListener('keyup', (e) => { this.searchFieldChanged(e) });
    this.searchField.addEventListener('focus', (e) => { e.target.select(); });
    
    this.searchField.focus()
    
  }

  async loadComponentList() {
    var paths =  lively.components.getTemplatePaths()
      .filter(ea => !ea.match(/\/draft/))
      .filter(ea => !ea.match(/\/halo/))
      // .filter(ea => !ea.match(/\/widgets/))

    var contents  = []
    for(let templatesUrl of paths) {
      await files.statFile(templatesUrl).then(response => {
        try {
          // depending in the content type, the response is either parsed or not,
          // github always returns text/plain
          contents = contents.concat(JSON.parse(response).contents);
        } catch (e) {
          // it was already json
        }
      })
    }
    return contents.filter(file => {
        return file && file.type === "file" && file.name.match(/\.html$/);
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
      }); 
  }

  async createTiles(compList) {
    this.componentList = []
    for(let compInfo of compList) {
      var tile = await lively.create("lively-component-bin-tile", this);
      tile.setBin(this);
      tile.configure(compInfo);
      compInfo.tile = tile;
      this.componentList.push(compInfo)
    }
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
    if (!this.componentList) return []
    return this.componentList.filter((comp) => {
      return comp.name.toLowerCase().indexOf(string.toLowerCase()) >= 0;
    });
  }
  
  close() {
    if (this.parentElement && this.parentElement.isWindow) {
      this.parentElement.remove()
    }
  }
  
}
