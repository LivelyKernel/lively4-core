"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

export default class LivelySimulationController extends Morph {
  
  // life cycle
  initialize() {
    this.initializeStartStopButton();
    this.initializeStepButton();
    this.initializeAppendCellButton();
    this.initializeVelocitySlider();
    this.initializeRevertSelect();
    this.initializeStopOnErrorCheckBox();
  }
  
  initializeStartStopButton() {
    const startStopButton = this.get('#startStopButton');
    startStopButton.addEventListener('click', () => this.onStartStopButton());
  }
  
  initializeStepButton() {
    const stepButton = this.get('#stepButton');
    stepButton.addEventListener('click', () => this.onStepButton());
  }
  
  initializeAppendCellButton() {
    const appendCellButton = this.get('#appendCellButton');
    appendCellButton.addEventListener('click', (event) => this.onAppendCellButton(event));
  }
  
  initializeVelocitySlider() {
    const velocitySlider = this.get('#velocitySlider');
    velocitySlider.addEventListener('input', (event) => this.onVelocitySlider(event));
  }
  
  initializeRevertSelect() {
    const revertSelect = this.get('#revertSelect');
    revertSelect.addEventListener('click', () => this.onRevertSelect());
    revertSelect.addEventListener('change', (event) => this.onRevertSelectChange(event));
  }
  
  initializeStopOnErrorCheckBox() {
    const stopOnErrorCheckBox = this.get('#stopOnErrorCheckBox');
    stopOnErrorCheckBox.addEventListener('change', ({ target: { checked: stopOnError }}) => this.onStopOnError(stopOnError))
  }
  
  initializeEngine(engine) {
    this.registerIsRunningUpdater(engine);
    this.registerVelocityUpdater(engine);
    this.registerStopOnErrorUpdater(engine);
  }
  
  detachedCallback() {
    if (this.isRunningUpdater) this.isRunningUpdater.dispose();
    if (this.velocityUpdater) this.velocityUpdater.dispose();
    if (this.stopOnErrorUpdater) this.stopOnErrorUpdater.dispose();
  }
  
  registerIsRunningUpdater(engine) {
    this.isRunningUpdater = aexpr(() => engine.isRunning).onChange(isRunning => {
      const startStopButton = this.get('#startStopButton');
      startStopButton.textContent = isRunning ? 'Stop' : 'Start';
    });
  }
  
  registerVelocityUpdater(engine) {
    this.velocityUpdater = aexpr(() => engine.velocity).onChange(velocity => {
      const velocitySlider = this.get('#velocitySlider');
      velocitySlider.value = velocity;
    });
  }
  
  registerStopOnErrorUpdater(engine) {
    this.stopOnErrorUpdater = aexpr(() => engine.stopOnError).onChange(stopOnError => {
      const stopOnErrorCheckBox = this.get('#stopOnErrorCheckBox');
      stopOnErrorCheckBox.checked = stopOnError;
    });
  }
  
  // event listener
  onStartStopButton() {
    const engine = this.getEngine();
    if (!engine) return;
    engine.toggleStartStop();
  }
  
  onStepButton() {
    const engine = this.getEngine();
    if (!engine) return;
    engine.step();
  }
  
  onAppendCellButton(event) {
    const simulation = this.getSimulation();
    if (simulation && simulation.addCell) simulation.addCell(event);
  }
  
  onVelocitySlider({ target: { value: velocity } }) {
    const velocitySpan = this.get('#velocitySpan');
    velocitySpan.innerText = velocity;
    const engine = this.getEngine();
    if (!engine) return;
    engine.setVelocity(velocity);
  }
  
  onRevertSelect() {
    const revertSelect = this.get('#revertSelect');
    const options = this.generateCheckpointOptions();
    this.resetRevertSelect();
    _.forEach(options, option => revertSelect.appendChild(option));
  }
  
  onRevertSelectChange({ target: { value: snapshot } }){
    const simulation = this.getSimulation();
    if (simulation && simulation.revert) simulation.revert(snapshot);
    this.resetRevertSelect();
  }
  
  onStopOnError(stopOnError) {
    const engine = this.getEngine();
    if (!engine) return;
    engine.stopOnError = stopOnError;
  }
  
  // other
  resetRevertSelect() {
    const revertSelect = this.get('#revertSelect');
    const { children } = revertSelect;
    const checkpointOptions = _.takeRight(children, children.length - 1);
    _.forEach(checkpointOptions, child => child.remove());
    revertSelect.value = '';
  }
  
  generateCheckpointOptions() {
    const history = _.filter(this.getHistory());
    return _.map(history, ({ snapshot, timestamp }) => (
      <option value={snapshot}>
        { timestamp }
      </option>
    ));
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  getSimulation() {
    return this.getRootNode().host;
  }
  
  getEngine() {
    const simulation = this.getSimulation();
    return simulation && simulation.getEngine && simulation.getEngine();
  }
  
  getHistory() {
    const simulation = this.getSimulation();
    return simulation && simulation.getHistory && simulation.getHistory();
  }
}