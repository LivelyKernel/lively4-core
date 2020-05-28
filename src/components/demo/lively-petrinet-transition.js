import Morph from "src/components/widgets/lively-morph.js"

export default class LivelyPetrinetTransition extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetTransition";
    this.registerButtons();
    
  } 
  
async onSaveProbability() {
var x = this.get("#inputProbability").value;  
this.get("#test").innerHTML = x;
}
  
  
  
    isActiveTransition(){
      const min = 1;
      const max = 100;
      const randomNumber = Math.floor(Math.random() * (max - min)) + min;
      var prob = this.get("#inputProbability").value;
      if( randomNumber <= prob){
        return true
      } else {
        return false
      }
  }
  
}