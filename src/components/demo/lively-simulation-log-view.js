"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const DEFAULT_INTERVAL = 1;

export default class LivelySimulationLogView extends Morph {
  
  // life cycle
  initialize() {
    this.logs = [];
    this.get('#clearLog').addEventListener('click', () => { 
      const cell = this.getCell();
      if (cell.clearLog) cell.clearLog();
    });
    this.get('#interval').addEventListener('change', () => this.updateLogTable());
  }
  
  initializeInterval(interval = DEFAULT_INTERVAL) {
    this.get('#interval').value = interval;
  }
  
  attachedCallback() {
    this.registerLogTable();
  }
  
  detachedCallback() {
    this.logTableUpdater.dispose();
    this.visibilityUpdater.dispose();
  }
  
  // aexpr
  registerLogTable() {
    this.logTableUpdater = aexpr(() => this.logs.length).onChange(() => this.updateLogTable());
    this.visibilityUpdater = aexpr(() => this.classList.contains('active')).onChange(() => this.updateLogTable());
  }
  
  
  // other
  log(timestamp, entry) {
    const { logs } = this;
    const timestampedEntry = _.assign({ timestamp }, _.mapValues(entry, 'value'));
    logs.push(timestampedEntry);
  }
  
  clearLog() {
    this.logs = [];
  }
  
  updateLogTable() {
    if (!this.classList.contains('active')) return;
    const logTable = this.get('#logTable');
    const interval = this.getInterval();
    logTable.setFromJSO(_.filter(this.logs, (_, iLog) => !(iLog % interval)));
    logTable.scrollTop = logTable.scrollHeight;
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  getInterval() {
    return parseInt(this.get('#interval').value) || DEFAULT_INTERVAL;
  }
  
  isFocused() {
    return this.isChildFocused(this.get('#interval'));
  }
  
  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  getCell() {
    return this.getRootNode().host;
  }
}