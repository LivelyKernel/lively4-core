import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { getTempKeyFor, asDragImageFor } from 'src/client/draganddrop.js';
import { fileName } from 'utils';
import generateUUID from 'src/client/uuid.js';

var x = 0;
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
  
  removeSelection() {
    const selectedItems = Array.from(this.getAllSubmorphs('li.selected'));
    selectedItems.forEach(item => item.classList.remove('selected'));
  }
  
  async addKnot(knot) {
    this.knots.push(knot);
    const list = this.get("#result-list");
    const listItem = knot.toListItem();
    
    // events fired on drag element
    listItem.addEventListener('dragstart', evt => {
      function hintForLabel(label) {
        return <div style="
          margin: 0.5px 0px;
          font-size: x-small;
          background-color: lightgray;
          border: 1px solid gray;
          border-radius: 2px;
          max-width: fit-content;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          {label}
        </div>
      }

      const selectedItems = Array.from(this.getAllSubmorphs('li.selected'));
      if(selectedItems.length > 1 && selectedItems.includes(listItem)) {
        const dt = evt.dataTransfer;

        const knots = selectedItems.map(item => item.knot);
        dt.setData("javascript/object", getTempKeyFor(knots));
        
        const hints = knots
          .map(knot => knot.label())
          .map(hintForLabel);
        const hintLength = hints.length;
        const maxLength = 5;
        if(hints.length > maxLength) {
          hints.length = maxLength;
          hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`))
        }
        const dragInfo = <div style="width: 150px;">
          {...hints}
        </div>;
        dragInfo::asDragImageFor(evt, -10, 2);
      } else {
        this.removeSelection();
        listItem.classList.add("selected");
      
        const dt = evt.dataTransfer;
        listItem.style.color = "blue";
        dt.setData("knot/url", knot.url);
        dt.setData("text/uri-list", knot.url);
        dt.setData("text/plain", knot.url);
        dt.setData("javascript/object", getTempKeyFor(knot));
        // #TODO: is it possible nowadays to put a data uri in a downloadurl?
        const tryDataURIDownloadURL = false;
        const mimeType = tryDataURIDownloadURL ?
          'text/plain' :
          'text/plain';
        const filename = knot.url::fileName();
        const url = tryDataURIDownloadURL ?
          URL.createObjectURL(new Blob(["aFileParts"], {type : 'text/plain'})) ||
              `data:application/x-javascript;base64,${btoa("helloworld")}` :
          knot.url;
        lively.warn(url);
        dt.setData("DownloadURL", `${mimeType}:${filename}:${url}`);

        // #TODO: remove duplication
        const dragInfo = <div style="width: 150px;">
          {hintForLabel(knot.label())}
        </div>;
        dragInfo::asDragImageFor(evt, 50, 60);
      }
      
    }, false);
    listItem.addEventListener('drag', evt => {
      if(x++ % 10 !== 0) { return; }
      //lively.showPoint(pt(evt.clientX, evt.clientY));
    }, false);
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
    listItem.addEventListener('dragleave', evt => lively.notify('dragleave'), false);
    listItem.addEventListener('drop', evt => {
      lively.notify('drop');
      lively.notify(":", evt.dataTransfer.getData("knot/url"));
    }, false);
    
    listItem.addEventListener('click', evt => {
      evt.stopPropagation();
      evt.preventDefault();
      
      if(!evt.ctrlKey) {
        this.removeSelection();
      }
      if(!evt.shiftKey) {
        listItem.classList.toggle("selected");
        //listItem.classList.add("last-selected");
      } else {
        // const lastSelected = this.get("last-selected");
        // const id1 = generateUUID();
        // const id2 = generateUUID();
        // lastSelected.classList.add('one');
        // listItem.classList.add('two');
        // [lastSelected, listItem]
        //   .concat(Array.from(this.getAllSubmorphs('#one ~ p:not(#two)')))
        //   .concat(Array.from(this.getAllSubmorphs('#two ~ p:not(#one)')))
        //   .forEach(item => item.classList.add("selected"));
        // lastSelected.classList.remove('one');
        // listItem.classList.remove('two');
      }
    }, false);
    list.appendChild(listItem);
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}