import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';

export default class KnotSearchResult extends Morph {
  // lazy initializer for knot array
  get knots() { return this._knots = this._knots || []; }
  
  async initialize() {
    this.windowTitle = "KnotSearchResult";
  }
  
  focus() {
    const listItem = this.get("li");
    if(listItem) {
      listItem.focus();
    }
  }
  
  setSearchTerm(term) {
    this.get("#search-term").innerHTML = term;
  }
  
  async addKnot(knot) {
    this.knots.push(knot);
    const list = this.get("#result-list");
    const listItem = knot.toListItem();
    listItem.addEventListener('dragstart', evt => {
      listItem.style.color = "blue";
      lively.notify("knot.getURL()", "dragged");
      //evt.dataTransfer.addElement(1234);
      // #TODO: chrome does not support dataTransfer.addElement :(
      evt.dataTransfer.setDragImage(<img alt="HEOO"></img>,0,0);
    }, false);
    listItem.addEventListener('dragend', evt => {
      lively.notify("knot.getURL()", "dragend");
      listItem.style.color = undefined;
    }, false);
    listItem.addEventListener('dragstart', evt => lively.notify('dragstart'), false);
    listItem.addEventListener('dragenter', evt => lively.notify('dragenter'), false)
    listItem.addEventListener('dragover', evt => lively.notify('dragover'), false);
    listItem.addEventListener('dragleave', evt => lively.notify('dragleave'), false);
    listItem.addEventListener('drop', evt => lively.notify('drop'), false);
    listItem.addEventListener('dragend', evt => lively.notify('dragend'), false);
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}