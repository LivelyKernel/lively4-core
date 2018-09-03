import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';
import ScriptStep from 'src/client/vivide/vividescriptstep.js';
import VivideObject from 'src/client/vivide/vivideobject.js';
import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

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
    return lastStep && lastStep.getNextExecutionStep();
  }
  
  numberOfSteps() {
    let length = 0;
    this.getInitialStep().iterateLinear(() => length++);
    return length;
  }
  
  getPrevStep(step) {
    return this.getInitialStep().find(s => s.getNextExecutionStep() === step);
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
    if(stepToBeRemoved === this.getLoopStartStep()) {
      this.removeLoop();
    }

    if(stepToBeRemoved === this.getInitialStep()) {
      // First script was removed
      this.setInitialStep(stepToBeRemoved.getNextExecutionStep());
    }
    
    stepToBeRemoved.remove();
  }

  removeLoop() {
    const lastStep = this.getLastStep();
    lastStep.removeLoopTargetStep();
  }

  setLoopStart(step) {
    const lastStep = step.getLastStep();
    lastStep.setLoopTargetStep(step);
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
  
  /**
   * Serialization
   */
  static async createDefaultScript(view) {
    const transform = await ScriptStep.newFromTemplate('transform');
    const extract = await ScriptStep.newFromTemplate('extract');
    const descent = await ScriptStep.newFromTemplate('descent');

    transform.insertAfter(extract);
    extract.insertAfter(descent);

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
//       );
//     }
    
// TODO: link steps
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
