import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';

const START = "Start";
const STOP = "Stop";
const STEP = "Step";
const RUN = "Run";
const PAUSE = "Pause";



export default class LivelyPetrinetSimulation extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetSimulation";
    this.registerButtons();
  }
  
  setOnStep(onStepFunction) {
    this.onStep = onStepFunction;
    return true;
  }
  
async sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  
  
  async onStartButton() {
    //Change Text
    let startButton = this.get("#startButton");
    if (!this.isStarted()) {
      startButton.innerHTML = STOP;
    } else {
      startButton.innerHTML = START;
    }
    
    // StartRunning
    while (this.isStarted()) {
      this.onStep();
      await this.sleep(1000);
    }
  }
  
  onStepButton() {
    this.onStep()
  }
  
  onPauseButton(){
    let pauseButton = this.get("#pauseButton");
    if (!this.isRunning()) {
      pauseButton.innerHTML = PAUSE;
    } else {
      pauseButton.innerHTML = RUN;
    }
  }
  
  isRunning() {
    return this.get("#pauseButton").innerHTML == PAUSE;
  }
  
  isStarted() {
    return this.get("#startButton").innerHTML == STOP;
  }  

  
}