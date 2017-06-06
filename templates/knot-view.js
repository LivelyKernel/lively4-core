import Morph from "./Morph.js"

import { Graph, _ } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class KnotView extends Morph {

  async initialize() {
    this.windowTitle = "Knot View";

    let graph = Graph.getInstance();
    await graph.loadFromDir("https://lively4/dropbox/");

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(pathToLoad.value);
      }
    });
    
        let aceComp = this.get('#content-editor');
aceComp.editor.setOptions({maxLines:Infinity});

    // TODO: Update this
    //pathToLoad.value="https://lively4/dropbox/Traveling_through_Time_and_Code_-_Omniscient_Debugging_and_Beyond.md";
    //this.loadKnotForURL(pathToLoad.value);
  }
  
  buildRefFor(knot) {
    let ref = document.createElement('a');
    ref.innerHTML = knot.label();
    ref.addEventListener("click", e => {
      this.loadKnotForURL(knot.fileName);
    });
    
    return ref;
  }
  buildTableDataFor(knot) {
    let tableData = document.createElement('td');

    tableData.appendChild(this.buildRefFor(knot));
    
    let icon = document.createElement('i');
    icon.classList.add('fa', 'fa-info');
    icon.addEventListener("click", e => {
      lively.openInspector(knot, undefined, knot.label());
    });
    tableData.appendChild(icon);

    return tableData;
  }
  buildTableRowFor(triple, knot1, knot2) {
    let tableRow = document.createElement('tr');
    tableRow.appendChild(this.buildTableDataFor(knot1));
    tableRow.appendChild(this.buildTableDataFor(knot2));
    tableRow.appendChild(this.buildTableDataFor(triple));
    return tableRow;
  }
  replaceTableBodyFor(selector, s, p, o, propForFirstCell, propForSecondCell) {
    let graph = Graph.getInstance();
    let poTableBody = this.get(selector + ' tbody');
    poTableBody.innerHTML = "";
    graph.query(s, p, o).forEach(triple => {
      poTableBody.appendChild(
        this.buildTableRowFor(
          triple,
          triple[propForFirstCell],
          triple[propForSecondCell]
        )
      );
    });
  }
  
  async loadKnotForURL(url) {
    return this.loadKnot(url);
  }
  async loadKnot(url) {
    let graph = Graph.getInstance();
    let knot = await graph.requestKnot(new URL(url));
    
    this.get("#path-to-load").value = knot.url;
    this.get("#label").innerHTML = knot.label();
    
    let urlList = this.get("#url-list");
    urlList.innerHTML = "";
    Graph.getInstance().getUrlsByKnot(knot).forEach(url => {
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
    
    // content
    this.buildContentFor(knot);

  }

  buildListItemFor(knot, role) {
    let li = document.createElement('li');
    li.innerHTML = `${role}: `;
    li.appendChild(this.buildRefFor(knot));
    
    return li;
  }
  buildContentFor(knot) {
    let aceComp = this.get('#content-editor');
    let spoList = this.get('#spo-list');
    if(knot.isTriple()) {
      this.hide(aceComp);
      this.show(spoList);
      spoList.innerHTML = '';
      spoList.appendChild(this.buildListItemFor(knot.subject, 'Subject'));
      spoList.appendChild(this.buildListItemFor(knot.predicate, 'Predicate'));
      spoList.appendChild(this.buildListItemFor(knot.object, 'Object'));
    } else {
      this.show(aceComp);
      this.hide(spoList);
      aceComp.editor.setValue(knot.content);
      aceComp.enableAutocompletion();
      aceComp.aceRequire('ace/ext/searchbox');
      aceComp.doSave = text => knot.save(text);
    }
  }
  
  hide(element) { element.style.display = "none"; }
  show(element) { element.style.display = "block"; }

  onPathEntered(path) {
    this.loadKnotForURL(path);
  }
  
  livelyMigrate(oldView) {
    let oldPath = oldView.get("#path-to-load").value;
    this.loadKnotForURL(oldPath);
  }
}
