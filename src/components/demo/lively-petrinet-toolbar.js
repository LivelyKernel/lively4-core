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
  
  getCurrentState() {
    return this.get("#simulationSlider").value;
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
    this.petrinet.setState(simulationStep-1);
  }
  
  initializeSimulationButtons() {
    let startButton = this.get("#startButton");
    let runButton = this.get("#runButton");
    
    startButton.innerHTML = START;
    runButton.innerHTML = RUN;
  }
  
  async onStep() {
    await this.petrinet.onStep();
  }
  
  async onStartButton() {
    let startButton = await this.get("#startButton");
    let runButton = await this.get("#runButton");

    if (!this.isStarted()) {
      startButton.innerHTML = STOP;
      startButton.style.backgroundColor = "#FFCC80";
      this.petrinet.start();
    } else {
      // Change Start Button
      startButton.innerHTML = START;
      startButton.style.backgroundColor ="#C5E1A5";
      // Change Run Button
      this.get("#runButton").innerHTML = RUN;
      runButton.style.backgroundColor = "#C5E1A5";
      this.petrinet.setState(0);
      this.updateSlider(1);

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
      this.petrinet.resetToState(this.getCurrentState())
      runButton.innerHTML = PAUSE;
      runButton.style.backgroundColor = "#FFCC80";
      
    } else {
      runButton.innerHTML = RUN;
      runButton.style.backgroundColor = "#C5E1A5";
    }
    
        
    // StartRunning
    while (this.isStarted() && this.isRunning()) {
      this.updateSlider(this.petrinet.getCurrentStep());
      await this.onStep();
      await this.sleep(100);
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