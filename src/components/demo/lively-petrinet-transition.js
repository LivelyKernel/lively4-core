import Morph from "src/components/widgets/lively-morph.js"
import {Helper} from "src/components/demo/lively-petrinet-helper.js"

export default class LivelyPetrinetTransition extends Morph {
  

  initialize() {
    if (!this.componentId) {
      this.componentId = Helper.getRandomId();
    }
    this.windowTitle = "LivelyPetrinetTransition";
    this.registerButtons();
    
    const inputLabel = this.get("#inputLabel");
    
    // Register Listeners
    
    inputLabel.addEventListener("change", (evt) => this.onLabelChange(evt));
    
    // Initialize Displayed Values
    
    const label = this.getAttribute("label")
    
    if (label) {
      inputLabel.value = label;
    }
    
    
  } 
  
  
  get componentId() {
    return this.getAttribute("componentId");
  }

  set componentId(id) {
    this.setAttribute("componentId", id);
  }
  
  onLabelChange(evt) {
    this.setAttribute("label", this.get("#inputLabel").value);
  } 
  
  
  
  
  
  graphicElement() {
    return this.get("#transition");
  }
  
}