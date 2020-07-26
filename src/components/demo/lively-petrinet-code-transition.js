import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"
import scriptManager from  "src/client/script-manager.js";

const IS_ACTIVE = "GET_IS_ACTIVE";
const PLACES_BEFORE = "GET_PLACES_BEFORE";
const PLACES_AFTER = "GET_PLACES_AFTER";

const defaultCode = ` 
  function customFunctionality(MODE, placesBefore, placesAfter){
    
    // How should be decided if transition can fire?

    if (MODE === "GET_IS_ACTIVE") {
      return true;

    // From what places should a token be removed?

    } else if(MODE === "GET_PLACES_BEFORE") {
      return placesBefore;

    // To what places should a token be added?

    } else if(MODE === "GET_PLACES_AFTER") {
      return placesAfter;
    }
  }
`


export default class LivelyPetrinetCodeTransition extends Morph {
  
  
  
  
  // Initialization
  
  
  
  async initialize() {
    this.windowTitle = "LivelyPetrinetCodeTransition";
    this.registerButtons();
    this.currentCode = defaultCode;
    scriptManager.addScript(this, defaultCode, {name: "customFunctionality"});
    if (!this.componentId) {
        this.componentId = this.get("lively-petrinet-transition").componentId;
    }

    
    lively.addEventListener("dragAndDrop", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
}
  
  async livelyExample() {
    const script =  <div id="test"><script type='lively4script' data-name="helloWorld">{"function notify() {lively.notify('Hello')}"}</script></div>
    scriptManager.addScript(this, "function notify() {lively.notify('Hello')}", {name: "helloWorld"});
  }
  
  
  
  // Access
  
  
  
  get componentId() {
    return this.getAttribute("componentId");
  }
  
  set componentId(id) {
    this.setAttribute("componentId", id);
  }
  
  get petrinet() {
    return Helper.getPetrinetOf(this);
  }
  
  
  
  // Interface
  
  
  
  isActiveTransition(placesBefore, placesAfter){
    return this.customFunctionality(IS_ACTIVE, placesBefore, placesAfter);
  }
  
  getPlacesToRemoveTokenFrom(placesBefore, placesAfter) {
    return this.customFunctionality(PLACES_BEFORE, placesBefore, placesAfter);
  }
  
  getPlacesToAddTokenTo(placesBefore, placesAfter) {
    return this.customFunctionality(PLACES_AFTER, placesBefore, placesAfter);
  }
  
  
  
  // Interaction
  
  
  
  async onAddCodeButton() {
    const codeEditor = await lively.openComponentInWindow("lively-petrinet-code-editor");
    codeEditor.code = this.currentCode;
    codeEditor.setOnSave((text) => this.addTransactionFunction(text));
  }
  
  graphicElement() {
    return this.get("lively-petrinet-transition").graphicElement();
  }
  
  setSelectedStyle() {
    this.graphicElement().style.border = Helper.getSelectedBorder();
  }
  
  setDisselectedStyle() {
    this.graphicElement().style.border = Helper.getDisselectedBorder();
  }
  
  addTransactionFunction(text) {
      scriptManager.removeScript(this, "customFunctionality")
      scriptManager.addScript(this, text, {name: "customFunctionality"});
      this.currentCode = text;
    }

}
