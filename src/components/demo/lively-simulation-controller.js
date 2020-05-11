"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelySimulationController extends Morph {
  
  // lifecycle
  async initialize() {
    this.registerButtons();
    this.registerSliders();
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
      const startStopButton = this.shadowRoot.querySelector('#startStopButton');
      startStopButton.textContent = isRunning ? 'Stop' : 'Start';
    });
  }
  
  registerVelocityUpdater() {
    this.velocityUpdater = aexpr(() => this.engine.velocity).onChange(velocity => {
      const velocitySlider = this.shadowRoot.querySelector('#velocitySlider');
      velocitySlider.value = velocity;
      var velocitySpan = this.shadowRoot.querySelector('#velocitySpan');
      velocitySpan.innerHTML = velocity;
    });
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
  
  onResetButton() {
    const { onReset } = this;
    onReset();
  }
  
  onVelocitySlider({ target: { value: velocity } }) {
    const { engine } = this;
    engine.setVelocity(velocity);
  }
  
  onAppendCellButton() {
    const { onAddCell } = this;
    onAddCell();
  }
}