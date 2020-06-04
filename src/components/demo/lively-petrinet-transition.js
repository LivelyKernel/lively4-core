import Morph from "src/components/widgets/lively-morph.js"

export default class LivelyPetrinetTransition extends Morph {
  

  initialize() {
    this.windowTitle = "LivelyPetrinetTransition";
    this.registerButtons();
    
    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    //lively.addEventListener("OnDblClick", this, "dblclick", (evt) => this.onDblClick(evt))
    

    
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