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
      statFile("https://lively4/templates").then(response => {
        response = JSON.parse(response);
        // just consider html-files being templates
        var infoFilesPromises = response.contents.filter(file => {
          return file.type === "file" && file.name.slice(-5) === ".json";
        }).map(file => {
          return loadFile("https://lively4/templates/" + file.name)
        });

        Promise.all(infoFilesPromises).then(files => {
          // save the parsed list
          var componentList = files.map(JSON.parse);
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
        componentLoader.loadUnresolved(document.body);
      });
    });
    
  }


    //   }).catch(err => {
    //     console.log(err);
    //   });
    // });

  appendTile(config, callback) {
    var list = this.getSubmorph(".button-list");
    var button = document.createElement("button");
    button.className = "tile";
    button.innerHTML = config["name"];
    button.style.backgroundImage = "url(/lively4-core/templates/" + (config["thumbnail"] || "thumbnails/default-placeholder.png") + ")";
    button.addEventListener("click", callback);

    list.appendChild(button);
  }
}