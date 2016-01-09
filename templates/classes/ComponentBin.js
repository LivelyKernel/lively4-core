'use strict'

import Morph from './Morph.js';
import { statFile, loadFile } from '../../src/client/file-editor.js';
import * as componentLoader from '../../src/client/morphic/component-loader.js';

export default class ComponentBin extends Morph {
  attachedCallback() {
    console.log("ComponentBin attached!!!");

    this.loadComponentList().then(componentList => {
      this.componentList = componentList;
      this.createTiles(componentList);
    });
  }

  loadComponentList() {
    return new Promise((resolve, reject) => {
      var templatesUrl = window.location.hostname === "localhost" ? "http://localhost:" + window.location.port + "/lively4-core/templates/" : "https://lively4/templates/";
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

  createTiles(componentList) {
    componentList.forEach(compInfo => {
      this.appendTile(compInfo, () => {
        var component = document.createElement(compInfo["html-tag"]);
        this.parentElement.insertBefore(component, this.nextSibling);
        componentLoader.loadUnresolved();
      });
    });
  }

  appendTile(config, callback) {
    var tile = document.createElement("lively-component-bin-tile");
    tile.setBin(this);
    tile.configure(config);

    var list = this.getSubmorph(".tile-pane");
    list.appendChild(tile);
  }

  open(component) {
    this.parentElement.insertBefore(component, this.nextSibling);
  }
}
