import Morph from "./Morph.js"

import { Graph, _ } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class KnotView extends Morph {
  get urlString() { return this.get("#path-to-load").value; }
  get tagURLString() { return 'https://lively4/dropbox/tag.md'; }
  
  async initialize() {
    this.windowTitle = "Knot View";

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(this.urlString);
      }
    });
    
    let aceComp = this.get('#content-editor');
    aceComp.editor.setOptions({maxLines:Infinity});

    let urlToLoad = this.getAttribute('data-knot-url');
    if (urlToLoad && urlToLoad !== "") {
      this.loadKnotForURL(urlToLoad);
    }
  }
  
  buildNavigatableLinkFor(knot) {
    let ref = document.createElement('a');
    ref.innerHTML = knot.label();
    ref.addEventListener("click", e => {
      this.loadKnotForURL(knot.fileName);
    });
    
    return ref;
  }
  buildRefFor(knot) {
    return this.buildNavigatableLinkFor(knot);
  }
  buildTableDataFor(knot) {
    let tableData = document.createElement('td');

    tableData.appendChild(this.buildRefFor(knot));
    
    let icon = document.createElement('i');
    icon.classList.add('fa', 'fa-search');
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
  async replaceTableBodyFor(selector, s, p, o, propForFirstCell, propForSecondCell) {
    let graph = await Graph.getInstance();
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
    let graph = await Graph.getInstance();
    let knot = await graph.requestKnot(new URL(url));
    
    this.get("#path-to-load").value = knot.url;
    this.get("#label").innerHTML = knot.label();
    
    let deleteKnot = this.get('#delete-button');
    deleteKnot.onclick = event => this.deleteKnot(event);

    // URLs
    let urlList = this.get("#url-list");
    urlList.innerHTML = "";
    graph.getUrlsByKnot(knot).forEach(url => {
      function isExternalLink(url) {
        try {
          return Graph.isExternalURL(new URL(url));
        } catch(e) {
          return false;
        }
      }
      
      let listItem = document.createElement('li');
      listItem.innerHTML = isExternalLink(url) ?
        url + '<i class="fa fa-external-link"></i>' :
        url;
      listItem.addEventListener("click", async e => {
        if(isExternalLink(url)) {
          window.open(url);
        } else {
          const container = await lively.openBrowser(url, false);
          container.focus();
        }
        e.preventDefault();
        e.stopPropagation();
        return true;
      });
      urlList.appendChild(listItem);
    });
    
    // Tags
    let tag = await graph.requestKnot(new URL('https://lively4/dropbox/tag.md'));
    let tagContainer = this.get('#tag-container');
    tagContainer.innerHTML = "";
    graph.query(knot, tag, _).forEach(triple => {
      let tagElement = this.buildTagWidget(triple.object, triple);
      tagContainer.appendChild(tagElement);
    });
    let addTagButton = this.get('#add-tag');
    addTagButton.onclick = event => this.addTag(event);

    // spo tables
    this.replaceTableBodyFor('#po-table', knot, _, _, 'predicate', 'object');
    this.replaceTableBodyFor('#so-table', _, knot, _, 'subject', 'object');
    this.replaceTableBodyFor('#sp-table', _, _, knot, 'subject', 'predicate');

    // add buttons
    let addTripleWithKnotAsSubject = this.get('#add-triple-as-subject');
    addTripleWithKnotAsSubject.onclick = event => this.addTripleWithKnotAsSubject(event);
    let addTripleWithKnotAsPredicate = this.get('#add-triple-as-predicate');
    addTripleWithKnotAsPredicate.onclick = event => this.addTripleWithKnotAsPredicate(event);
    let addTripleWithKnotAsObject = this.get('#add-triple-as-object');
    addTripleWithKnotAsObject.onclick = event => this.addTripleWithKnotAsObject(event);

    // content
    this.buildContentFor(knot);

  }
  
  buildTagWidget(tag, triple) {
    let tagElement = document.createElement('div');
    tagElement.appendChild(this.buildNavigatableLinkFor(tag));
    tagElement.appendChild(this.buildDeleteTagElement(triple));

    return tagElement;
  }
  buildDeleteTagElement(triple) {
    let ref = document.createElement('i');
    ref.classList.add('fa', 'fa-trash');
    ref.addEventListener("click", e => {
      this.deleteTagTriple(triple);
    });
    
    return ref;
  }
  async deleteTagTriple(triple) {
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(triple.fileName));
    
    if(await graph.deleteKnot(knot)) {
      this.refresh();
    } else {
      lively.notify('did not delete tag ' + triple.object.fileName);
    }
  }


  refresh() {
    this.loadKnot(this.urlString);
  }
  async deleteKnot() {
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(this.urlString));
    
    if(await graph.deleteKnot(knot)) {
      const elementToRemove = this.parentElement.isWindow ? this.parentElement : this;
      elementToRemove.remove();
    } else {
      lively.notify('did not delete knot ' + this.urlString);
    }
  }
  
  async createAddTriple() {
    const addTriple = await lively.openComponentInWindow("add-triple");
    addTriple.afterSubmit = () => {
      addTriple.parentElement.remove();
      this.refresh();
    }
    return addTriple;
  }
  async addTag(event) {
    const addTriple = await this.createAddTriple();

    addTriple.setField('subject', this.urlString);
    addTriple.setField('predicate', this.tagURLString);
    addTriple.focus('object');
  }
  
  async addTripleWithKnotAsSubject() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('subject', this.urlString);
    addTriple.focus('predicate');
  }

  async addTripleWithKnotAsPredicate() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('predicate', this.urlString);
    addTriple.focus('subject');
  }

  async addTripleWithKnotAsObject() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('object', this.urlString);
    addTriple.focus('subject');
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
      aceComp.doSave = async text => {
        await knot.save(text);
        this.refresh();
      }
    }
  }
  
  hide(element) { element.style.display = "none"; }
  show(element) { element.style.display = "block"; }

  onPathEntered(path) {
    this.loadKnotForURL(path);
  }
  
  livelyPrepareSave() {
    this.setAttribute("data-knot-url", this.urlString);
  }
  
  static async openURL(knotURL) {
    const knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(knotURL);
  }
}
