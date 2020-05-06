"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelySimulationCell extends Morph {
  
  // life cycle
  
  initialize() {
    const name = this.getAttribute('data-name') || '';
    const state = this.getAttribute('data-state') || '';
    const snippet = this.getAttribute('data-snippet') || '';
    this.setName(name);
    this.setPlainState(state);
    this.setSnippet(snippet);
  }
 
  isFocused() {
    const { shadowRoot } = this;
    const codeMirror = shadowRoot.querySelector('#snippetCodeMirror');
    const textArea = shadowRoot.querySelector('#stateTextArea');
    const input = shadowRoot.querySelector('#cellNameInput'); 
    return this.isChildFocused(codeMirror) || 
      this.isChildFocused(textArea) ||
      this.isChildFocused(input);
  }
  
  isChildFocused(child, doc) {
    doc = doc || document;
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  getState() {
    const stateJSON = `{ ${ this.sanitizeJSON(this.getPlainState()) } }`;
    return JSON.parse(stateJSON);
  }
  
  getPlainState() {
    const { shadowRoot } = this;
    const textArea = shadowRoot.querySelector('#stateTextArea');
    return textArea.value;
  }
  
  setState(newState) {
    const INTENT = 2;
    let content = JSON.stringify(newState, null, INTENT);
    content = content.substring(2, content.length - 2); // remove curly brackets and line breaks
    content = content.replace(/"(\w+)"\s*:/g, '$1:'); // remove quotes around keys
    this.setPlainState(content);
  }
  
  setPlainState(state) {
    const { shadowRoot } = this;
    const textArea = shadowRoot.querySelector('#stateTextArea');
    textArea.value = state;
  }
  
  sanitizeJSON(json) {
    // insert missing quotes
    return json.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
  }
  
  getName() {
    const { shadowRoot } = this;
    const input = shadowRoot.querySelector('#cellNameInput');
    return input.value;
  }
  
  setName(name) {
    const { shadowRoot } = this;
    const input = shadowRoot.querySelector('#cellNameInput');
    input.value = name;
  }
  
  execute(scope = {}) {
    const snippet = this.getSnippet();
    const preprocessedSnippet = this.preprocessSnippet(snippet);
    return this.evalInContext(preprocessedSnippet, scope);
  }
  
  getSnippet() {
    const { shadowRoot } = this;
    const codeMirror = shadowRoot.querySelector('#snippetCodeMirror');
    return codeMirror.value;  
  }
  
  setSnippet(snippet) {
    const { shadowRoot } = this;
    const codeMirror = shadowRoot.querySelector('#snippetCodeMirror');
    codeMirror.value = snippet;
  }
  
  evalInContext(snippet, scope) {
    // https://stackoverflow.com/questions/8403108/calling-eval-in-particular-context
  // not supported in strict mode: eval("with (vars) {var result = (" + func + ")}");
    return function() { return eval(snippet); }.call(scope);
  }
  
  preprocessSnippet(snippet) {
    // TODO do preprocessing here (resolve #XXX references, add `this.` etc.)
    return snippet;
  }
  
  /* Lively-specific API */
  livelyPrepareSave() {
    this.setAttribute('data-name', this.getName());
    this.setAttribute('data-state', this.getPlainState());
    this.setAttribute('data-snippet', this.getSnippet());
  }
}