"enable aexpr";

import _ from 'src/external/lodash/lodash.js';

const MAX_VELOCITY = 60;
const MIN_VELOCITY = 1;
const MILLISECONDS_PER_SECOND = 1000;

class Engine {
  
  constructor(velocity = MIN_VELOCITY, cells = []) {
    this.velocity = velocity;
    this.cells = cells;
    this.step = this.step.bind(this);
  }
  
  toggleStartStop() {
    const { isRunning: wasRunning } = this;
    if (wasRunning) this.stop();
    else this.start();
  }
  
  start() {
    const { isRunning } = this;
    if (isRunning) return;
    this.isRunning = true;
    this.simulationLoop = setInterval(this.step, (MILLISECONDS_PER_SECOND / this.velocity));
  }
  
  stop() {
    const { isRunning } = this;
    if (!isRunning) return;
    this.isRunning = false;
    clearInterval(this.simulationLoop);
  }
  
  updateSimulationLoop() {
    const { isRunning } = this;
    if (!isRunning) return;
    this.stop();
    this.start();
  }
  
  step() {
    const prevState = this.collectState();
    const nextState = this.executeAllCells(prevState);
    this.updateCellStates(nextState);
  }
  
  increaseVelocity() {
    const { velocity } = this;
    this.setVelocity(Math.min(MAX_VELOCITY, velocity + 1));
  }
  
  decreaseVelocity() {
    const { velocity } = this;
    this.setVelocity(Math.max(MIN_VELOCITY, velocity - 1));
  }
  
  setVelocity(velocity) {
    this.velocity = velocity;
    this.updateSimulationLoop();
  }
  
  appendCell(cell) {
    const { cells } = this;
    cells.push(cell);
  }
  
  updateCellStates(state) {
    const { cells } = this;
    _.forEach(cells, cell =>
      cell.setState(state[cell.getName()]));
  }
  
  collectState() {
    const { cells } = this;
    return _.reduce(
      cells, 
      (partialState, cell) => { 
        partialState[cell.getName()] = cell.getState();
        return partialState;
      },
      {}
    );
  }
  
  executeAllCells(state) {
    const { cells } = this;
    return _.reduce(
      cells, 
      (scope, cell) => { 
        cell.execute(scope); 
        return scope;
      }, 
      state
    );
  }
}

export default Engine;