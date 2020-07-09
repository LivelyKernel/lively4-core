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
      this.get('#saveDiscard').classList.add('show');
      this.get('#entries').classList.add('edit');
    }
  }

  handleSaveDiscard(save) {
    this.get('#saveDiscard').classList.remove('show');
    this.get('#entries').classList.remove('edit');
    this.isEditing = false;
    if (save) this.save();
    else this.discard();
  }
  
  handleDelete(entry) {
    entry.remove();
    if (!this.hasEmptyEntry()) this.addEmptyEntry();
  }

  // other
  save() {
    try {
      this.setState(this.entriesToState());
      this.clearError();
    } catch ({ message }) {
      this.setError(message);
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
    const json = this.entriesToStateJSON();
    return json && JSON.parse(json);
  }
  
  entriesToStateJSON() {
    const entries = _.map([...this.get('#entries').children], entry => [entry.getKey(), entry.getValue()]);
    if (_.isEmpty(entries)) return undefined;
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
    if (_.isEqual(state, entriesState) && this.hasEmptyEntry()) return;
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
    this.ensureEmpty();
  }
  
  replaceEntries() {
    const { state } = this;
    const entries = this.get('#entries');
    entries.innerHTML = ''; // no diffing, just plain remove all + add
    const newEntries = _.map(_.toPairs(state), ([key, value]) => this.createEntry(key, isNaN(value) ? value : parseFloat(value.toFixed(3))));
    _.forEach(newEntries, (entry) => entries.appendChild(entry));
    this.addEmptyEntry();
  }
  
  hasEmptyEntry() {
    return _.some([...this.get('#entries').children], entry => _.isEmpty(entry.getKey().trim()) && _.isEmpty(entry.getValue().trim()));
  }
  
  addEmptyEntry() {
    const entries = this.get('#entries');
    entries.appendChild(this.createEntry('', ''));
  }
  
  ensureEmpty(entry) {
    if (!this.hasEmptyEntry()) this.addEmptyEntry();
    if (entry) entry.focus();
  }
  
  createEntry(key, value) {
    const entry = (
      <div class='entry'>
        <input value={String(key)} placeholder='Name' />
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
