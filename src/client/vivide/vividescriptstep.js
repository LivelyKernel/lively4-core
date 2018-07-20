import { uuid } from 'utils';

export default class ScriptStep {
  constructor(source, type, id = null, lastScript = false) {
    this.id = id != null ? id : uuid();
    this.source = source;
    this.type = type;
    this.nextStep = null;
    this.updateCallback = null;
    this.lastScript = lastScript;
  }
  
  get nextStep() { return this._nextStep; }
  set nextStep(step) { return this._nextStep = step; }
  
  set next(value) {
    if (!(value instanceof ScriptStep)) {
      throw "Value not of type ScriptStep";
    }
    
    this.nextStep = value;
  }
  
  update() {
    if (typeof this.updateCallback === 'function') {
      this.updateCallback();
    }
  }
}