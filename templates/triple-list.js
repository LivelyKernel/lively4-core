import Morph from "src/components/widgets/lively-morph.js"

import loadDropbox, { Graph } from 'src/client/triples/triples.js';

export default class TripleList extends Morph {

  async initialize() {
    this.windowTitle = "Triple List";

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.filter(pathToLoad.value);
      }
    });

    this.filter(pathToLoad.value);
  }
  
  async filter(path) {
    let list = this.get("#triple-list");
    list.innerHTML = "";

    let graph = await Graph.getInstance();

    graph.knots
      .filter(knot => this.matchKnot(knot))
      .forEach(knot => {
        let listItem = document.createElement('li');
        listItem.innerHTML = knot.label();
        listItem.addEventListener("click", async e => {
          // lively.openInspector(knot, undefined, knot.label());
          
          let knotView = await lively.openComponentInWindow("knot-view");
          knotView.loadKnotForURL(knot.url);
        });
        list.appendChild(listItem);
      });
  }
  
  focus() {
    this.get("#path-to-load").focus();
  }
  
  matchKnot(knot) {
    return knot.label().includes(this.get("#path-to-load").value);
  }
}
