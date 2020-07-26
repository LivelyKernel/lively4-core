import Morph from "src/components/widgets/lively-morph.js";
import {Helper} from "src/components/demo/lively-petrinet-helper.js";

export default class LivelyPetrinetToken extends Morph {

  initialize() {
    this.windowTitle = "LivelyPetrinetToken";
    this.registerButtons();
    this.color = undefined;
  }
  
  setSelectedStyle() {
     this.get("#token").style.border = Helper.getSelectedBorder();
  }
  
  setDisselectedStyle() {
    this.get("#token").style.border = "0px";
  }
  
  setColour(colour) {
    this.colour = colour;
  }
  
   
}