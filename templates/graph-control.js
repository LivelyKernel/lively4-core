import Morph from './Morph.js';

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class GraphControl extends Morph {
  async initialize() {
    this.windowTitle = "Graph Control";
    
    // TODO: init graph with preferences

    this.get('#inputAddDirectory').addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.addDirectory();
      }
    });

    let loadDirectory = this.get('#addDirectory');
    loadDirectory.addEventListener('click', event => this.addDirectory());

    let launchTripleList = this.get('#launchTripleList');
    launchTripleList.addEventListener('click', event => this.launchTripleList());
  }
  
  async addDirectory() {
    const dirString = this.get('#inputAddDirectory').value;
    const dirURL = new URL(dirString);
    
    const graph = await Graph.getInstance();
    await graph.loadFromDir(dirString);
  }
  
  async launchTripleList() {
    lively.notify(123)
    let tripleList = await lively.openComponentInWindow("triple-list");
    //tripleList.loadKnotForURL(knot.url);

  }
}