'use strict'

import Morph from './Morph.js';
import { statFile, loadFile } from '../../src/client/file-editor.js';
import * as componentLoader from '../../src/client/morphic/component-loader.js';

export default class ComponentBin extends Morph {
  attachedCallback() {
    console.log("ComponentBin attached!!!");
    
    this.setupComponentList();
  }

  setupComponentList() {
    statFile("https://lively4/templates").then(response => {
      response = JSON.parse(response);
      // just consider html-files being templates
      var infoFiles = response.contents.filter(file => {
        return file.type === "file" && file.name.slice(-5) === ".json";
      }).map(file => {
        return loadFile("https://lively4/templates/" + file.name)
      });

      Promise.all(infoFiles).then(files => {
        files.map(JSON.parse).forEach(compInfo => {
          this.appendButton(compInfo.name, () => {
            var component = document.createElement(compInfo["html-tag"]);
            this.parentElement.insertBefore(component, this.nextSibling);
            componentLoader.loadUnresolved(document.body);
          })
        })
      }).catch(err => {
        console.log(err);
      });

      // infoFiles.forEach(file => {
      //   this.appendButton(file.name, () => {
      //     // the tag name is the file name without '.html'
      //     var tag = file.name.substring(0, file.name.length-5);
      //     var component = document.createElement(tag);
      //     this.parentElement.insertBefore(component, this.nextSibling);
      //     componentLoader.loadUnresolved(document.body);
      //   });
      // });
    });
  }

  appendButton(name, callback) {
    var list = this.getSubmorph(".button-list");
    var button = document.createElement("button");
    button.innerHTML = name;
    button.className = "list-button";
    button.addEventListener("click", callback);

    list.appendChild(button);
  }
}