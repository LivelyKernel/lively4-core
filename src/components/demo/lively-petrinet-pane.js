import Morph from "src/components/widgets/lively-morph.js"


export default class LivelyPetrinetPane extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetPane";
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