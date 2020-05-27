"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const JSON_INDENT = 2;

export default class LivelySimulationCell extends Morph {
  
  // life cycle
  initialize() {
    this.state = {};
    this.shouldSkip = this.hasAttribute('data-should-skip');
    this.handleStateTextAreaFocusOut = this.handleStateTextAreaFocusOut.bind(this);
    this.handleStateTextAreaFocusIn = this.handleStateTextAreaFocusIn.bind(this);
    this.handleStateTextAreaKeyDown = this.handleStateTextAreaKeyDown.bind(this);
    this.openError = this.openError.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.bringToFront = this.bringToFront.bind(this);
    this.handleCellNameInputFocusOut = this.handleCellNameInputFocusOut.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.clone = this.clone.bind(this);
    this.handleExecutionResult = this.handleExecutionResult.bind(this);
    this.toggleSkip = this.toggleSkip.bind(this);
    this.executeSelf = this.executeSelf.bind(this);
    this.initializeCellNameInput();
    this.initializeStateTextArea();
    this.initializeSnippetCodeMirror();
    this.initializeError();
    this.initializeTitleBar();
    this.initializeZIndexHandler();
    this.initializeContainer();
  }
  
  attachedCallback() {
    this.registerCellNameUpdater();
  }
  
  detachedCallback() {
    this.cellNameUpdater.dispose();
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
    this.setState(JSON.parse(state));
    const stateTextArea = this.getStateTextArea();
    stateTextArea.style.cssText = this.getAttribute('data-state-style') || '';
    stateTextArea.addEventListener('focusin', this.handleStateTextAreaFocusIn)
    stateTextArea.addEventListener('focusout', this.handleStateTextAreaFocusOut);
    stateTextArea.addEventListener('keydown', this.handleStateTextAreaKeyDown);
  }
  
  initializeCellNameInput() {
    const name = this.getAttribute('data-name') || 'New Cell';
    this.setName(name);
    const cellNameInput = this.getCellNameInput();
    cellNameInput.addEventListener('focusout', this.handleCellNameInputFocusOut);
  }
  
  initializeError() {
    const openErrorLink = this.getOpenErrorLink();
    openErrorLink.addEventListener('click', this.openError);
  }
  
  initializeTitleBar() {
    const titleBar = this.getTitleBar();
    titleBar.addEventListener('pointerdown', event => this.startGrabbing(event, false));
    this.initializeMenuIcon();
    this.initializeDeleteIcon();
  }
  
  initializeZIndexHandler() {
    this.addEventListener('click', this.bringToFront);
  }
  
  initializeMenuIcon() {
    const menuIcon = this.getMenuIcon();
    menuIcon.addEventListener('click', () => {
      if (this.menu) {
        this.menu.remove();
        this.menu = undefined;
      } else 
        this.openMenu();
    });
  }
  
  initializeDeleteIcon() {
    const deleteIcon = this.getDeleteIcon();
    deleteIcon.addEventListener('click', () => this.remove());
  }
  
  registerCellNameUpdater() {
    const cellNameSpan = this.getCellNameSpan();
    this.cellNameUpdater = aexpr(() => this.getName()).onChange(cellName => cellNameSpan.innerText = cellName);
  }
  
  initializeContainer() {
    const container = this.getContainer();
    const { shouldSkip } = this;
    container.setAttribute('disabled', shouldSkip);
  }
  
  // event listener
  handleStateTextAreaFocusIn() {
    const stateTextArea = this.getStateTextArea();
    if (stateTextArea.value === JSON.stringify(this.state, undefined, JSON_INDENT))
      stateTextArea.dataset['prevState'] = stateTextArea.value;
  }
  
  handleStateTextAreaFocusOut() {
    try {
      const stateTextArea = this.getStateTextArea();
      const prevState = stateTextArea.dataset['prevState'];
      this.clearStateError();
      if (prevState === stateTextArea.value) {
        this.setState(this.state);
        return;
      }
      const parsed = JSON.parse(stateTextArea.value);
      this.setState(parsed);
    } catch ({ message }) {
      this.setStateError(message);
    }
  }
  
  handleStateTextAreaKeyDown(event) {
    const { key } = event;
    if (key !== 'Tab') return;
    const stateTextArea = this.getStateTextArea();
    const indent =  _.join(_.times(JSON_INDENT, _.constant(' ')), '');
    const selectionStart = stateTextArea.selectionStart;
    stateTextArea.value = `${stateTextArea.value.substring(0, selectionStart)}${indent}${stateTextArea.value.substring(stateTextArea.selectionEnd)}`;
    stateTextArea.selectionEnd = selectionStart + JSON_INDENT;
    event.preventDefault();
  }
  
