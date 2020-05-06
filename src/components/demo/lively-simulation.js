"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Engine from 'demos/engery-sim/engine.js';
import _ from 'src/external/lodash/lodash.js'

export default class LivelySimulation extends Morph {
  
  // lifecycle
  initialize() {
    this.windowTitle = "LivelySimulationComponent";
    lively.html.registerKeys(this);
    this.reset();
  }
  
  detachedCallback() {
    const { engine } = this;
    engine.stop(); 
  }
  
  // initialization
  
  initializeCells() {
    const { shadowRoot } = this;
    const cellsContainer = shadowRoot.querySelector('#cells');
    const cells = Array.from(this.querySelectorAll('lively-simulation-cell'));
    cellsContainer.innerHTML = '';
    _.forEach(cells, cell => cellsContainer.appendChild(cell.cloneNode(true)));
  }
  
  initializeEngine() {
    const { shadowRoot } = this;
    const velocity = this.getJSONAttribute('data-velocity') || 1;
    const cells = Array.from(shadowRoot.querySelectorAll('lively-simulation-cell'));
    this.engine = new Engine(velocity, cells); 
  }
  
  registerController() {
    const { engine, shadowRoot } = this;
    const controller = shadowRoot.querySelector('#controller');
    controller.engine = engine;
    controller.onAppendCell = () => this.appendCell();
    controller.onReset = () => this.reset();
  }
  
  // event listener
  
  onKeyDown(event) {
    const { engine } = this;
    if (this.someCellHasFocus()) return;
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
        this.appendCell();
        break;
    }
    event.preventDefault();
  }
  
  async appendCell() {
    const { engine, shadowRoot } = this;
    const cell = await (<lively-simulation-cell></lively-simulation-cell>);
    engine.appendCell(cell);
    const cells = shadowRoot.querySelector('#cells');
    cells.appendChild(cell);
  }
  
  reset() {
    const { engine } = this;
    if (engine) engine.stop();
    this.initializeCells();
    this.initializeEngine();
    this.registerController();
  }
  
  // helper
  someCellHasFocus() {
    const { shadowRoot } = this;
    const cells = Array.from(shadowRoot.querySelectorAll('lively-simulation-cell'));
    return _.some(cells, cell => cell.isFocused());
  }

  /* Lively-specific API */

  livelyPrepareSave() {
    const { engine: { velocity }, shadowRoot } = this;
    const cells = shadowRoot.querySelector('#cells');
    _.forEach(cells.children, cell => cell.livelyPrepareSave());
    this.innerHTML = cells.innerHTML;
    this.setJSONAttribute('data-velocity', velocity);
  }  
}