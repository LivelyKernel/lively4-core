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
      dt.setData("text/uri-list", knot.url);
      
      function toDragImage() {}

      // #TODO: chrome does not support dataTransfer.addElement :(
      //dt.addElement(<h1>drop me</h1>);
      // const img = <img src={lively4url + "/media/lively4_logo_smooth_100.png"}></img>
      //const img = await Raster.asImage(that);
      
      const options = {
        offsetX: -150,
        offsetY: 50
      };
      const offsetX = options.offsetX || 0;
      const offsetY = options.offsetY || 0;
      const x = evt.clientX;
      const y = evt.clientY;

      const dragImageDiv = <div>Hello World
        <ol>
          <li>foo</li>
          <li>foobar</li>
          <li>foobarblub</li>
        </ol>
      </div>;
      document.body.appendChild(dragImageDiv);
      dragImageDiv.style["z-index"] = "-100000";
      dragImageDiv.style.top = Math.max(0, y-offsetY)+"px";
      dragImageDiv.style.left = Math.max(0, x-offsetX)+"px";
      dragImageDiv.style.position = "absolute";
      dragImageDiv.style.pointerEvents = "none";
      
      setTimeout(function() {
          dragImageDiv.remove();
      });
      dt.setDragImage(dragImageDiv, offsetX, offsetY);
    }, false);
    listItem.addEventListener('dragenter', evt => lively.notify('dragenter'), false);
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