  onPointerMove(event) {
    const { clientX, clientY } = event;
    const { lastMove } = this;
    this.style.left = `${this.offsetLeft + clientX - lastMove.clientX}px`;
    this.style.top = `${this.offsetTop + clientY - lastMove.clientY}px`;
    this.lastMove = _.pick(event, ['clientX', 'clientY']);
  }
  
  onPointerUp() {
    const { parentElement } = this;
    parentElement.removeEventListener('pointermove', this.onPointerMove);
    parentElement.removeEventListener('pointerup', this.onPointerUp);
  }
  
  handleCellNameInputFocusOut() {
    const { parentElement: simulation } = this;
    const cellNameProposal = this.getName().length ? this.getName() : 'Unnamed Cell';
    this.setName(simulation.ensureUniqueCellName(cellNameProposal));
  }
  
  //
  execute(scope = {}) {
    const { executeSingle, shouldSkip } = this;
    const snippet = this.getSnippet();
    if ((!executeSingle && shouldSkip) || _.isEmpty(snippet.trim())) return Promise.resolve(scope);
    const codeMirror = this.getSnippetCodeMirror();
    codeMirror.setDoitContext(scope);
    const preProcessSnippet = this.preProcessSnippet(snippet, scope);
    return codeMirror.boundEval(preProcessSnippet).then(this.handleExecutionResult);
  }
  
  handleExecutionResult({ isError, value: error }) {
    const codeMirror = this.getSnippetCodeMirror();
    if (isError) {
      this.setError(error);
      throw {
        state: codeMirror.getDoitContext(),
        error: new Error()
      };
    }
    else this.clearError();
    return codeMirror.getDoitContext()
  };
  
  preProcessSnippet(snippet, scope) {
    let processedSnippet = snippet;
    processedSnippet = this.addLodashImportToSnippet(processedSnippet);
    processedSnippet = this.addThisBeforeCellIdentifier(processedSnippet, scope);
    processedSnippet = this.replaceDollarSignWithSelf(processedSnippet);
    return processedSnippet;
  }
  
