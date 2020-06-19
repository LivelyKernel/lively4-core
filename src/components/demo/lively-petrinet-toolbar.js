import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';

const START = "Start";
const STOP = "Stop";
const STEP = "Step";
const RUN = "Run";
const PAUSE = "Pause";



export default class LivelyPetrinetToolbar extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetToolbar";
    this.registerButtons();
    
    this.initializeSimulationSlider();
    this.initializeSimulationButtons();
    
    this.get("#delete").addEventListener( "click", () => this.onDelete());
    // We use the yield keyword, so we have to keep a reference on the function
    this.stepState = this.petrinet.stepUntilFired();
    this.updateSlider(this.petrinet.getCurrentStep());
  }
  
  
  
  // Access
  
  
  
  get petrinet() {
    const petrinet = lively.query(this, "lively-petrinet");
    if (petrinet === undefined) {
      lively.error("Error: No Petrinet")
    }
    return petrinet;
  }
  
  isStarted() {
    return this.get("#startButton").innerHTML == STOP;
  }
  
  isRunning() {
    return this.get("#runButton").innerHTML == PAUSE;
  }
  
  
  
  
  // Simulation
  
  
  
  updateSlider(maxStep) {
    this.get("#simulationSlider").max = maxStep;
    this.get("#simulationSlider").value = maxStep;
    this.get("#simulationState").innerText = maxStep;
  }
  
  initializeSimulationSlider() {
    const simulationSlider = this.get('#simulationSlider');
    simulationSlider.addEventListener('input', (event) => this.onSimulationSlider(event));
  }
  
  onSimulationSlider({ target: { value: simulationStep } }) {
    const simulationState = this.get('#simulationState');
    simulationState.innerText = simulationStep;
    this.petrinet.setState(simulationStep);
  }
  
  initializeSimulationButtons() {
    let startButton = this.get("#startButton");
    let runButton = this.get("#runButton");
    
    startButton.innerHTML = START;
    runButton.innerHTML = RUN;
  }
  
  onStep() {
    this.petrinet.onStep();
  }
  
  async onStartButton() {
    let startButton = await this.get("#startButton");

    if (!this.isStarted()) {
      startButton.innerHTML = STOP;
      this.petrinet.start();
    } else {
      startButton.innerHTML = START;
      this.get("#runButton").innerHTML = RUN;
      this.petrinet.setState(0);
    }
  }
  
  onStepButton() {
    if (this.isStarted()) {
      this.stepState.next();
      const step = this.petrinet.getCurrentStep();
      this.updateSlider(step);
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
      await this.sleep(500);
      this.updateSlider(this.petrinet.getCurrentStep());
    }
    
  }

  
  
  // Toolbar
  
  
  
  onDelete(){
    //lively.notify("Hallo");
    this.petrinet.deleteSelectedElement();
  }

  
  
  // Helper
  
  
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

  

  

  
  

  
}