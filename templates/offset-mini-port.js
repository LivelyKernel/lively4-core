import ComponentLoader from 'src/client/morphic/component-loader.js'
import { pt } from 'src/client/graphics.js';
import { getEditor, remove } from './offset-mini-utils.js';

import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetMiniPort extends Morph {

  get _editor() {
    return getEditor(this);
  }

  get _id() {
    return lively.ensureID(this);
  }

  get direction() {
    return this.getAttribute('direction');
  }

  /*MD ## Life-cycle MD*/
  initialize() {
    this.initializeShadowRoot();
    this.positionChangeObservers;
  }

  initializeShadowRoot() {
    const label = this.getAttribute('label');
    this.label.innerHTML = label || '';

    this.updateContainerGrid();
  }

  applyOptions({ direction, label }) {
    this.setAttribute('direction', direction);
    if (label) {
      this.setAttribute('label', label);
    } else {
      this.removeAttribute('label');
    }

    this.initializeShadowRoot();
  }

  updateContainerGrid() {
    const direction = this.direction;
    const containerCSS = this.get('style#container-grid');

    let gridAreas;
    if (direction === 'in') {
      gridAreas = `"knob label"`;
    } else if (direction === 'out') {
      gridAreas = `"label knob"`;
    } else {
      return;
    }
    containerCSS.innerHTML = `
#container {
  grid-template-areas: ${gridAreas};
}`;
  }

  get knob() {
    return this.get('#knob');
  }
  get label() {
    return this.get('#label');
  }
  get container() {
    return this.get('#container');
  }

  /*MD ## Position Observer MD*/
  get positionChangeObservers() {
    if (!this._positionChangeObservers) {
      this._positionChangeObservers = [];
    }

    return this._positionChangeObservers;
  }

  onPositionChange() {
    this.positionChangeObservers.forEach(observer => {
      observer.anchorChanged();
    });
  }

  addPositionChangeObserver(observer) {
    this.positionChangeObservers.push(observer);
  }

  removePositionChangeObserver(observer) {
    this.positionChangeObservers::remove(observer);
  }

  /*MD ## Geometry MD*/
  getAnchorPoint() {
    const knob = this.get('#knob');
    const fromBounds = this._editor.boundsForElement(knob);    
    return {
      pos: fromBounds.center(),
      dir: pt(this.direction === 'out' ? 100 : -100, 0)
    };
  }

  /*MD ## Edges MD*/
  async createConnectedEdge() {
    const edge = await this._editor.spawnEdge();

    const succeeded = this.connectWithEdge(edge);
    if (!succeeded) {
      throw new Error("Could not create edge, port has no direction (in or out)");
    }

    return edge;
  }

  connectWithEdge(edge) {
    const direction = this.direction;
    if (direction === 'in') {
      edge.connectTo(this);
      return true;
    } else if (direction === 'out') {
      edge.connectFrom(this);
      return true;
    }
    return false;
  }

  async connectWith(otherPort) {
    const edge = await this.createConnectedEdge();
    otherPort.connectWithEdge(edge);
    return edge;
  }

  /*MD ## Lively-specific API MD*/
  get livelyUpdateStrategy() {
    return 'inplace';
  }

  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
    this.initializeShadowRoot();

    lively.showElement(this, 300);
  }

}