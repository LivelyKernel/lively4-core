"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Engine from 'demos/engery-sim/engine.js';
import History from 'demos/engery-sim/history.js';
import _ from 'src/external/lodash/lodash.js';

const EMPTY_PLACEHOLDER = 'EMPTY';
export default class LivelySimulation extends Morph {
  
  // lifecycle
  initialize() {
    this.windowTitle = "LivelySimulationComponent";
    lively.html.registerKeys(this);
    this.collectCells = this.collectCells.bind(this);
    this.addCell = this.addCell.bind(this);
    this.revert = this.revert.bind(this);
    this.onStopOnError = this.onStopOnError.bind(this);
    this.initializeEngine();
    this.initializeController();
    this.initializeContainerRoot();
  }
  
  attachedCallback() {
    this.initializeHistory();
  }
  
  detachedCallback() {
    const { engine, history } = this;
    engine.stop();
    history.shutdown();
  }
  
  // initialization
  initializeContainerRoot() {
    const { parentElement } = this;
    if (parentElement.id === 'container-root')
      parentElement.style.height = '100%';
  }
  initializeHistory() {
    this.history = new History(() => this.getInnerHTML());
  }
  
  initializeEngine() {
    const velocity = this.getJSONAttribute('data-velocity') || undefined;
    const stopOnError = this.getJSONAttribute('data-stop-on-error') || undefined;
    this.engine = new Engine(velocity, this.collectCells, stopOnError);
  }
  
  initializeController() {
    const { engine, history, shadowRoot } = this;
    const controller = shadowRoot.querySelector('#controller');
    const hideController = !!this.hasAttribute('data-hide-controller');
    if (hideController) {
      controller.style.display = 'none';
    } else {
      controller.engine = engine;
      controller.onAddCell = this.addCell;
      controller.onRevert = this.revert;
      controller.getHistory = history.get;
      controller.onStopOnError = this.onStopOnError;
    }
    
  }
  
  // event listener
  onKeyDown(event) {
    const { engine } = this;
    if(this.isCellFocusActive()) return;
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
        engine.reset();
        break;
      case 'a':
        this.addCell();
        break;
      default:
        matched = false;
    }
    if (matched) event.preventDefault();
  }
  
  //
  collectCells() {
    return Array.from(this.querySelectorAll('lively-simulation-cell'));
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
  
  revert(snapshot) {
    this.innerHTML = snapshot === EMPTY_PLACEHOLDER ? '' : snapshot;
  }
  
  isCellFocusActive() {
    const cells = this.collectCells();
    return _.some(cells, cell => cell.isFocused());
  }
  
  onStopOnError(stopOnError) {
    const { engine } = this;
    engine.stopOnError = stopOnError;
  }
  
  ensureUniqueCellName(cellNameProposal, counterSlug = 1) {
    const cellNameProposalWithSlug = 
        counterSlug > 1 ? `${cellNameProposal} (${counterSlug})` : cellNameProposal;
    const cellNames = _.map(this.collectCells(), cell => cell.getName());
    const sameNameCount = _.filter(cellNames, name => 
                                   name === cellNameProposalWithSlug).length;
    if (sameNameCount - (counterSlug === 1) <= 0) return cellNameProposalWithSlug;
    return this.ensureUniqueCellName(cellNameProposal, counterSlug + 1);
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
  
  // getter & setter
  getInnerHTML() {
    const { innerHTML } = this;
    return innerHTML.length ? innerHTML : EMPTY_PLACEHOLDER;
  }
  
  getForegroundCell() {
    return _.maxBy(this.collectCells(), cell => parseInt(cell.style.zIndex || 1));
  }
  
  /* Lively-specific API */
  livelyPrepareSave() {
    const { engine: { stopOnError, velocity } } = this;
    this.setJSONAttribute('data-velocity', velocity);
    this.setJSONAttribute('data-stop-on-error', stopOnError);
  } 
}