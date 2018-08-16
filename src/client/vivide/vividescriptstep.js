import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';

export default class ScriptStep {
  constructor(source, type, id = null, lastScript = false, json) {
    this.id = id != null ? id : uuid();
    this.source = source;
    this.type = type;
    this.cursor = json ? json.cursor : undefined;
    this.route = json ? json.route : undefined;
    this.nextStep = null;
    this.updateCallback = null;
    this.lastScript = lastScript;
  
    this.isScriptStep = true;
  }
  
  getCursorPosition() {
    if(this.cursor) {
      return [this.cursor.anchor, this.cursor.head];
    }
    lively.error('no cursor available', 'fallback for default cursor position');
    return [{ line: 1, ch: 0}, { line: 1, ch: 0}];
  }
  setCursorPosition(anchor, head) {
    this.cursor = { anchor, head };
  }
  
  getRoute() {
    return this.route && this.route.slice();
  }
  setRoute(route) {
    this.route = route.slice();
  }
  
  find(condition) {
    let found;
    
    this.iterateLinear(step => {
      if(!found && condition(step)) {
        found = step;
      }
    });
    
    return found;
  }
  
  iterateLinear(cb) {
    cb(this);
    
    if(this.lastScript) { return; }
    if(this.nextStep) {
      this.nextStep.iterateLinear(cb);
    }
  }
  
  // #TODO: remove duplicate
  async iterateLinearAsync(cb) {
    await cb(this);
    
    if(this.lastScript) { return; }
    if(this.nextStep) {
      this.nextStep.iterateLinear(cb);
    }
  }
  
  get nextStep() { return this._nextStep; }
  set nextStep(step) { return this._nextStep = step; }
  
  set next(value) {
    if (!value || !value.isScriptStep) {
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
      source: this.source,
      cursor: this.cursor,
      route: this.route
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
  
  static async newFromTemplate(type) {
    const stepTemplateURL = new URL(type + '-step-template.json', stepFolder);
    const stepTemplate = await fetch(stepTemplateURL).then(r => r.json());

    return this.newFromJSON(stepTemplate);
  }
  
  static newFromJSON(json) {
    return new ScriptStep(json.script, json.type, undefined, undefined, json);
  }
}

// #UPDATE_INSTANCES
// #TODO: idea: using a list of all object, we can make them become anew
// go through all object reachable from window
document.querySelectorAll("vivide-view").forEach(vv => {
  let step = vv.getFirstStep && vv.getFirstStep();
  
  step && step.iterateLinear(s => {
    // evil live programming
    s.constructor === ScriptStep;

    // we can fix this, so we can do live development again....
    s.__proto__ = ScriptStep.prototype;
  });
})
