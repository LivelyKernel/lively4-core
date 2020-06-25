import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"



export default class LivelyPetrinetProbTransition extends Morph {
  
  
  
  // Initialization
  
  
  

  async initialize() {
    this.windowTitle = "LivelyPetrinetProbTransition";
    this.registerButtons();
    if (!this.componentId) {
       this.componentId = this.get("lively-petrinet-transition").componentId;
    }
    
    const inputProbability = this.get("#inputProbability");

    
    inputProbability.addEventListener("change", (evt) => this.onProbabilityChange(evt));
    lively.addEventListener("dragAndDrop", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
    
    const probability = this.getAttribute("probability");
    if (probability) {
      inputProbability.value = probability;
    }
}
  
  
  // Access
  
  get componentId() {
    return this.getAttribute("componentId");
  }
  
  set componentId(id) {
    this.setAttribute("componentId", id);
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
  
  
  
  
  graphicElement() {
    return this.get("lively-petrinet-transition").graphicElement();
  }
  
  onProbabilityChange(evt) {
    this.setAttribute("probability", this.get("#inputProbability").value);
  }
  

  

}