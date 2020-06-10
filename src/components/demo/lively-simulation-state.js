"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const JSON_INDENT = 2;
const DEFAULT_STATE = '{}';

export default class LivelySimulationState extends Morph {
  
  // life cycle
  initialize() {
    this.initializeStateTextArea();
  }
  
  initializeState(state = DEFAULT_STATE) {
    this.isEditing = false;
    this.setStateFromJSON(state);
  }
  
  initializeStateTextArea() {
    const stateTextArea = this.get('#stateTextArea');
    stateTextArea.addEventListener('focusin', () => this.handleFocusIn());
    stateTextArea.addEventListener('focusout', () => this.handleFocusOut());
    stateTextArea.addEventListener('keydown', (event) => this.handleKeyDown(event));
  }
  
  // event listener
  handleFocusIn() {
    this.isEditing = true;
  }
  
  handleFocusOut() {
    const stateTextArea = this.get('#stateTextArea');
    try {
      this.isEditing = false;
      this.setStateFromJSON(stateTextArea.value);
      this.clearError();
    } catch ({ message }) { 
      this.setError(message);
    }
  }
  
  handleKeyDown(event) {
    const { key } = event;
    if (key === 'Tab') this.insertIndent();
    else return;
    event.preventDefault();
  }
  
  // other
  getState() {
    return this.state;
  }
  
  insertIndent() {
    const stateTextArea = this.get('#stateTextArea');
    const indent =  _.join(_.times(JSON_INDENT, _.constant(' ')), '');
    const selectionStart = stateTextArea.selectionStart;
    stateTextArea.value = `${stateTextArea.value.substring(0, selectionStart)}${indent}${stateTextArea.value.substring(stateTextArea.selectionEnd)}`;
    stateTextArea.selectionEnd = selectionStart + JSON_INDENT;
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  setState(state) {
    this.state = state;
    const hasError = this.get('#status').classList.contains('error');
    if (this.isEditing || hasError) return;
    const stateTextArea = this.get('#stateTextArea');
    stateTextArea.value = JSON.stringify(state, undefined, JSON_INDENT);
  }
  
  setStateFromJSON(json) {
    const state = JSON.parse(json);
    this.setState(state);
  }
  
  setError(error) {
    const status = this.get('#status');
    status.innerText = error;
    status.classList.add('error');
  }
  
  clearError() {
    const status = this.get('#status');
    status.innerText = 'No Error';
    status.classList.remove('error');
  }
  
  isFocused() {
    return this.isChildFocused(this.get('#stateTextArea'));
  }
  
  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
}