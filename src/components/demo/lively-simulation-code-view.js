"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelySimulationCodeView extends Morph {
  
  // other
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  getState() {
    return this.get('#state').getState();
  }
  
  setState(state) {
    return this.get('#state').setState(state);
  }
  
  getSnippet() {
    return this.get('#code').getSnippet();
  }
  
  execute(scope) {
    return this.get('#code').execute(scope);
  }
  
  isFocused() {
    return this.get('#state').isFocused() || this.get('#code').isFocused();
  }
  
  initializeState(state) {
    return this.get('#state').initializeState(state);
  }
  
  initializeSnippet(snippet) {
    return this.get('#code').initializeSnippet(snippet);
  }
  
  getCell() {
    return this.getRootNode().host;
  }
  
  highlight(cellRef) {
    return this.get('#code').highlight(cellRef);
  }
  
}