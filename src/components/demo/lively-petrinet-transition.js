import Morph from "src/components/widgets/lively-morph.js"
import {Helper} from "src/components/demo/lively-petrinet-helper.js"

export default class LivelyPetrinetTransition extends Morph {
  

  initialize() {
    if (!this.componentId) {
      this.componentId = Math.random().toString(36).substring(7);
    }
    this.windowTitle = "LivelyPetrinetTransition";
    this.registerButtons();
    
    const inputLabel = this.get("#inputLabel");
    const inputProbability = this.get("#inputProbability");
    
    // Register Listeners
    
    inputLabel.addEventListener("change", (evt) => this.onLabelChange(evt));
    inputProbability.addEventListener("change", (evt) => this.onProbabilityChange(evt));
    lively.addEventListener("dragAndDrop", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
    
    // Initialize Displayed Values
    
    const label = this.getAttribute("label")
    const probability = this.getAttribute("probability");
    
    if (label) {
      inputLabel.value = label;
    }
    
    if (probability) {
      inputProbability.value = probability;
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
  
  
  onProbabilityChange(evt) {
    this.setAttribute("probability", this.get("#inputProbability").value);
  }
  
  
  
  
  graphicElement() {
    return this.get("#transition");
  }
  
  
    isActiveTransition(){
      const randomNumber = Math.random();
      var prob = this.get("#inputProbability").value;
      if( randomNumber <= prob){
        return true
      } else {
        return false
      }
  }
  
}