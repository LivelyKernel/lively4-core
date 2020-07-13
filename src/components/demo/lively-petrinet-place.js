import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"



export default class LivelyPetrinetPlace extends Morph {

  initialize() {
    if (!this.componentId) {
      this.componentId = Helper.getRandomId();
    }
    
    if (this.history === null) {
       this.history = [];
    }
    
    this.windowTitle = "LivelyPetrinetPlace";
    this.registerButtons();
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.get("#inputLabel").addEventListener("change", (evt) => this.onLabelChange(evt));
    lively.addEventListener("foo", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
    
    const label = this.getAttribute("label");
    if (label) {
      this.get("#inputLabel").value = label;
    }
  }
  
  
  // Access
  
  
  
  get history() {
    return JSON.parse(this.getAttribute("history"));
  }
  
  set history(historyArray) {
    this.setAttribute("history", JSON.stringify(historyArray));
  }
    
  get componentId() {
    return this.getAttribute("componentId");
  }

  set componentId(id) {
    this.setAttribute("componentId", id);
  }
  
  get tokens() {
    return Array.from(this.querySelectorAll("lively-petrinet-token"));
  }
  
  numberOfTokens(){
    return this.tokens.length;
  }
  
  
  
  // Simulation State
  
  
  
  setState(step) {
    const numberTokensAtStep = this.history[step];
    if (numberTokensAtStep == this.numberOfTokens()) {
      return;
    }

    this.deleteAllTokens();
    for (let i = 0; i < numberTokensAtStep; i++) {
      this.addToken();
    }
  }
  
  resetToState(step) {
    this.history = this.history.slice(0,step);
  }
  
  start() {
    this.history = [this.numberOfTokens()];
  }  
  
  persistState() {
    this.history = [...this.history, this.numberOfTokens()];
  }
  
  
  
  // Interaction
  
  setSelectedStyle() {
    this.graphicElement().style.border = Helper.getSelectedBorder();
  }
  
  setDisselectedStyle() {
    this.graphicElement().style.border = Helper.getDisselectedBorder();
  }
  
  graphicElement() {
    return this.get("#circle");
  }
  
  onLabelChange(evt) {
    this.setAttribute("label", this.get("#inputLabel").value);
  }
  
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
       evt.stopPropagation();
      evt.preventDefault();

       var menu = new ContextMenu(this, [
          ["add token", () => this.addToken()],
          ["delete token", () => this.deleteToken()],
            ]);
       menu.openIn(document.body, evt, this);
        return true;
      }
  }
  

  async addToken() {
    const length = 50;
    var token = await (<lively-petrinet-token></lively-petrinet-token>);
    var x = Math.random() * length/2 + length/4;
    var y = Math.random() * length/2 + length/4;
    lively.setPosition(token, pt(x,y));

    //lively.setPosition(dot, pt(10, 10));
    this.appendChild(token); 
  }
  
  
  async deleteToken(){
      this.tokens[0].remove()
  }
  
  async deleteAllTokens(){
    for (let token of this.tokens) {
      token.remove();
    }
  }
   
  
}