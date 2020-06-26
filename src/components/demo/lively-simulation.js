"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Engine from 'demos/engery-sim/engine.js';
import History from 'demos/engery-sim/history.js';
import _ from 'src/external/lodash/lodash.js';

const EMPTY_PLACEHOLDER = 'EMPTY';
const RESERVED_CELL_NAMES = ['simulation'];

export default class LivelySimulation extends Morph {
  
  // life cycle
  initialize() {
    this.windowTitle = 'Simulation';
    lively.html.registerKeys(this);
    this.initializeEngine();
    this.initializeController();
    this.initializeContainerRoot();
  }
  
  initializeEngine() {
    const velocity = _.has(this.dataset, 'velocity') ? parseInt(this.dataset['velocity']) : undefined;
    const stopOnError = this.dataset['stoponerror'] || undefined;
    const time = _.has(this.dataset, 'time') ? parseInt(this.dataset['time']) : undefined;
    const dt = _.has(this.dataset, 'dt') ? parseFloat(this.dataset['dt']) : undefined;
    this.engine = new Engine(velocity, () => this.collectCells(), stopOnError, time, dt);
  }
  
  initializeController() {
    const { engine } = this;
    const controller = this.get('#controller');
    controller.initializeEngine(engine);
    const hideController = !!this.hasAttribute('data-hide-controller');
    if (hideController) controller.style.display = 'none';
  }
  
  initializeContainerRoot() {
    const { parentElement } = this;
    if (parentElement.id === 'container-root') {
      parentElement.style.width = '100%';
      parentElement.style.height = '100%';
    }
  }
  
  initializeHistory() {
    this.history = new History(() => this.getInnerHTML());
  }
  
  attachedCallback() {
    this.initializeHistory();
  }
  
  detachedCallback() {
    const { engine, history } = this;
    engine.stop();
    history.shutdown();
  }
  
  livelyPrepareSave() {
    const { engine: { stopOnError, time, timeDeltaPerStepInSeconds, velocity } } = this;
    this.dataset['velocity'] = velocity;
    this.dataset['stoponerror'] = stopOnError;
    this.dataset['time'] = time;
    this.dataset['dt'] = timeDeltaPerStepInSeconds;
  }
  
  // event listener
  onKeyDown(event) {
    const { engine } = this;
    if(this.isCellFocusActive() || this.get('#controller').isFocused()) return;
    let matched = true;
    switch (event.key) {
      case ' ':
        engine.toggleStartStop();
        break;
      case '+':
        engine.increaseVelocity();
        break;
      case '-':
        engine.decreaseVelocity();
        break;
      case 's':
        engine.step();
        break;
      case 'r':
        this.reset();
        break;
      case 'a':
        this.addCell();
        break;
      default:
        matched = false;
    }
    if (matched) event.preventDefault();
  }
  
  // other
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  collectCells() {
    return [...this.querySelectorAll('lively-simulation-cell')];
  }
  
  addCell(event) {
    return Promise
      .resolve(<lively-simulation-cell></lively-simulation-cell>)
      .then(cell => {
        this.appendChild(cell);
        cell.setName(this.ensureUniqueCellName(cell.getName()));
        if (!event) return;
        cell.startGrabbing(event);
      });
  }
  
  ensureUniqueCellName(cellNameProposal, counterSlug = 1) {
    const cellNameProposalWithSlug = 
        counterSlug > 1 ? `${cellNameProposal} (${counterSlug})` : cellNameProposal;
    const cellNames = _.concat(
      _.map(this.collectCells(), cell => this.toAlphaNumeric(cell.getName().toLowerCase())), 
      RESERVED_CELL_NAMES
    );
    const sameNameCount = _.filter(cellNames, name => name === this.toAlphaNumeric(cellNameProposalWithSlug.toLowerCase())).length;
    if (sameNameCount - (counterSlug === 1) <= 0) return cellNameProposalWithSlug;
    return this.ensureUniqueCellName(cellNameProposal, counterSlug + 1);
  }
  
  toAlphaNumeric(str) {
    return str.replace(/\W/g, '');
  }
  
  revert(snapshot) {
    this.innerHTML = snapshot === EMPTY_PLACEHOLDER ? '' : snapshot;
  }
  
  isCellFocusActive() {
    const cells = this.collectCells();
    return _.some(cells, cell => cell.isFocused());
  }
  
  cloneCell(event, cell) {
    cell.livelyPrepareSave();
    const clone = cell.cloneNode();
    this.appendChild(clone);
    setTimeout(() => {
      clone.setName(this.ensureUniqueCellName(clone.getName()));
      clone.startGrabbing(event);
    }, 0);
  }
  
  executeSingleCell(cell) {
    const { engine } = this;
    return engine.step([ cell ]);
  }
  
  reset() {
    const { engine } = this;
    engine.setTime(0);
    _.forEach(this.collectCells(), cell => cell.clearLog());
  }
  
  getInnerHTML() {
    const { innerHTML } = this;
    return innerHTML.length ? innerHTML : EMPTY_PLACEHOLDER;
  }
  
  getForegroundCell() {
    return _.maxBy(this.collectCells(), cell => parseInt(cell.style.zIndex || 1));
  }
  
  getEngine() {
    const { engine } = this;
    return engine;
  }
  
  getHistory() {
    const { history } = this;
    return history.get();
  }
  
  toggleHighlight(cellRef) {
    const { currentHighlight } = this;
    this.currentHighlight = (currentHighlight === cellRef) ? undefined : cellRef;
    const cells = this.collectCells();
    _.forEach(cells, cell => cell.highlight(this.currentHighlight));
    
  }
}