  replaceDollarSignWithSelf(snippet) {
    let processedSnippet = snippet;
    let match;
      while ((match = /(?<![.])\$[.|[|;|\n]/g.exec(processedSnippet)) != null) {
        processedSnippet = _.join([
          processedSnippet.slice(0, match.index),
          processedSnippet.slice(match.index + 1)
        ], `this.${this.getNormalizedName()}`);
      }
    return processedSnippet;
  }
  
  addThisBeforeCellIdentifier(snippet, scope) {
    let processedSnippet = snippet;
    const cellIdRegExps = _.mapValues(scope, (_, cellId) => new RegExp(`(?<![this.])${cellId}`, 'g'));
    _.forOwn(cellIdRegExps, (regex, cellId) => {
      let match;
      while ((match = regex.exec(processedSnippet)) != null) {
        processedSnippet = _.join([
          processedSnippet.slice(0, match.index),
          processedSnippet.slice(match.index)
        ], 'this.');
      }
    });
    return processedSnippet;
  }
  
  addLodashImportToSnippet(snippet) {
    return `import _ from 'src/external/lodash/lodash.js';\n${snippet}`;
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
  
  openError() {
    const { error } = this;
    if (!error) return;
    // taken from lively.handleError
    lively.openComponentInWindow("lively-error").then( comp => {
      comp.stack =  error.stack;
      comp.parentElement.setAttribute("title",  "" + error.message);
      comp.style.height = "max-content";
      var bounds = comp.getBoundingClientRect()
      comp.parentElement.style.height = (bounds.height + 20) + "px"
      comp.parentElement.style.width = bounds.width + "px"
    });
  }
  
  parseErrorMessage({ originalErr: { message } }) {
    if (message.startsWith('workspace')) {
      const short = message.split(/\n/)[0];
      return short.substring(short.split(':', 2).join(':').length + 1);
    }
    return message;
  }
  
  startGrabbing(event, initPosition = true) {
    const { parentElement } = this;
    parentElement.addEventListener('pointermove', this.onPointerMove);
    parentElement.addEventListener('pointerup', this.onPointerUp);
    this.lastMove = _.pick(event, ['clientX', 'clientY']);
    if (initPosition) {
      const parentBounds = parentElement.getBoundingClientRect();
      this.style.top = `${event.clientY - parentBounds.y - this.clientHeight / 2}px`;
      this.style.left = `${event.clientX - parentBounds.x - this.clientWidth / 2}px`;
    }
  }
  
  bringToFront() {
    const { parentElement: simulation } = this;
    if (!simulation) return;
    const foregroundCell = simulation.getForegroundCell();
    if (foregroundCell === this) return;
    this.style.zIndex = parseInt(foregroundCell.style.zIndex || 1) + 1;
  }
  
  camelize(str) {
    // https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
      if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
  
  toAlphaNumeric(str) {
    return str.replace(/\W/g, '');
  }
  
  openMenu() {
    const menuIcon = this.getMenuIcon();
    return Promise.resolve(lively.create('lively-menu'))
      .then(menu => {
        this.menu = menu;
        menu.openOn(createCellMenu(this.clone, this.shouldSkip, this.toggleSkip, this.executeSelf));
        this.shadowRoot.appendChild(menu);
        menu.style.top = `${menuIcon.offsetHeight}px`;
        setTimeout(() => menu.addEventListener("click", () => {
          menu.remove();
          this.menu = undefined;
        }), 0);
    });
  }
  
  clone(event) {
    const { parentElement: simulation } = this;
    simulation.cloneCell(event, this);
  }
  
  toggleSkip() {
    this.shouldSkip = !this.shouldSkip;
    const container = this.getContainer();
    const { shouldSkip } = this;
    container.setAttribute('disabled', shouldSkip);
  }
  
  executeSelf() {
    if (this.executeSingle) return;
    const { parentElement: simulation } = this;
    this.executeSingle = true;
    simulation.executeSingleCell(this).finally(() => this.executeSingle = false);
  }
  
  // getter/ setter
  getNormalizedName() {
    return this.camelize(this.toAlphaNumeric(this.getName()));
  }
  
  getName() {
    const input = this.getCellNameInput();
    return input.value.trim();
  }
  
  setName(name) {
    const input = this.getCellNameInput();
    input.value = name;
  }
  
  getState() {
    return this.state;
  }
  
  setState(state) {
    this.state = state;
    const textArea = this.getStateTextArea();
    if (!this.hasStateTextAreaFocus() && !this.isStateErrorSpanVisible()) 
      textArea.value = JSON.stringify(state, undefined, JSON_INDENT);
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
  
  getOpenErrorLink() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#openErrorLink');
  }
  
  getErrorMessageDiv() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#errorMessageDiv');
  }
  
  getErrorContainer() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#errorContainer');
  }
  
  setError(error) {
    const errorMessageDiv = this.getErrorMessageDiv();
    const errorContainer = this.getErrorContainer();
    this.error = error;
    errorMessageDiv.innerText = this.parseErrorMessage(error);
    errorContainer.style.display = 'flex';
  }
  
  clearError() {
    this.error = undefined;
    const errorContainer = this.getErrorContainer();
    errorContainer.style.display = 'none';
  }
  
  hasStateTextAreaFocus() {
    return this.isChildFocused(this.getStateTextArea());
  }
  
  getStateErrorSpan() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#stateErrorSpan');
  }
  
  setStateError(error) {
    const stateErrorSpan = this.getStateErrorSpan();
    stateErrorSpan.style.display = 'block';
    stateErrorSpan.innerText = error;
  }
  
  clearStateError() {
    const stateErrorSpan = this.getStateErrorSpan();
    stateErrorSpan.style.display = 'none';
  }
  
  isStateErrorSpanVisible() {
    const stateErrorSpan = this.getStateErrorSpan();
    return !_.includes(['', 'none'], stateErrorSpan.style.display);
  }
  
  getTitleBar() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#titleBar'); 
  }
  
  getMenuIcon() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#menuIcon');
  }
  
  getCellNameSpan() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#cellNameSpan');
  }
  
  getDeleteIcon() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#deleteIcon');
  }
  
  getContainer() {
    const { shadowRoot } = this;
    return shadowRoot.querySelector('#container');
  }
  
  /* Lively-specific API */
  livelyPrepareSave() {
    const { state } = this;
    const stateTextArea = this.getStateTextArea();
    this.setAttribute('data-name', this.getName());
    this.setAttribute('data-state', JSON.stringify(state));
    this.setAttribute('data-snippet', this.getSnippet());
    this.setAttribute('data-state-style', stateTextArea.style.cssText);
    if (this.shouldSkip) this.setAttribute('data-should-skip', true);
    else this.removeAttribute('data-should-skip');
  }
}

const createCellMenu = (clone, shouldSkip, toggleSkip, execute) => [
  [
    "Clone", 
    clone, 
    "", 
    '<i class="fa fa-clone"></i>'
  ],
  [
    shouldSkip ? 'Enable' : 'Skip', 
    toggleSkip,
    "", 
    shouldSkip ? '<i class="fa fa-play"></i>' : '<i class="fa fa-forward"></i>'
  ],
  [
    'Execute', 
    execute,
    "", 
    '<i class="fa fa-cogs"></i>'
  ]
]
