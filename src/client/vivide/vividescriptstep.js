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
        await applyUntil(step.getNextExecutionStep(), callback, shouldContinue);
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
      s => s.type !== 'descent' && s.hasNextExecutionStep()
    );

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
  
  // Vivide/S's asList
  asList(d) {
    if(d === undefined) {
      // pass
      return [];
    } else if(Array.isArray(d)) {
      return d;
    } else {
      // normal singular object
      return [d];
    }
  }
  
  flatten(data) {
    let result = [];

    data.forEach(d => result.push(...this.asList(d)));
    
    return result;
  }
  
  async singleTransform(data, module) {
    const output = [];
    await module(data, output);
    return output;
  }
  async transform(data, _modules) {
    let input = data.slice(0);
    
    for (let module of _modules.transform) {
      input = await this.singleTransform(input, module);
      input = this.flatten(input);
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
    return this.computeModel(childData, descentStep.getNextExecutionStep());
  }
}

export default class ScriptStep {
  constructor(source, type, id = null, json) {
    this.id = id != null ? id : uuid();
    this.source = source;
    this.type = type;
    this.cursor = json ? json.cursor : undefined;
    this.route = json ? json.route : undefined;
    
    this._prevLinearStep = undefined;
    this._nextLinearStep = undefined;
    this._loopTargetStep = undefined;
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
  
  // rename to ComputationalStep
  hasNextExecutionStep() { return !!this.getNextExecutionStep(); }
  getNextExecutionStep() { return this._nextLinearStep || this._loopTargetStep; }
  
  removeLoopTargetStep() {
    this._loopTargetStep = undefined;
  }
  setLoopTargetStep(step) {
    this._loopTargetStep = step;
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
    
    if(this._nextLinearStep) {
      this._nextLinearStep.iterateLinear(cb);
    }
  }
  
  // #TODO: remove duplicate
  async iterateLinearAsync(cb) {
    await cb(this);
    
    if(this._nextLinearStep) {
      await this._nextLinearStep.iterateLinearAsync(cb);
    }
  }
  
  insertAfter(stepToBeInserted) {
    const nextStep = this._nextLinearStep;
    this._nextLinearStep = stepToBeInserted;
    stepToBeInserted._nextLinearStep = nextStep;
    if(nextStep) {
      nextStep._prevLinearStep = stepToBeInserted;
    }
    stepToBeInserted._prevLinearStep = this;

    if(this._loopTargetStep) {
      stepToBeInserted._loopTargetStep = this._loopTargetStep;
      this._loopTargetStep = undefined;
    }
  }
  
  remove() {
    const prevStep = this._prevLinearStep;
    const nextStep = this._nextLinearStep;

    if(prevStep) {
      prevStep._nextLinearStep = nextStep;
    }
    if(nextStep) {
      nextStep._prevLinearStep = prevStep;
    }
    
    if(this._loopTargetStep && prevStep) {
      prevStep._loopTargetStep = this._loopTargetStep;
      this._loopTargetStep = undefined;
    }
  }
  
  insertAsLastStep(step) {
    const lastStep = this.getLastStep();
    lastStep.insertAfter(step);
  }
  
  getLastStep() {
    let step = this;
    while (step._nextLinearStep) {
      step = step._nextLinearStep;
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
  
  // #TODO: implement properly
  toJSON() {
    const scriptJson = {
      type: this.type,
      source: this.source,
      cursor: this.cursor,
      route: this.route
    };
    
    // #TODO: maybe need to save next step id or loop target
    
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
    return new ScriptStep(json.script, json.type, undefined, json);
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
