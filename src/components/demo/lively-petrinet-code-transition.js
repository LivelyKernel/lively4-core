import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"
import scriptManager from  "src/client/script-manager.js";


export default class LivelyPetrinetCodeTransition extends Morph {
  
  
  
  // Initialization
  
  
  
  async initialize() {
    this.windowTitle = "LivelyPetrinetCodeTransition";
    this.registerButtons();
    this.currentCode = "";
    if (!this.componentId) {
        this.componentId = this.get("lively-petrinet-transition").componentId;
    }

    
    lively.addEventListener("dragAndDrop", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
}
  
  async livelyExample() {
    const script =  <div id="test"><script type='lively4script' data-name="helloWorld">{"function notify() {lively.notify('Hello')}"}</script></div>
    scriptManager.addScript(this, "function notify() {lively.notify('Hello')}", {name: "helloWorld"});
  }
  
  get componentId() {
    return this.getAttribute("componentId");
  }
  
  set componentId(id) {
    this.setAttribute("componentId", id);
  }
  
  
  
  // Interaction
  
  
  
  async onAddCodeButton() {
    const codeEditor = await lively.openComponentInWindow("lively-petrinet-code-editor");
    if (this.currentCode != "") {
      codeEditor.code = this.currentCode;
    }
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
    if (this.currentCode != "") {
      scriptManager.removeScript(this, "isActiveTransaction")
    }
    scriptManager.addScript(this, text, {name: "isActiveTransaction"});
    this.currentCode = text;
  }

  

}