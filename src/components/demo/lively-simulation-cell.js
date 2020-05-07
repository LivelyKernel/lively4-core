"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

export default class LivelySimulationCell extends Morph {
  
  // life cycle
  initialize() {
    this.initializeCellNameInput();
    this.initializeStateTextArea();
    this.initializeSnippetCodeMirror();
  }
  
  // initialize
  initializeSnippetCodeMirror() {
    const snippetCodeMirror = this.getSnippetCodeMirror();
    const snippet = this.getAttribute('data-snippet') || '// Enter simulation code here';
    snippetCodeMirror.editorLoaded()
      .then(() => snippetCodeMirror.editor.setOption('lint', false))
      .then(() => this.setSnippet(snippet));
  }
  
  initializeStateTextArea() {
    const state = this.getAttribute('data-state') || '{}';
    this.setPlainState(state);
  }
  
  initializeCellNameInput() {
    const name = this.getAttribute('data-name') || '';
    this.setName(name);
  }
  
  //
  execute(scope = {}) {
    const codeMirror = this.getSnippetCodeMirror();
    const snippet = this.getSnippet();
    if (!snippet.trim().length) return Promise.resolve(scope);
    codeMirror.setDoitContext(scope);
    return codeMirror.tryBoundEval(snippet).then(() => codeMirror.getDoitContext());
  }
  
  isFocused() {
    const { shadowRoot } = this;
    const childrenSelectors = ['#snippetCodeMirror', '#stateTextArea', '#cellNameInput'];
    return _.some(_.map(childrenSelectors, selector => 
                        this.isChildFocused(shadowRoot.querySelector(selector))));
  }
  
  isChildFocused(child, doc) {
    doc = doc || document;
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  // getter/ setter
  getName() {
    const input = this.getCellNameInput();
    return input.value;
  }
  
  setName(name) {
    const input = this.getCellNameInput();
    input.value = name;
  }
  
  getState() {
    return JSON.parse(this.getPlainState());
  }
  
  setState(state) {
    this.setPlainState(JSON.stringify(state));
  }
  
  getPlainState() {
    const textArea = this.getStateTextArea();
    return textArea.value;
  }
  
  setPlainState(state) {
    const textArea = this.getStateTextArea();
    textArea.value = state;
  }
  
  getSnippet() {
    const codeMirror = this.getSnippetCodeMirror();
    return codeMirror.editor.getValue();  
  }
  
  setSnippet(snippet) {
    const codeMirror = this.getSnippetCodeMirror();
    codeMirror.editor.setValue(snippet);
  }
  
  getSnippetCodeMirror() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#snippetCodeMirror');
  }
  
  getStateTextArea() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#stateTextArea');
  }
  
  getCellNameInput() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#cellNameInput');
  }
  
  /* Lively-specific API */
  livelyPrepareSave() {
    this.setAttribute('data-name', this.getName());
    this.setAttribute('data-state', this.getPlainState());
    this.setAttribute('data-snippet', this.getSnippet());
  }
}