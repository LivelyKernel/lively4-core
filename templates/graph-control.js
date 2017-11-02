import Morph from './Morph.js';
import KnotView from "./knot-view.js";

import { Graph } from 'src/client/triples/triples.js';
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
    
    let input = this.get('#open-knot-view');
    input.setLabel('Open Knot');
    input.setPlaceholder('knot');
    input.addEventListener('enter-knot', () => this.openKnotView());
    
    var fullTextSearch = this.get("#full-text-search");
    fullTextSearch.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.fullTextSearch(this.get('#full-text-search').value);
      }
    });
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
    knotView.loadKnotForURL(this.get('#open-knot-view').getURLString());
    return knotView;
  }
  
  async onAddKnot(event) {
    const addKnot = await lively.openComponentInWindow("add-knot");
    addKnot.focus();
    addKnot.afterSubmit = () => addKnot.parentElement.remove();
  }
  
  async onAddTriple(event) {
    const addTriple = await lively.openComponentInWindow("add-triple");
    addTriple.focus();
    addTriple.afterSubmit = () => addTriple.parentElement.remove();
  }
  
  async onResetGraph() {
    await Graph.clearInstance();
    lively.notify('resetted graph');
  }
  
    // Full-text search on object graph
  async fullTextSearch(searchString) {
    const searchTerms = searchString.split(' ')
      .map(str => str.toLowerCase());

    const graph = await Graph.getInstance();
    const matchingKnots = graph.getKnots()
      .filter(knot => !knot.isTriple())
      .filter(knot => knot.url.endsWith('.md'))
      .filter(knot => {
        const content = knot.content.toLowerCase();
        return searchTerms.every(term => content.includes(term));
      });
    
    const searchResult = await lively.openComponentInWindow("knot-search-result");
    searchResult.setSearchTerm(searchString);
    matchingKnots.forEach(::searchResult.addKnot);
    searchResult.focus();
  }
}