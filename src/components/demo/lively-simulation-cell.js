"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const DEFAULT_VIEW = 'codeView';

export default class LivelySimulationCell extends Morph {
  
  // life cycle
  initialize() {
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.shouldSkip = this.hasAttribute('data-should-skip');
    this.executeSingle = false;
    this.initializeTitleBar();
    this.initializeCodeView();
    this.initializeLogView();
    this.initializeViewSlot();
    this.addEventListener('mousedown', () => this.bringToFront());
  }
  
  initializeTitleBar() {
    const titleBar = this.get('#titleBar');
    titleBar.initializeName(this.dataset['name']);
  }
  
  initializeCodeView() {
    const codeView = this.get('#codeView');
    codeView.initializeState(this.dataset['state']);
    codeView.initializeSnippet(this.dataset['snippet']);
  }
  
  initializeLogView() {
    const logView = this.get('#logView');
    logView.initializeInterval(this.dataset['loginterval']);
  }
  
  initializeViewSlot() {
    const { shouldSkip } = this;
    const viewSlot = this.get('#viewSlot');
    viewSlot.setAttribute('disabled', shouldSkip);
    this.switchViewTo(this.dataset['view']);
  }
  
  livelyPrepareSave() {
    this.dataset['name'] = this.getName();
    this.dataset['state'] = JSON.stringify(this.getState());
    this.dataset['snippet'] = this.getSnippet();
    this.dataset['view'] = this.getActiveView();
    this.dataset['loginterval'] = this.get('#logView').getInterval();
    if (this.shouldSkip) this.setAttribute('data-should-skip', true);
    else this.removeAttribute('data-should-skip');
  }
  
  // event handler
  onPointerMove(event) {
    const { clientX, clientY } = event;
    const { lastMove } = this;
    this.style.left = `${this.offsetLeft + clientX - lastMove.clientX}px`;
    this.style.top = `${this.offsetTop + clientY - lastMove.clientY}px`;
    this.lastMove = _.pick(event, ['clientX', 'clientY']);
  }

  onPointerUp() {
    const anchor = document.body.parentElement;
    anchor.removeEventListener('pointermove', this.onPointerMove);
    anchor.removeEventListener('pointerup', this.onPointerUp);
  }
  
  // other
  bringToFront() {
    const simulation = this.getSimulation();
    if (!simulation.getForegroundCell) return;
    const foregroundCell = simulation.getForegroundCell();
    if (foregroundCell === this) return;
    this.style.zIndex = parseInt(foregroundCell.style.zIndex || 1) + 1;
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  getName() {
    return this.get('#titleBar').getName();
  }
  
  getNormalizedName() {
    return this.get('#titleBar').getNormalizedName();
  }
  
  setName(name) {
    this.get('#titleBar').setName(name);
    const simulation = this.getSimulation();
    this.highlight(simulation.currentHighlight);
  }
  
  getState() {
    return this.get('#codeView').getState();
  }
  
  setState(state) {
    return this.get('#codeView').setState(state);
  }
  
  getSnippet() {
    return this.get('#codeView').getSnippet();
  }
  
  log(timestamp, state) {
    this.get('#chartView').append(timestamp, state);
    this.get('#logView').log(timestamp, state);
  }
  
  clearLog() {
    this.get('#chartView').reset();
    this.get('#logView').clearLog();
  }
  
  execute(timestamp, scope = {}) {
    const { executeSingle, shouldSkip } = this;
    if (!executeSingle && shouldSkip) return Promise.resolve(scope);
    return this.get('#codeView').execute(scope)
      .then(updatedScope => {
        this.log(timestamp, updatedScope[this.getNormalizedName()]);
        return updatedScope;
      });
  }
  
  executeSelf() {
    if (this.executeSingle) return;
    const simulation = this.getSimulation();
    if (!simulation.executeSingleCell) return;
    this.executeSingle = true;
    simulation.executeSingleCell(this).finally(() => this.executeSingle = false);
  }
  
  delete() {
    this.remove();
  }
  
  clone(event) {
    const simulation = this.getSimulation();
    if (!simulation.cloneCell) return;
    simulation.cloneCell(event, this);
  }
  
  switchViewTo(target = DEFAULT_VIEW) {
    const views = _.map(['codeView', 'logView', 'chartView'], name => this.get(`#${name}`));
    _.forEach(views, view => view.classList.remove('active'));
    this.get(`#${target}`).classList.add('active');
  }
  
  toggleSkip() {
    this.shouldSkip = !this.shouldSkip;
    const { shouldSkip } = this;
    this.get('#viewSlot').setAttribute('disabled', shouldSkip);
  }
  
  startGrabbing(event, initPosition = true) {
    const anchor = document.body.parentElement;
    anchor.addEventListener('pointermove', this.onPointerMove);
    anchor.addEventListener('pointerup', this.onPointerUp);
    this.lastMove = _.pick(event, ['clientX', 'clientY']);
    if (initPosition) {
      const simulation = this.getSimulation();
      const parentBounds = simulation.getBoundingClientRect();
      this.style.top = `${event.clientY - parentBounds.y}px`;
      this.style.left = `${event.clientX - parentBounds.x - this.clientWidth / 2}px`;
    }
  }
  
  isFocused() {
    return this.get('#codeView').isFocused() 
    || this.get('#titleBar').isFocused() 
    || this.get('#logView').isFocused();
  }
  
  getSimulation() {
    return this.parentElement;
  }
  
  getActiveView() {
    return this.get('#viewSlot').querySelector('.active').id;
  }
  
  highlight(cellRef) {
    this.get('#titleBar').highlight(cellRef === this.getNormalizedName().toLowerCase());
    this.get('#codeView').highlight(cellRef);
  }
}
