import Morph from './Morph.js';
import { Graph } from './../src/client/triples/triples.js';
import { fileName, hintForLabel } from 'utils';

export default class KnotDesktopIcon extends Morph {
  get defaultFontAwesomeClasses() { return ["fa", "fa-spinner", "fa-pulse", "fa-3x", "fa-fw"]; }
  
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

    this.addEventListener("click", evt => {
      lively.notify("clicked", this.knotURL);
    });
    this.initDrag();

    this.updateAppearance();
    this.loadKnot();
  }
  
  initDrag() {
    this.addEventListener('dragstart', evt => {
      this.desktopIcon.classList.add("currently-dragging");
      this.knot && this.knot.asDataForDrag(evt);
    });
    this.addEventListener('drag', evt => {});
    this.addEventListener('dragend', evt => {
      this.desktopIcon.classList.remove("currently-dragging");
    });
  }

  async updateAppearance() {
    if(!this.knotURL) { return; }
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(this.knotURL));
    this.label.innerHTML = knot.label();
    this.icon.classList.remove(...this.defaultFontAwesomeClasses);
    this.icon.classList.add("fa", "fa-circle");
  }

  livelyMigrate(other) {
    this.knotURL = other.knotURL;
  }
}