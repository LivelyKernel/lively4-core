"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const DEFAULT_STATE = '{}';

export default class LivelySimulationState extends Morph {

  // life cycle
  initialize() {
    this.initializeEntries();
    this.initializeSaveDiscard();
  }
  
  initializeEntries() {
    const entries = this.get('#entries');
    entries.addEventListener('focusin', () => this.handleFocusIn());
    entries.addEventListener('focusout', () => this.handleFocusOut());
  }

  initializeState(state = DEFAULT_STATE) {
    this.isEditing = false;
    this.setStateFromJSON(state);
  }

  initializeSaveDiscard() {
    const save = this.get('#save');
    save.addEventListener('click', () => this.handleSaveDiscard(true));
    const discard = this.get('#discard');
    discard.addEventListener('click', () => this.handleSaveDiscard(false));
  }

  // event listener
  handleFocusIn() {
    if (!this.isEditing) {
      this.isEditing = true;
      this.checkpoint = this.entriesToStateJSON();
      const saveDiscard = this.get('#saveDiscard');
      saveDiscard.classList.add('show');
    }
  }

  handleFocusOut() {
    if (this.checkpoint === this.entriesToStateJSON()) this.handleSaveDiscard(false);
  }

  handleSaveDiscard(save) {
    const saveDiscard = this.get('#saveDiscard');
    saveDiscard.classList.remove('show');
    this.isEditing = false;
    if (save) this.save();
    else this.discard();
  }
  
  handleDelete(entry) {
    entry.remove();
    if (_.isEmpty(this.get('#entries').children)) this.addEmptyEntry();
    this.get('#entries').children[0].focus();
  }

  // other
  save() {
    try {
      this.setState(this.entriesToState());
      this.clearError();
    } catch ({ message }) {
      this.setError(message);
      this.get('#entries').focus();
    }
  }

  discard() {
    this.setStateFromJSON(this.checkpoint);
  }

  getState() {
    return this.state;
  }

  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }

  setState(state) {
    this.state = state;
    if (this.isEditing) return;
    this.updateEntries();
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
    status.innerText = '';
    status.classList.remove('error');
  }

  isFocused() {
    const { shadowRoot } = this;
    return _.some(shadowRoot.querySelectorAll('input'), input => this.isChildFocused(input));
  }

  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  entriesToState() {
    return JSON.parse(this.entriesToStateJSON());
  }
  
  entriesToStateJSON() {
    const entries = _.map([...this.get('#entries').children], entry => [entry.getKey(), entry.getValue()]);
    const filteredEntries = _.reject(entries, ([ key ]) => _.isEmpty(key.trim()));
    const entriesAsJson = _.map(filteredEntries, ([ key, value ]) => `"${key}": ${isNaN(value) ? `"${value}"` : value}`);
    return `{
      ${
        _.join(entriesAsJson, ',\n')
      }
    }`;
  }
  
  updateEntries() {
    const { state } = this;
    const entriesState = this.entriesToState();
    if (_.isEqual(state, entriesState)) return;
    if (_.isEqual(_.keys(state), _.keys(entriesState))) this.updateEntryValues();
    else this.replaceEntries();
  }
  
  updateEntryValues() {
    const { state } = this;
    if (_.isEqual(state, {})) return this.addEmptyEntry();
    const entries = _.reject([...this.get('#entries').children], entry => _.isEmpty(entry.getKey().trim()));
    _.forEach(entries, entry => {
      const value = state[entry.getKey()];
      entry.setValue(isNaN(value) ? value : parseFloat(value.toFixed(3)));
    });
  }
  
  replaceEntries() {
    const { state } = this;
    const entries = this.get('#entries');
    entries.innerHTML = ''; // no diffing, just plain remove all + add
    const newEntries = _.map(_.toPairs(state), ([key, value]) => this.createEntry(key, isNaN(value) ? value : parseFloat(value.toFixed(3))));
    _.forEach(newEntries, (entry) => entries.appendChild(entry));
    this.addEmptyEntry();
  }
  
  addEmptyEntry() {
    const entries = this.get('#entries');
    entries.appendChild(this.createEntry('', ''));
  }
  
  ensureEmpty(entry) {
    const entries = [...this.get('#entries').children];
    if (!_.some(entries, entry => _.isEmpty(entry.getKey().trim()) && _.isEmpty(entry.getValue().trim())))
      this.addEmptyEntry();
    entry.focus();
  }
  
  createEntry(key, value) {
    const entry = (
      <div class='entry'>
        <input value={String(key)} placeholder='Key' />
        <input value={String(value)} placeholder='Value' />
        <i class="fa fa-times"></i>
      </div>
    );
    entry.children[0].addEventListener('input', () => this.ensureEmpty(entry));
    entry.children[1].addEventListener('input', () => this.ensureEmpty(entry));
    entry.children[2].addEventListener('mousedown', () => this.handleDelete(entry));
    entry.getKey = () => entry.children[0].value;
    entry.getValue = () => entry.children[1].value;
    entry.setValue = (value) => entry.children[1].value = value;
    return entry;
  }
}
