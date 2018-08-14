import boundEval from "src/client/bound-eval.js";
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
  
  getDefaultCursorPosition() {
    if(this.type === "transform") {
      return [{ line: 2, ch: 21}, { line: 2, ch: 25}];
    } else if(this.type === "extract") {
      return [{ line: 1, ch: 2}, { line: 1, ch: 2}];
    } else if(this.type === "descent") {
      return [{ line: 0, ch: 10}, { line: 0, ch: 10}];
    }
    lively.error('unexpected step type encountered', 'fallback for defaultCursorPosition')
    return [{ line: 1, ch: 0}, { line: 1, ch: 0}];
  }
  
  get nextStep() { return this._nextStep; }
  set nextStep(step) { return this._nextStep = step; }
  
  set next(value) {
    if (!(value instanceof ScriptStep)) {
      throw "Value not of type ScriptStep";
    }
    
    this.nextStep = value;
  }
  
  insertAfter(step) {
    // If the predecessor was the last script before, the
    // attribute needs to be passed to the appended script.
    if (this.lastScript) {
      this.lastScript = false;
      step.lastScript = true;
    }

    step.nextStep = this.nextStep;
    this.nextStep = step;
  }
  
  insertAsLastStep(step) {
    const lastStep = this.getLastStep();
    lastStep.insertAfter(step);
  }
  
  getLastStep() {
    let step = this;
    while (step.nextStep != null && !step.lastScript) {
      step = step.nextStep;
    }
    
    return step;
  }
  
  update() {
    lively.warn('Step was updated')
    if (typeof this.updateCallback === 'function') {
      this.updateCallback();
    } else {
      lively.error('but no updateCallback')
    }
  }
  
  toJSON() {
    const scriptJson = {
      lastScript: this.lastScript, 
      type: this.type,
      source: this.source
    };
    if (this.nextStep) {
      scriptJson.nextScriptId = this.nextStep.id;
    }
    
    return scriptJson
  }
  
  async getExecutable() {
    const module = await boundEval(this.source);
    
    return module.value;
  }
}