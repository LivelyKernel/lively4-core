/*MD
  ![](https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/screenshots/simulation.png){width=500px}
MD*/

"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Engine from 'demos/lively-simulation/engine.js';
import History from 'demos/lively-simulation/history.js';
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
  
  connectedCallback() {
    this.initializeHistory();
  }
  
  disconnectedCallback() {
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
  
  livelyAcceptsDrop() { return true; }
  
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
      _.map(_.reject(this.collectCells(), cell => cell.isMirrorCell()), cell => this.toAlphaNumeric(cell.getName().toLowerCase())), 
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
  
  mirrorCell(event, cell) {
    cell.setAttribute('data-is-mirror', true);
    cell.livelyPrepareSave();
    const clone = cell.cloneNode();
    this.appendChild(clone);
    setTimeout(() => {
      clone.startGrabbing(event);
      cell.removeAttribute('data-is-mirror');
      cell.livelyPrepareSave();
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
  
  removeMirrorCells(name) {
    const cells = this.collectCells();
    const mirrorCells = _.filter(cells, cell => cell.isMirrorCell() && _.isEqual(cell.getName(), name));
    _.forEach(mirrorCells, mirrorCell => mirrorCell.delete());
  }
  
//   livelyExample() {
//     this.innerHTML = `
//       <lively-simulation-cell style="top: 798.6px; left: 40px; width: 541.453px; height: 261.359px; z-index: 120;" data-name="ResetSimulation" data-state="{}" data-snippet="#Fuel.gas = 5 * 2 * 3600 // two hours gas
// #HeatStorage.energy = 0
// #Battery.energy = 0 
// #ElectricConsumer.consumed = 0
// #ElectricConsumer.demand = 1.5
// #ElectricConsumer.extra = 0
// #HeatConsumer.consumed = 0
// #HeatConsumer.demand = 3
// #HeatConsumer.extra = 0
// #ThermalPowerStation.heat = 0
// #HeatingSystem.heat = 0
// #Battery.max = 0.1 * 3600 // 1h 2kw
// #HeatStorage.max = 0.1 * 3600 // 1h 3kw" data-view="codeView" data-loginterval="1" data-lively-id="db4cfe19-7ed2-4d9b-9b2b-2aa517e80e5f" data-should-skip="true"></lively-simulation-cell><lively-simulation-cell style="top: 320px; left: 23.2561px; width: 246.35px; height: 148.399px; z-index: 119;" data-name="Fuel" data-state="{&quot;gas&quot;:36000}" data-snippet="if (gas < 0) {
//     throw Error(&quot;Gas Empty&quot;)
// }" data-view="codeView" data-loginterval="1" data-lively-id="358a6017-4bb6-4d57-b998-4221423bfda2"><img src="https://image.flaticon.com/icons/svg/2362/2362783.svg" style="position: relative; width: 53px; height: 62px; left: 119px; top: 4px;" class="">
// <div class="lively-text lively-content" contenteditable="true" style="width: 183px;position: absolute;left: 24px;top: -59px;height: 63px;">Click here to see all cell that require fuel<div>|</div></div></lively-simulation-cell><lively-simulation-cell style="top: 498.74px; left: 322.256px; width: 539.826px; height: 279.414px; z-index: 124;" data-name="Thermal Power Station" data-state="{&quot;heat&quot;:0,&quot;factor&quot;:10,&quot;max&quot;:7.5}" data-snippet="var full = max * factor;
// if (heat < full &amp;&amp; #Fuel.gas > max * dt
//     &amp;&amp; (#Battery.energy < 0.9 * #Battery.max )) {
//     var gas = max * dt;
//     #Fuel.gas -= gas;
//     heat += 1.0 * gas
// }
// var delta = heat / factor * dt;
// if (heat > 2) {
//     heat -= delta;
//     if(#HeatStorage.energy < #HeatStorage.max) {
//         #HeatStorage.energy += 0.5 * delta;
//     }
//     if (#Battery.energy < #Battery.max ) {
//         #Battery.energy += 0.4 * delta;
//     }
// }" data-view="codeView" data-loginterval="1" data-lively-id="c6eae5ef-cdc4-46df-9258-c0db109f88b8"><img src="https://image.flaticon.com/icons/svg/857/857761.svg" style="width: 75px;height: 58px;position: relative;left: 10px;top: 0px;"><img src="https://image.flaticon.com/icons/svg/2983/2983973.svg" style="width: 53px;height: 37px;position: absolute;left: 101px;top: 232px;"></lively-simulation-cell><lively-simulation-cell style="top: 79px; left: 348.709px; z-index: 123; width: 500px; height: 264.28px;" data-name="Heating System" data-state="{&quot;heat&quot;:0,&quot;factor&quot;:20,&quot;max&quot;:5}" data-snippet="var full = max  * factor
// if (heat < full &amp;&amp; #Fuel.gas > max * dt &amp;&amp;
//     #HeatStorage.energy < 0.3 * #HeatStorage.max) {
//     var gas = max * dt;
//     #Fuel.gas -= gas;
//     heat += gas;
// }

// var delta = (heat / factor) * dt;
// if (heat > 2 * max  &amp;&amp; #HeatStorage.energy < #HeatStorage.max ) {
//     heat -= delta;
//     #HeatStorage.energy += 0.8 * delta;
// } else {
//     heat -= 0.2 * delta;
// }" data-view="codeView" data-loginterval="1" data-lively-id="80937f3f-2786-45de-8691-c83825696023"><img src="https://image.flaticon.com/icons/svg/857/857761.svg" style="width: 75px; height: 58px; position: relative; left: -2px; top: -2px;">
// <div class="lively-text lively-content" contenteditable="true" style="width: 300px; position: absolute; left: 143px; top: 216px;">A heating system requires fuel and produces heat</div></lively-simulation-cell><lively-simulation-cell style="top: 282px; left: 861.269px; z-index: 125; width: 284.115px; height: 74.4531px;" data-name="Heat Storage" data-state="{&quot;energy&quot;:0,&quot;max&quot;:360}" data-snippet="// Enter simulation code here" data-view="codeView" data-loginterval="1" data-lively-id="79eca28f-b50d-49b9-9d0e-b426c590fb67">
// <img src="https://image.flaticon.com/icons/svg/870/870620.svg" style="width: 28px;height: 44px;position: relative;left: 30px;top: 0;"></lively-simulation-cell><lively-simulation-cell style="top: 394.26px; left: 863px; z-index: 126; width: 164.533px; height: 100px;" data-name="Battery" data-state="{&quot;energy&quot;:0,&quot;max&quot;:360}" data-snippet="" data-view="codeView" data-loginterval="1" data-lively-id="15c89e50-98bf-4476-91fb-eec24c7173da"><img src="https://image.flaticon.com/icons/svg/3165/3165660.svg" style="width: 174px;height: 46px;position: relative;left: -36px;top: 0;"></lively-simulation-cell><lively-simulation-cell style="top: 183px; left: 1191.27px; z-index: 128; width: 468.533px; height: 200px; position: absolute;" data-name="Heat Consumer" data-state="{&quot;consumed&quot;:0,&quot;extra&quot;:0,&quot;demand&quot;:3}" data-snippet="var delta = demand * dt
// if (#HeatStorage.energy > delta) {
//     #HeatStorage.energy -= delta
//     consumed += delta
//     // TODO consume Extra
// } else {
//     extra  +=  delta
//     throw Error(&quot;RoomToCold&quot;)
// }
// " data-view="codeView" data-loginterval="1" data-lively-id="8c62075a-2da9-4c8a-b389-2db5668abc39"><img src="https://image.flaticon.com/icons/svg/1422/1422837.svg" style="width: 48px;height: 38px;position: relative;left: 71px;top: -3px;"></lively-simulation-cell><lively-simulation-cell style="top: 399.735px; left: 1189px; z-index: 127; width: 447.844px; height: 180px;" data-name="Electric Consumer" data-state="{&quot;consumed&quot;:0,&quot;extra&quot;:0,&quot;demand&quot;:1.5}" data-snippet="demand += (Math.random() - 0.5) * 0.01 * dt
// var delta = demand * dt
// if (#Battery.energy > delta) {
//     #Battery.energy -= delta
//     consumed += delta
// } else {
//     extra += delta
//     throw Error(&quot;EngeryToLow&quot;)
// }
// " data-view="codeView" data-loginterval="1" data-lively-id="5ee77098-fadb-4e95-9dea-1870e9af548a"><img src="https://image.flaticon.com/icons/svg/2910/2910875.svg" style="width: 137px;height: 59px;position: relative;left: 163px;top: 0;"></lively-simulation-cell>
// `;
//       this.engine.setVelocity(10);
//       this.engine.stopOnError = false;
//       this.engine.setTimeDeltaPerStepInSeconds(0.1);
//   }
}