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
    this.get("#delete").addEventListener( "click", () => this.onDelete());
    this.stepState = this.petrinet.stepUntilFired();
  }
  
  
  get petrinet() {
    const petrinet = lively.query(this, "lively-petrinet");
    if (petrinet === undefined) {
      lively.error("Error: No Petrinet")
    }
    return petrinet;
  }
  
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  onStep() {
    this.petrinet.onStep();
  }
  
  
  async onStartButton() {
    //Change Text
    let startButton = this.get("#startButton");
    if (!this.isStarted()) {
      startButton.innerHTML = STOP;
    } else {
      startButton.innerHTML = START;
      this.get("#runButton").innerHTML = RUN;
    }
    
    if (this.isStarted()) {
      this.petrinet.start();
    } else {
      this.petrinet.reset();
    }
    
  }
  
  onStepButton() {
    if (this.isStarted()) {
      this.stepState.next();
    }
  }
  
 async onRunButton(){
   if (!this.isStarted()) {
     return;
   }
   
    let runButton = this.get("#runButton");
    if (!this.isRunning()) {
      runButton.innerHTML = PAUSE;
    } else {
      runButton.innerHTML = RUN;
    }
    
        
    // StartRunning
    while (this.isStarted() && this.isRunning()) {
      this.onStep();
      await this.sleep(1000);
    }
  }
  
  isRunning() {
    return this.get("#runButton").innerHTML == PAUSE;
  }
  
  isStarted() {
    return this.get("#startButton").innerHTML == STOP;
  }
  
  onDelete(){
    //lively.notify("Hallo");
    this.petrinet.deleteSelectedElement();
  }
  
  

  
}