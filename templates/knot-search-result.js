import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { getTempKeyFor, asDragImageFor } from 'src/client/draganddrop.js';
import { fileName } from 'utils';

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
    
    // events fired on drag element
    listItem.addEventListener('dragstart', evt => {
      lively.notify('dragstart');
      const dt = evt.dataTransfer;

      listItem.style.color = "blue";
      dt.setData("knot/url", knot.url);
      dt.setData("text/uri-list", knot.url);
      dt.setData("text/plain", knot.url);
      dt.setData("javascript/object", getTempKeyFor(knot));
      const mimeType = 'text/plain';
      const filename = knot.url::fileName();
      const url = knot.url;
      dt.setData("DownloadURL", `${mimeType}:${filename}:${url}`);
      
      const dragInfo = <div>
        <h1>Hello World</h1>
        <ol>
          <li>{knot.url}</li>
        </ol>
      </div>;
      dragInfo::asDragImageFor(evt, -150, 50);
    }, false);
    listItem.addEventListener('drag', evt => {}, false);
    listItem.addEventListener('dragend', evt => {
      listItem.style.color = null;
    }, false);

    // events fired on drop target
    listItem.addEventListener('dragenter', evt => {
      lively.notify('dragenter');
      const dragInfo = <div width="200px" height="200px" style="background-color: blue"></div>;
      dragInfo::asDragImageFor(evt, -150, 50);
    }, false);
    listItem.addEventListener('dragover', evt => lively.notify('dragover'), false);
    listItem.addEventListener('dragleave', evt => {
lively.notify('dragleave')}, false);
    listItem.addEventListener('drop', evt => {
      lively.notify('drop');
      lively.notify(":", evt.dataTransfer.getData("knot/url"));
    }, false);
    
    listItem.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(evt.ctrlKey) {
        lively.warn("shift")
      }
      if(evt.shiftKey) {
      }
      listItem.classList.add("selected");
    }, false);
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}