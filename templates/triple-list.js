import Morph from "./Morph.js"

import loadDropbox, { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class TripleList extends Morph {

  async initialize() {
    this.windowTitle = "Triple List";

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(pathToLoad.value);
      }
    });

    this.loadPath(pathToLoad.value);
  }
  
  async loadPath(path) {
    let list = this.get("#triple-list");
    list.innerHTML = "";

    let graph = Graph.getInstance();
    await graph.loadFromDir(path);

    graph.knots.forEach(knot => {
      let listItem = document.createElement('li');
      listItem.innerHTML = knot.label();
      listItem.addEventListener("click", e => {
        lively.openInspector(knot, undefined, knot.label());
      })
      list.appendChild(listItem);
    });
  }

  onPathEntered(path) {
    this.loadPath(path);
  }
}
