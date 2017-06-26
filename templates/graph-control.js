import Morph from './Morph.js';

import { Graph, invalidateWholeCache } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class GraphControl extends Morph {
  async initialize() {
    this.windowTitle = "Graph Control";
    
    this.get('#inputAddDirectory').addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.addDirectory();
      }
    });

    let loadDirectory = this.get('#addDirectory');
    loadDirectory.addEventListener('click', event => this.addDirectory());

    let addKnotButton = this.get('#add-knot');
    addKnotButton.addEventListener('click', event => this.onAddKnot(event));

    let addTripleButton = this.get('#add-triple');
    addTripleButton.addEventListener('click', event => this.onAddTriple(event));

    let launchTripleList = this.get('#launchTripleList');
    launchTripleList.addEventListener('click', event => this.launchTripleList());
    
    let launchGraph = this.get('#launchGraph');
    launchGraph.addEventListener('click', event => this.launchGraph());
    
    let clearCache = this.get('#clear-cache');
    clearCache.addEventListener('click', event => this.onClearCache());
    
    let resetGraph = this.get('#reset-graph');
    resetGraph.addEventListener('click', event => this.onResetGraph());
    
    let input = this.get('#open-knot-view');
    input.setLabel('Open Knot');
    input.setPlaceholder('knot');
    input.onEnter = () => this.openKnotView();
  }
  
  // TODO: does this work?
  async addDirectory() {
    const dirString = this.get('#inputAddDirectory').value;
    const dirURL = new URL(dirString);
    
    const graph = await Graph.getInstance();
    await graph.loadFromDir(dirString);
  }
  
  async launchTripleList() {
    const tripleList = await lively.openComponentInWindow("triple-list");
    tripleList.focus();
  }
  
  async launchGraph() {
    return await lively.openComponentInWindow("triple-notes");
  }
  
  async openKnotView() {
    const knotView = await lively.openComponentInWindow("knot-view");
    const knotURL = this.get('#open-knot-view').getURLString();
    
    knotView.loadKnotForURL(knotURL);
  }
  
  async onAddKnot(event) {
    const addKnot = await lively.openComponentInWindow("add-knot");
    addKnot.focus();
    addKnot.afterSubmit =() => addKnot.parentElement.remove();
  }
  
  async onAddTriple(event) {
    const addTriple = await lively.openComponentInWindow("add-triple");
    addTriple.focus();
    addTriple.afterSubmit =() => addTriple.parentElement.remove();
  }
  
  async onClearCache() {
    await invalidateWholeCache();
    lively.notify('cleared graph cache');
  }
  
  async onResetGraph() {
    await Graph.clearInstance();
    lively.notify('resetted graph');
  }
}