import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"

const DEFAULT_COLOUR = "black";


export default class LivelyPetrinetPlace extends Morph {
  

  initialize() {
    if (!this.componentId) {
      this.componentId = Helper.getRandomId();
    }
    
    this.history = [];
    
    this.windowTitle = "LivelyPetrinetPlace";
    this.registerButtons();
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.get("#inputLabel").addEventListener("change", (evt) => this.onLabelChange(evt));
    lively.addEventListener("foo", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
    
    if (this.label) {
      this.get("#inputLabel").value = this.label;
    }
  }
  
  
  // Access
  
    
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
  
  get label() {
    return this.getAttribute("label");
  }
  
  set label(text) {
    this.setAttribute("label", text);
  }
  
  get petrinet() {
    return Helper.getPetrinetOf(this);
  }
  
  getTokensWithColour(colour) {
    return this.tokens.filter(token => token.colour === colour);
  }
  
  getNormalTokens() {
    return this.getTokensWithColour(DEFAULT_COLOUR);
  }
  
  defaultColour() {
    return DEFAULT_COLOUR
  }
  
  // Simulation State
  
  
  
  setState(step) {
    const tokensAtStep = this.history[step];
    if (tokensAtStep.toString() === this.tokens.map(token => token.colour).toString()) {
      return;
    }

    this.deleteAllTokens();
    for (const tokenColour of tokensAtStep) {
      this.addToken(tokenColour);
    }
  }
  
  resetToState(step) {
    this.history = this.history.slice(0,step);
  }
  
  start() {
    this.history = [this.tokens.map(token => token.colour)];
  }  
  
  persistState() {
    this.history = [...this.history, this.tokens.map(token => token.colour)];
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
    this.label = this.get("#inputLabel").value;
  }
  
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
       evt.stopPropagation();
      evt.preventDefault();

       var menu = new ContextMenu(this, [
         ["add token", () => this.addToken(DEFAULT_COLOUR)],
          ["add coloured token", [
            [`blue`, () => this.addToken("blue")], 
            [`green`, () => this.addToken("green")],
            [`red`, () => this.addToken("red")]
          ], "", ''],
          ["start connection", () => this.petrinet.startConnectionFrom(this)]]);
       menu.openIn(document.body, evt, this);
        return true;
      }
  }
  

  async addToken(colour) {
    const length = lively.getExtent(this.graphicElement()).x;
    const token = await (<lively-petrinet-token></lively-petrinet-token>);
    token.setColour(colour);
    const margin = lively.getClientPosition(this.graphicElement()).x - lively.getClientPosition(this).x;
    console.log(margin);
    const x = Math.random() * length/2 + length/4;
    const y = Math.random() * length/2 + length/4;
    const tokenPosition = pt(margin+x,y);
    lively.setPosition(token, tokenPosition);
    this.appendChild(token)
    this.petrinet.listenForSelect(token);
  }
  
  
  async deleteToken(colour){
      const tokensWithSameColour = this.getTokensWithColour(colour);
      if (tokensWithSameColour.length == 0) {
        lively.error("Error: We found no token with colour: " + colour);
      }
      tokensWithSameColour[0].remove()
  }
  
  
  
  async deleteAllTokens(){
    for (let token of this.tokens) {
      token.remove();
    }
  }
   
  
}