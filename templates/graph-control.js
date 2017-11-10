import Morph from './Morph.js';
import KnotView from "./knot-view.js";

import { Graph } from 'src/client/triples/triples.js';

export default class GraphControl extends Morph {
  async initialize() {
    this.windowTitle = "Graph Control";

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
        GraphControl.fullTextSearch(this.get('#full-text-search').value);
      }
    });
    
    this.initKnowledgeBases();
  }
  
  initKnowledgeBases() {
    this.refreshKnowledgeBasesWidget();
    
    let addRootKnowledgeBaseButton = this.get('#add-root-knowledge-base');
    addRootKnowledgeBaseButton.onclick = event => this.addRootKnowledgeBase(event);
    
    this.get('#inputAddDirectory').addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.addRootKnowledgeBase(event);
      }
    });
  }
  
  async addRootKnowledgeBase(event) {
    const urlString = this.get('#inputAddDirectory').value;
    const graph = await Graph.getInstance();
    await graph.addRootKnowledgeBase(urlString);
    this.refreshKnowledgeBasesWidget();
  }
  async refreshKnowledgeBasesWidget() {
    const graph = await Graph.getInstance();
    const rootKnowledgeBases = await graph.getRootKnowledgeBases();

    let rootKnowledgeBasesContainer = this.get('#root-knowledge-bases-container');
    rootKnowledgeBasesContainer.innerHTML = "";
    rootKnowledgeBases.forEach(urlString => {
      let knowledgeBaseWidget = this.buildknowledgeBaseWidget(urlString);
      rootKnowledgeBasesContainer.appendChild(knowledgeBaseWidget);
    });
  }
  
  buildknowledgeBaseWidget(urlString) {
    return <span>
      {this.buildNavigatableLink(urlString)}
      {this.buildRemoveKnowledgeIcon(urlString)}
    </span>;
  }
  buildNavigatableLink(urlString) {
    let ref = <a>{urlString}</a>;
    ref.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      const container = await lively.openBrowser(urlString, false);
      container.focus();
    });
    
    return ref;
  }
  buildRemoveKnowledgeIcon(urlString) {
    let removeIcon = <i class="fa fa-trash"></i>;
    removeIcon.addEventListener("click", async e => {
      const graph = await Graph.getInstance();
      if(await graph.removeRootKnowledgeBase(urlString)) {
        this.refreshKnowledgeBasesWidget();
      } else {
        lively.notify('did not removed knowledge base ' + urlString);
      }
    });
    
    return removeIcon;
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
  static async fullTextSearch(searchString) {
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