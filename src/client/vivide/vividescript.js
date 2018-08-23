import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';
import ScriptStep from 'src/client/vivide/vividescriptstep.js';
import VivideLayer from 'src/client/vivide/vividelayer.js';
import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

class ScriptProcessor {
  constructor() {
    
  }

  async computeModel(data, step) {
    lively.success('ScriptProcessor::computeModel2')
    let vivideLayer = new VivideLayer(data);
    const _modules = {
      transform: [],
      extract: [],
      descent: []
    };
    
    // #TODO: problem if first step is a descent step
    async function applyUntil(step, callback, shouldContinue) {
      if(!step) { return; }

      await callback(step);

      if(shouldContinue(step)) {
        await applyUntil(step.nextStep, callback, shouldContinue);
      }
    }

    await applyUntil(
      step,
      async s => await this.applyStep(s, vivideLayer, _modules),
      s => {
        if(s.type === 'descent') { return false; }
        if(!s.nextStep) { return false; }

        return true;
      });

    await this.processData(vivideLayer, _modules);
    
    return vivideLayer;
  }
  async applyStep(step, vivideLayer, _modules) {
    const [fn, config] = await step.getExecutable();
    
    if (step.type === 'descent') {
      vivideLayer.childScript = step.nextStep;
    }
    _modules[step.type].push(fn);
    
    // #TODO, #ERROR: this adds the config too late
    // this.viewConfig.add(config);
  }
  async processData(vivideLayer, _modules) {
    await this.transform(vivideLayer, _modules);
    await this.extract(vivideLayer, _modules);
    await this.descent(vivideLayer, _modules);
  }
  
  async transform(vivideLayer, _modules) {
    let input = vivideLayer._rawData.slice(0);
    let output = [];
    
    for (let module of _modules.transform) {
      await module(input, output);
      input = output.slice(0);
      output = [];
    }

    vivideLayer._rawData = input;
    vivideLayer.makeObjectsFromRawData();
  }
  
  async extract(vivideLayer, _modules) {
    for (let module of _modules.extract) {
      for (let object of vivideLayer._objects) {
        object.properties.add(await module(object.data));
      }
    }
  }
  
  async descent(vivideLayer, _modules) {
    for (let module of _modules.descent) {
      for (let object of vivideLayer._objects) {
        const childData = await module(object.data);
        
        if (!childData) continue;
        
        const childLayer = new VivideLayer(childData);
        childLayer.script = vivideLayer.childScript;
        object.childLayer = childLayer;
      }
    }
  }
  
}

export default class Script {
  constructor(view) {
    this.setView(view);
  }
  
  setView(view) { this._view = view; }

  /**
   * Access
   */
  setInitialStep(step) { return this.initialStep = step; }
  getInitialStep() { return this.initialStep; }

  getLastStep() {
    const firstStep = this.getInitialStep();
    return firstStep && firstStep.getLastStep();
  }

  getLoopStartStep() {
    const lastStep = this.getLastStep();
    return lastStep && lastStep.nextStep;
  }
  
  numberOfSteps() {
    let length = 0;
    this.getInitialStep().iterateLinear(() => length++);
    return length;
  }
  
  getPrevStep(step) {
    return this.getInitialStep().find(s => s.nextStep === step);
  }
  
  async forEachStepAsync(cb) {
    await this.getInitialStep().iterateLinearAsync(cb);
  }
  
  stepsAsArray() {
    const arr = [];
    this.getInitialStep().iterateLinear(step => arr.push(step));

    return arr;
  }
  
  /**
   * Modify
   */
  async insertStepAfter(stepType, prevStep) {
    const newStep = await ScriptStep.newFromTemplate(stepType);
    newStep.setScript(this);

    prevStep.insertAfter(newStep);
    
    return newStep;
  }
  
  removeStep(stepToBeRemoved) {
    const prevStep = this.getPrevStep(stepToBeRemoved);
    if (prevStep) {
      prevStep.nextStep = stepToBeRemoved.nextStep;
    } else {
      // First script was removed
      this.setInitialStep(stepToBeRemoved.nextStep);
    }
  }

  removeLoop() {
    const lastStep = this.getLastStep();
    lastStep.nextStep = null;
  }

  setLoopStart(step) {
    const lastStep = step.getLastStep();
    
    // Reconfigure loop
    lastStep.nextStep = step;
  }
  
  /**
   * Handling script execution
   */
  gotUpdated() {
    lively.notify('VivideScript::gotIpdated')
    this._view.scriptGotUpdated();
  }
  
  /**
   * Script execution
   */
  async getViewConfig() {
    const viewConfig = new Annotations();
    const steps = this.stepsAsArray();

    for (let step of steps) {
      // #TODO: just say 'await step.getConfig()' (make it lazy and memoize later)
      const [fn, config] = await step.getExecutable();
      viewConfig.add(config);
    }
    
    return viewConfig;
  }
  
  async computeModel(data, step) {
    return new ScriptProcessor().computeModel(data, step);
  }

  /**
   * Serialization
   */
  static async createDefaultScript(view) {
    const transform = await ScriptStep.newFromTemplate('transform');
    const extract = await ScriptStep.newFromTemplate('extract');
    const descent = await ScriptStep.newFromTemplate('descent');

    transform.insertAfter(extract);
    extract.insertAfter(descent);
    descent.lastScript = true;

    const script = new Script(view);
    script.setInitialStep(transform);
    transform.setScript(script);
    extract.setScript(script);
    descent.setScript(script);
    
    return script;
  }
  
  toJSON() {
    const jsonContainer = {};

    this.stepsAsArray().forEach(step => {
      jsonContainer[step.id] = step.toJSON();
    });
    
    return jsonContainer;
  }
  
  static fromJSON() {
//     // this is deserialization of a script
//     let jsonScripts = this._view.getJSONAttribute(VivideView.scriptAttribute);
//     let scripts = {};
    
//     for (let scriptId in jsonScripts) {
//       scripts[scriptId] = new ScriptStep(
//         jsonScripts[scriptId].source,
//         jsonScripts[scriptId].type,
//         scriptId,
//         jsonScripts[scriptId].lastScript
//       );
//     }
    
//     for (let scriptId in jsonScripts) {
//       if (!jsonScripts[scriptId].nextScriptId) continue;
      
//       scripts[scriptId].next = scripts[jsonScripts[scriptId].nextScriptId];
//     }
  }
}

// #UPDATE_INSTANCES
// #TODO: idea: using a list of all object, we can make them become anew
// go through all object reachable from window
document.querySelectorAll("vivide-view").forEach(vv => {
  const script = vv.myCurrentScript;
  
  if(script) {
    // evil live programming
    script.constructor === Script;

    // we can fix this, so we can do live development again....
    script.__proto__ = Script.prototype;
  }
});
