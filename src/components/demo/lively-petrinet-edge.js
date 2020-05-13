import Morph from "src/components/widgets/lively-morph.js"


export default class LivelyPetrinetEdge extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetEdge";
    this.registerButtons();
  }
  
  attachedCallback() {
  }
  
  detachedCallback() {
  }
  
  
  onAddButton() {
    this.addBall()
  }

}