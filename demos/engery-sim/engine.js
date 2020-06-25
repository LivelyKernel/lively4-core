"enable aexpr";

import _ from 'src/external/lodash/lodash.js';

const MAX_VELOCITY = 60;
const MIN_VELOCITY = 1;
const MILLISECONDS_PER_SECOND = 1000;

class Engine {
  
  constructor(velocity = MIN_VELOCITY, collectCells = () => [], stopOnError = false, time = 0, timeDeltaPerStepInSeconds = 1) {
    this.collectCells = collectCells;
    this.velocity = velocity;
    this.stopOnError = stopOnError;
    this.time = time;
    this.timeDeltaPerStepInSeconds = timeDeltaPerStepInSeconds;
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
  
  step(limitExecution) {
    const cells = this.collectCells();
    const sortedCells = _.sortBy(cells, ['offsetTop', 'offsetLeft']);
    const prevState = this.collectState(sortedCells);
    const time = this.injectTime(prevState, _.isEmpty(limitExecution));
    const executionCells = limitExecution || sortedCells;
    return this.executeAllCells(executionCells, prevState, time)
      .then(nextState => this.updateCellStates(sortedCells, nextState))
      .then(() => this.stepCounter++);
  }
  
  injectTime(state, incrementTime) {
    const { time, timeDeltaPerStepInSeconds } = this;
    if (incrementTime)
      this.time = time + timeDeltaPerStepInSeconds * MILLISECONDS_PER_SECOND;
    state['simulation'] = { time: this.time, dt: timeDeltaPerStepInSeconds };
    return this.time;
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
  
  setTime(time) {
    this.time = time;
  }
  
  setTimeDeltaPerStepInSeconds(dt) {
    this.timeDeltaPerStepInSeconds = dt;
  }
  
  updateCellStates(cells, state) {
    _.forEach(cells, cell =>
      cell.setState(state[cell.getNormalizedName()]));
  }

  collectState(cells) {
    return _.reduce(
      cells, 
      (partialState, cell) => { 
        partialState[cell.getNormalizedName()] = cell.getState();
        return partialState;
      },
      {}
    );
  }
  
  executeAllCells(cells, state, time) {
    const { stopOnError } = this;
    return _.reduce(
      cells, 
      (statePromise, cell) => 
      statePromise
        .then(state => cell.execute(time, state))
        .catch(({ state }) => (!stopOnError || !this.stop()) && state),
      Promise.resolve(state)
    );
  }
}

export default Engine;