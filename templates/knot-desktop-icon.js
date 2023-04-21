import Morph from 'src/components/widgets/lively-morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { fileName, hintForLabel, getTempKeyFor } from 'utils';
import {pt} from "src/client/graphics.js";

export default class KnotDesktopIcon extends Morph {
  get fontAwesomeClassesDefault() { return ["fa", "fa-question"]; }
  get fontAwesomeClassesPending() { return ["fa", "fa-spinner", "fa-pulse", "fa-3x", "fa-fw"]; }
  get fontAwesomeClassesKnot() { return ["fa", "fa-circle"]; }

  get desktopIcon() { return this.get("#desktop-icon"); }
  get label() { return this.get("#label"); }
  get icon() { return this.get("#icon i"); }
  get knotURL() { return this.dataset.knotUrl; }
  set knotURL(urlString) {
    this.dataset.knotUrl = urlString;
    this.updateAppearance();
    this.loadKnot();
  }
  get knot() { return this._knot; }
  loadKnot() {
    if(!this.knotURL) { return; }

    Graph.getInstance()
      .then(graph => graph.requestKnot(new URL(this.knotURL)))
      .then(knot => this._knot = knot);
  }
  
  async initialize() {
    this.windowTitle = "KnotDesktopIcon";
    this.classList.add("lively-content");
    
    this.addEventListener("dblclick", async evt => {
      if(this.knot) {
        this.knot.openViewInWindow();
      } else if(this.knotURL) {
        // #TODO: remove duplicate with Knot.openViewInWindow
        const knotView = await lively.openComponentInWindow("knot-view");
        knotView.loadKnotForURL(this.knotURL);
      } else {
        lively.error("No knot or knot url for this icon");
      }
    });
    this.initDrag();

    this.updateAppearance();
    this.loadKnot();
  }
  
  initDrag() {
    this.addEventListener('dragstart', evt => {
      this.desktopIcon.classList.add("currently-dragging");
      this.knot && this.knot.asDataForDrag(evt);
      evt.dataTransfer.setData("desktop-icon/object", getTempKeyFor(this));
      const { x, y } = pt(evt.clientX, evt.clientY).subPt(lively.getClientPosition(this));
      evt.dataTransfer.setData("desktop-icon/offset", JSON.stringify({ x, y }));
    });
    this.addEventListener('drag', evt => {});
    this.addEventListener('dragend', evt => {
      this.desktopIcon.classList.remove("currently-dragging");
    });
  }

  async updateAppearance() {
    if(!this.knotURL) { return; }
    this.icon.classList.remove(...this.fontAwesomeClassesDefault);
    this.icon.classList.add(...this.fontAwesomeClassesPending);
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(this.knotURL));
    this.label.innerHTML = knot.label();
    this.icon.classList.remove(...this.fontAwesomeClassesPending);
    this.icon.classList.add(...this.fontAwesomeClassesKnot);
  }

  livelyMigrate(other) {
    this.knotURL = other.knotURL;
  }
}