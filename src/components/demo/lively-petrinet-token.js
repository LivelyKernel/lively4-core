import Morph from "src/components/widgets/lively-morph.js";
import {Helper} from "src/components/demo/lively-petrinet-helper.js";

export default class LivelyPetrinetToken extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetToken";
    this.registerButtons();
    if (this.colour != undefined) {
      this.setColour(this.colour);
    }
  }
  
  
  get colour() {
    return this.getAttribute("colour");
  }
  
  set colour(colour) {
    this.setAttribute("colour", colour);
  }
  
  setSelectedStyle() {
     this.get("#token").style.border = Helper.getSelectedBorder();
  }
  
  setDisselectedStyle() {
    this.get("#token").style.border = "0px";
  }
  
  setColour(colour) {
    this.get("#token").style.backgroundColor = colour;
    this.colour = colour;
  }
  
   
}