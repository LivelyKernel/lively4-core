import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddTriple extends Morph {
  async initialize() {
    this.windowTitle = "Add Triple";

    let title = this.get("#title");
    title.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.save();
      }
    });
    
    let button = this.get('#save');
    button.addEventListener('click', event => this.save());
    
    this.prepareOptions('#subject');
  }
  
  prepareOptions(listSelector) {
    let selection = this.get('#subject');
    
    let option = document.createElement('option');
    option.value = 'World';
    option.text = 'Hello';
    
    selection.appendChild(option)

  }
  
  async save() {
    let graph = Graph.getInstance();
    
    let directory = this.get('#directory').value;
    let title = this.get('#title').value;
    let fileEnding = this.get('#file-ending').value;

    graph.createKnot(directory, title, fileEnding);
    
    return;

    // open the created knot in knot view
    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(knot.url);
  }
}
