import Morph from './Morph.js';
import KnotView from "./knot-view.js";
import ContextMenu from './../src/client/contextmenu.js';
import { Graph } from './../src/client/triples/triples.js';

function collectContextMenuItems() {
  return [
      ["Knot View", (evt) => {
        ContextMenu.hide();
        KnotView.openURL(this.url);
      }, "", '<i class="fa fa-window-maximize" aria-hidden="true"></i>'],
      ["Danger Zone", [
        ["Delete", async evt => {
          ContextMenu.hide();
          const graph = await Graph.getInstance();

          const label = this.label();
          if(await graph.deleteKnot(this)) {
            // #TODO: use reactivity to update views and search results
            lively.notify(`${label} deleted!`, null, 4, null, "red");
          } else {
            lively.notify('did not delete knot ' + label, this.url);
          }
        }, "Delete for good", '<i class="fa fa-trash" aria-hidden="true"></i>']
      ]]
    ];
}

function toListItem() {
  const listItem = <li tabindex="1">{this.label()}</li>;

  listItem.addEventListener('keydown', event => {
    if (event.keyCode == 13) { // ENTER
      KnotView.openURL(this.url);
      event.stopPropagation();
      event.preventDefault();
    }
  });
  listItem.addEventListener("dblclick", event => {
    KnotView.openURL(this.url);
    event.stopPropagation();
    event.preventDefault();
  });
  listItem.addEventListener("contextmenu", event => {
    ContextMenu.openIn(document.body, event, this, undefined, this::collectContextMenuItems());
    event.stopPropagation();
    event.preventDefault();
  });
  
  return listItem;
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
    list.appendChild(knot::toListItem());    
  }
  
  livelyMigrate(other) {
    this.setSearchTerm(other.get("#search-term").innerHTML);
    other.knots.forEach(::this.addKnot);
  }
}