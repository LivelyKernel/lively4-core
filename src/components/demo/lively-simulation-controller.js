"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

export default class LivelySimulationController extends Morph {
  
  // lifecycle
  async initialize() {
    this.updateCheckpointOptions = this.updateCheckpointOptions.bind(this);
    this.onRevertSelectChange = this.onRevertSelectChange.bind(this);
    this.registerButtons();
    this.registerSliders();
    this.registerCheckBoxes();
    this.initializeRevertSelect();
  }
  
  attachedCallback() {
    this.registerIsRunningUpdater();
    this.registerVelocityUpdater();
    this.registerStopOnErrorUpdater();
  }
  
  detachedCallback() {
    this.isRunningUpdater.dispose();
    this.velocityUpdater.dispose();
  }
  
  // initialization
  registerCheckBoxes() { // based on registerButtons from Morph class
    Array.from(this.shadowRoot.querySelectorAll('input[type="checkbox"]')).forEach(node => {
      var name = node.id;
      var funcName = name.replace(/^./, c => 'on'+ c.toUpperCase());
      node.addEventListener("click", evt => {
        if (this[funcName] instanceof Function) {
          this[funcName](evt);
        } else {
          alert('No callback: ' +  funcName);
        }
      });
    });
  }
  
  registerSliders() { // based on registerButtons from Morph class
    Array.from(this.shadowRoot.querySelectorAll('input[type="range"]')).forEach(node => {
      var name = node.id;
      var funcName = name.replace(/^./, c => 'on'+ c.toUpperCase());
      node.addEventListener("input", evt => {
        if (this[funcName] instanceof Function) {
          this[funcName](evt);
        } else {
          alert('No callback: ' +  funcName);
        }
      });
    });
  }
  
  registerIsRunningUpdater() {
    this.isRunningUpdater = aexpr(() => this.engine.isRunning).onChange(isRunning => {
      const startStopButton = this.getStartStopButton();
      startStopButton.textContent = isRunning ? 'Stop' : 'Start';
    });
  }
  
  registerVelocityUpdater() {
    this.velocityUpdater = aexpr(() => this.engine.velocity).onChange(velocity => {
      const velocitySlider = this.getVelocitySlider();
      velocitySlider.value = velocity;
      var velocitySpan = this.getVelocitySpan();
      velocitySpan.innerHTML = velocity;
    });
  }
  
  registerStopOnErrorUpdater() {
    this.stopOnErrorUpdater = aexpr(() => this.engine.stopOnError).onChange(stopOnError => {
      const stopOnErrorCheckBox = this.getStopOnErrorCheckBox();
      stopOnErrorCheckBox.checked = stopOnError;
    });
  }
  
  initializeRevertSelect() {
    const revertSelect = this.getRevertSelect();
    revertSelect.addEventListener('click', this.updateCheckpointOptions);
    revertSelect.addEventListener('change', this.onRevertSelectChange);
  }
  
  // event listener
  onStartStopButton() {
    const { engine } = this;
    engine.toggleStartStop();
  }
  
  onStepButton() {
    const { engine } = this;
    engine.step();
  }
  
  onVelocitySlider({ target: { value: velocity } }) {
    const { engine } = this;
    engine.setVelocity(velocity);
  }
  
  onAppendCellButton(event) {
    const { onAddCell } = this;
    onAddCell(event);
  }
  
  onRevertSelectChange({ target: { value: snapshot } }){
    const { onRevert } = this;
    onRevert(snapshot);
    this.resetRevertSelect();
  }
  
  onStopOnErrorCheckBox({ target: { checked: stopOnError } }) {
    const { onStopOnError } = this;
    onStopOnError(stopOnError);
  }
  
  //
  updateCheckpointOptions() {
    const revertSelect = this.getRevertSelect();
    const options = this.generateCheckpointOptions();
    this.resetRevertSelect();
    _.forEach(options, option => revertSelect.appendChild(option));
  }
  
  resetRevertSelect() {
    const revertSelect = this.getRevertSelect();
    const { children } = revertSelect;
    const checkpointOptions = _.takeRight(children, children.length - 1);
    _.forEach(checkpointOptions, child => child.remove());
    revertSelect.value = '';
  }
  
  generateCheckpointOptions() {
    const { getHistory } = this;
    const history = _.filter(getHistory());
    return _.map(history, ({ snapshot, timestamp }) => (
      <option value={snapshot}>
        { timestamp }
      </option>
    ));
  }
  
  // getter & setter
  getRevertSelect() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#revertSelect');
  }
  
  getVelocitySlider() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#velocitySlider');
  }
  
  getVelocitySpan() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#velocitySpan');
  }
  
  getStartStopButton() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#startStopButton');
  }
  
  getStopOnErrorCheckBox() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#stopOnErrorCheckBox');
  }
}