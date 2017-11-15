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
      lively.notify('dragstart');
      const dt = evt.dataTransfer;

      listItem.style.color = "blue";
      lively.notify("knot.getURL()", knot.url);
      dt.setData("knot/url", knot.url);
      
      // #TODO: chrome does not support dataTransfer.addElement :(
      //dt.addElement(<h1>drop me</h1>);
      dt.setDragImage(<img src={lively4url + "/media/lively4_logo_smooth_100.png"}></img>, 0, 0);
    }, false);
    listItem.addEventListener('dragenter', evt => lively.notify('dragenter'), false)
    listItem.addEventListener('dragover', evt => lively.notify('dragover'), false);
    listItem.addEventListener('dragleave', evt => lively.notify('dragleave'), false);
    listItem.addEventListener('drop', evt => {
      lively.notify(":", evt.dataTransfer.getData("knot/url"));
    }, false);
    listItem.addEventListener('dragend', evt => {
      lively.notify('dragend');

      lively.notify(".", evt.dataTransfer.getData("knot/url"));
      listItem.style.color = null;
    }, false);
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}