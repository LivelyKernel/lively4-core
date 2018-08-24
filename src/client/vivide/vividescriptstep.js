import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';

import VivideObject from 'src/client/vivide/vivideobject.js';

export class ScriptProcessor {

  async computeModel(data, startingStep) {
    const _modules = {
      transform: [],
      extract: []
    };
    let descentStep;
    
    async function applyUntil(step, callback, shouldContinue) {
      if(!step) { return; }

      await callback(step);

      if(shouldContinue(step)) {
        await applyUntil(step.nextExecutionStep, callback, shouldContinue);
      }
    }

    await applyUntil(
      startingStep,
      async s => {
        if(s.type === 'descent') {
          descentStep = s;
        } else {
          await this.applyStep(s, _modules);
        }
      },
      s => {
        if(s.type === 'descent') { return false; }
        if(!s.nextExecutionStep) { return false; }

        return true;
      });

    const transformedForest = await this.processData(data, _modules, descentStep);
    return transformedForest;
  }

  async applyStep(step, _modules) {
    const [fn, config] = await step.getExecutable();
    _modules[step.type].push(fn);
  }

  async processData(data, _modules, descentStep) {
    const transformedForest = await this.transform(data, _modules);
    await this.extract(transformedForest, _modules);
    await this.prepareDescent(transformedForest, descentStep);
    
    return transformedForest;
  }
  
  async transform(data, _modules) {
    let input = data.slice(0);
    let output = [];
    
    for (let module of _modules.transform) {
      await module(input, output);
      input = output.slice(0);
      output = [];
    }

    return VivideObject.dataToForest(input);
  }
  
  async extract(forest, _modules) {
    for (let module of _modules.extract) {
      for (let model of forest) {
        model.properties.add(await module(model.object));
      }
    }
  }
  
  async prepareDescent(forest, descentStep) {
    for (let model of forest) {
      model.descentStep = descentStep;
    }
  }
  
  async descentObject(object, descentStep) {
    const [fn, config] = await descentStep.getExecutable();
    const childData = await fn(object);
    return this.computeModel(childData, descentStep.nextExecutionStep);
  }
}

export default class ScriptStep {
  constructor(source, type, id = null, lastScript = false, json) {
    this.id = id != null ? id : uuid();
    this.source = source;
    this.type = type;
    this.cursor = json ? json.cursor : undefined;
    this.route = json ? json.route : undefined;
    this.nextExecutionStep = null;
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
    if(this.nextExecutionStep) {
      this.nextExecutionStep.iterateLinear(cb);
    }
  }
  
  // #TODO: remove duplicate
  async iterateLinearAsync(cb) {
    await cb(this);
    
    if(this.lastScript) { return; }
    if(this.nextExecutionStep) {
      this.nextExecutionStep.iterateLinear(cb);
    }
  }
  
  get nextExecutionStep() { return this._nextExecutionStep; }
  set nextExecutionStep(step) { return this._nextExecutionStep = step; }
  
  set next(value) {
    if (!value || !value.isScriptStep) {
      throw "Value not of type ScriptStep";
    }
    
    this.nextExecutionStep = value;
  }
  
  insertAfter(step) {
    // If the predecessor was the last script before, the
    // attribute needs to be passed to the appended script.
    if (this.lastScript) {
      this.lastScript = false;
      step.lastScript = true;
    }

    step.nextExecutionStep = this.nextExecutionStep;
    this.nextExecutionStep = step;
  }
  
  insertAsLastStep(step) {
    const lastStep = this.getLastStep();
    lastStep.insertAfter(step);
  }
  
  getLastStep() {
    let step = this;
    while (step.nextExecutionStep != null && !step.lastScript) {
      step = step.nextExecutionStep;
    }
    
    return step;
  }
  
  setScript(script) { this._script = script; }
  update() {
    lively.notify('VivideStep::update')
    this._script.gotUpdated();
  }
  async processData(childData) {
    return new ScriptProcessor().computeModel(childData, this);
  }
  async descentObject(object) {
    return new ScriptProcessor().descentObject(object, this);
  }
  
  toJSON() {
    const scriptJson = {
      lastScript: this.lastScript, 
      type: this.type,
      source: this.source,
      cursor: this.cursor,
      route: this.route
    };
    
    if (this.nextExecutionStep) {
      scriptJson.nextScriptId = this.nextExecutionStep.id;
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
  if(!vv.myCurrentScript) { return; }
  
  vv.myCurrentScript.stepsAsArray().forEach(s => {
    // evil live programming
    s.constructor === ScriptStep;

    // we can fix this, so we can do live development again....
    s.__proto__ = ScriptStep.prototype;
  });
})
