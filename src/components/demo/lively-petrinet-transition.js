import Morph from "src/components/widgets/lively-morph.js"
import {Helper} from "src/components/demo/lively-petrinet-helper.js"

export default class LivelyPetrinetTransition extends Morph {
  

  initialize() {
    this.componentId = Helper.getRandomId();
    this.windowTitle = "LivelyPetrinetTransition";
    this.registerButtons();
    
    const inputLabel = this.get("#inputLabel");
    
    // Register Listeners
    
    inputLabel.addEventListener("change", (evt) => this.onLabelChange(evt));
    
    // Initialize Displayed Values
        
    if (this.label) {
      inputLabel.value = this.label;
    }
  } 
  
  get parentTransition() {
    const probTransition = lively.query(this, "lively-petrinet-prob-transition");
    const codeTransition = lively.query(this, "lively-petrinet-code-transition");
    if (codeTransition === undefined && probTransition === undefined) {
      lively.error("Found no parent transition");
    }
    if (codeTransition != undefined && probTransition != undefined) {
      lively.error("Found two parent transitions");
    }
    if (codeTransition != undefined) {
      return codeTransition;
    }
    if (probTransition != undefined) {
      return probTransition;
    }
  }
  
  get label() {
    return this.parentTransition.getAttribute("label");
  }
  
  set label(textLabel) {
    this.parentTransition.setAttribute("label", textLabel);
  }
  
  onLabelChange(evt) {
    this.label = this.get("#inputLabel").value;
  }
  
  
  
  
  
  graphicElement() {
    return this.get("#transition");
  }
  
}