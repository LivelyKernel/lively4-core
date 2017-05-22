import Morph from "./Morph.js"

import loadDropbox, { Graph, _ } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class KnotView extends Morph {

  async initialize() {
    this.windowTitle = "Knot View";

    //Graph.clearInstance();
    let graph = Graph.getInstance();
    await graph.loadFromDir("https://lively4/dropbox/");

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(pathToLoad.value);
      }
    });

   pathToLoad.value="https://lively4/dropbox/Traveling_through_Time_and_Code_-_Omniscient_Debugging_and_Beyond.md" 
    this.loadKnot(pathToLoad.value);
  }
  
  buildTableDataFor(knot) {
    let tableData = document.createElement('td');

    let ref = document.createElement('a');
    ref.innerHTML = knot.label();
    ref.addEventListener("click", e => {
      lively.openInspector(knot, undefined, knot.label());
    })

    tableData.appendChild(ref);
    return tableData;
  }
  buildTableRowFor(knot1, knot2) {
    let tableRow = document.createElement('tr');
    tableRow.appendChild(this.buildTableDataFor(knot1));
    tableRow.appendChild(this.buildTableDataFor(knot2));
    return tableRow;
  }
  replaceTableBodyFor(selector, s, p, o, propForFirstCell, propForSecondCell) {
    let graph = Graph.getInstance();
    let poTableBody = this.get(selector + ' tbody');
    poTableBody.innerHTML = "";
    graph.query(s, p, o).forEach(triple => {
      poTableBody.appendChild(
        this.buildTableRowFor(
          triple[propForFirstCell],
          triple[propForSecondCell]
        )
      );
    });
  }
  
  
  async loadKnot(url) {
    let graph = Graph.getInstance();
    let knot = graph.getKnotByUrl(url);
    
    this.get("#label").innerHTML = knot.label();
    
    let urlList = this.get("#url-list");
    urlList.innerHTML = "";
    graph.getUrlsByKnot(knot).forEach(url => {
      let listItem = document.createElement('li');
      listItem.innerHTML = url;
      listItem.addEventListener("click", e => {
        lively.openComponentInWindow('lively-iframe').then(component => {
          component.setURL(url);
        });
      })
      urlList.appendChild(listItem);
    });
    
    this.replaceTableBodyFor('#po-table', knot, _, _, 'predicate', 'object');
    this.replaceTableBodyFor('#so-table', _, knot, _, 'subject', 'object');
    this.replaceTableBodyFor('#sp-table', _, _, knot, 'subject', 'predicate');
  }

  onPathEntered(path) {
    this.loadKnot(path);
  }
}
