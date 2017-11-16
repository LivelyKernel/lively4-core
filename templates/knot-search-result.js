import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { getTempKeyFor } from 'src/client/draganddrop.js';

// #TODO: chrome does not support dataTransfer.addElement :(
// e.g. dt.addElement(<h1>drop me</h1>);
// Therefore, we have to perform this hack stolen from:
// https://stackoverflow.com/questions/12766103/html5-drag-and-drop-events-and-setdragimage-browser-support
function asDragImageFor(evt, offsetX=0, offsetY=0) {
  const clone = this.cloneNode(true);
  document.body.appendChild(clone);
  clone.style["z-index"] = "-100000";
  clone.style.top = Math.max(0, evt.clientY - offsetY) + "px";
  clone.style.left = Math.max(0, evt.clientX - offsetX) + "px";
  clone.style.position = "absolute";
  clone.style.pointerEvents = "none";

  setTimeout(::clone.remove);
  evt.dataTransfer.setDragImage(clone, offsetX, offsetY);
}

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
    
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}