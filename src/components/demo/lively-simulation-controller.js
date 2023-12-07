/*MD
  ![](https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/screenshots/controller.png){width=500px}
MD*/

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
    this.initializeResetTimeButton();
    this.initializeTimeDeltaInput();
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
  
  initializeResetTimeButton() {
    const resetTimeButton = this.get('#resetTime');
    resetTimeButton.addEventListener('click', () => this.handleResetTime());
  }
  
  initializeTimeDeltaInput() {
    const timeDeltaInput = this.get('#dt');
    timeDeltaInput.addEventListener('change', ({ target: { value: timeDelta }}) => this.handleTimeDelta(timeDelta));
  }
  
  initializeEngine(engine) {
    this.registerIsRunningUpdater(engine);
    this.registerVelocityUpdater(engine);
    this.registerStopOnErrorUpdater(engine);
    this.registerTimeUpdater(engine);
    this.registerTimeDeltaUpdater(engine);
  }
  
  disconnectedCallback() {
    if (this.isRunningUpdater) this.isRunningUpdater.dispose();
    if (this.velocityUpdater) this.velocityUpdater.dispose();
    if (this.stopOnErrorUpdater) this.stopOnErrorUpdater.dispose();
    if (this.timeUpdater) this.timeUpdater.dispose();
    if (this.timeDeltaUpdater) this.timeDeltaUpdater.dispose();
  }
  
  registerIsRunningUpdater(engine) {
    this.isRunningUpdater = aexpr(() => engine.isRunning).dataflow(isRunning => {
      const startStopButton = this.get('#startStopButton');
      startStopButton.textContent = isRunning ? 'Stop' : 'Start';
      if (isRunning) startStopButton.classList.add('stop');
      else startStopButton.classList.remove('stop');
    });
  }
  
  registerVelocityUpdater(engine) {
    this.velocityUpdater = aexpr(() => engine.velocity).dataflow(velocity => {
      const velocitySlider = this.get('#velocitySlider');
      velocitySlider.value = velocity;
      const velocitySpan = this.get('#velocitySpan');
      velocitySpan.innerText = velocity;
    });
  }
  
  registerStopOnErrorUpdater(engine) {
    this.stopOnErrorUpdater = aexpr(() => engine.stopOnError).dataflow(stopOnError => {
      const stopOnErrorCheckBox = this.get('#stopOnErrorCheckBox');
      stopOnErrorCheckBox.checked = stopOnError;
    });
  }
  
  registerTimeUpdater(engine) {
    this.timeUpdater = aexpr(() => engine.time).dataflow(time => {
      const timeSpan = this.get('#time');
      timeSpan.innerText = time;
    });
  }
  
  registerTimeDeltaUpdater(engine) {
    this.timeDeltaUpdater = aexpr(() => engine.timeDeltaPerStepInSeconds).dataflow(dt => {
      const dtInput = this.get('#dt');
      dtInput.value = dt;
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
  
  handleResetTime() {
    const simulation = this.getSimulation();
    if (!simulation.reset) return;
    simulation.reset();
  }
  
  handleTimeDelta(timeDelta) {
    const engine = this.getEngine();
    if (!engine) return;
    try {
      engine.setTimeDeltaPerStepInSeconds(parseFloat(timeDelta));
    } catch (e) { /* ignore */ }
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
  
  isFocused() {
    return this.isChildFocused(this.get('#dt'));
  }
  
  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
}