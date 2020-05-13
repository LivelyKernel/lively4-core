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
    this.reset = this.reset.bind(this);
    this.initializeEngine();
    this.initializeController();
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
  initializeHistory() {
    this.history = new History(() => this.getInnerHTML());
  }
  
  initializeEngine() {
    const velocity = this.getJSONAttribute('data-velocity') || undefined;
    this.engine = new Engine(velocity, this.collectCells);
  }
  
  initializeController() {
    const { engine, history, shadowRoot } = this;
    const controller = shadowRoot.querySelector('#controller');
    controller.engine = engine;
    controller.onAddCell = this.addCell;
    controller.onReset = this.reset;
    controller.getHistory = history.get;
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
  
  addCell() {
    return Promise
      .resolve(<lively-simulation-cell></lively-simulation-cell>)
      .then(cell => this.appendChild(cell));
  }
  
  reset(snapshot) {
    this.innerHTML = snapshot === EMPTY_PLACEHOLDER ? '' : snapshot;
  }
  
  isCellFocusActive() {
    const cells = this.collectCells();
    return _.some(cells, cell => cell.isFocused());
  }
  
  // getter & setter
  getInnerHTML() {
    const { innerHTML } = this;
    return innerHTML.length ? innerHTML : EMPTY_PLACEHOLDER;
  }
  
  /* Lively-specific API */
  livelyPrepareSave() {
    const { engine: { velocity } } = this;
    this.setJSONAttribute('data-velocity', velocity);
  } 
}