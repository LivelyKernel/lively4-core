"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export default class LivelySimulationController extends Morph {
  
  // lifecycle
  async initialize() {
    this.updateCheckpointOptions = this.updateCheckpointOptions.bind(this);
    this.onResetSelectChange = this.onResetSelectChange.bind(this);
    this.registerButtons();
    this.registerSliders();
    this.initializeResetSelect();
  }
  
  attachedCallback() {
    this.registerIsRunningUpdater();
    this.registerVelocityUpdater();
  }
  
  detachedCallback() {
    this.isRunningUpdater.dispose();
    this.velocityUpdater.dispose();
  }
  
  // initialization
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
  
  initializeResetSelect() {
    const resetSelect = this.getResetSelect();
    resetSelect.addEventListener('click', this.updateCheckpointOptions);
    resetSelect.addEventListener('change', this.onResetSelectChange);
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
  
  onAppendCellButton() {
    const { onAddCell } = this;
    onAddCell();
  }
  
  onResetSelectChange({ target: { value: snapshot } }){
    const { onReset } = this;
    onReset(snapshot);
    this.resetResetSelect();
  }
  
  //
  updateCheckpointOptions() {
    const resetSelect = this.getResetSelect();
    const options = this.generateCheckpointOptions();
    this.resetResetSelect();
    _.forEach(options, option => resetSelect.appendChild(option));
  }
  
  resetResetSelect() {
    const resetSelect = this.getResetSelect();
    const { children } = resetSelect;
    const checkpointOptions = _.takeRight(children, children.length - 1);
    _.forEach(checkpointOptions, child => child.remove());
    resetSelect.value = '';
  }
  
  generateCheckpointOptions() {
    const { getHistory } = this;
    const history = _.filter(_.reverse(getHistory()));
    const now = new Date().getTime();
    return _.map(history, ({ snapshot, timestamp }) => (
      <option value={snapshot}>
        { this.readableTimeDifference(now, timestamp) }
      </option>
    ));
  }
  
  readableTimeDifference(now, timestamp) {
    const timeDifferenceInSeconds = Math.abs(timestamp - now) / MILLISECONDS_PER_SECOND;
    const minutes = Math.floor(timeDifferenceInSeconds / SECONDS_PER_MINUTE);
    const seconds = Math.round(timeDifferenceInSeconds - minutes * SECONDS_PER_MINUTE);
    return `${minutes ? `${minutes}min ` : ''}${seconds}s ago`;
  }
  
  // getter & setter
  getResetSelect() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#resetSelect');
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
}