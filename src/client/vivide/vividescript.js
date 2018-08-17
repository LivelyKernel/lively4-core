import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';
import ScriptStep from 'src/client/vivide/vividescriptstep.js';

export default class Script {
  constructor(view) {
    this._view = view;
  }
  
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
    let length = 0
    this.getInitialStep().iterateLinear(() => length++);
    return length;
  }
  
  getPrevStep(step) {
    return this.getInitialStep().find(s => s.nextStep === step);
  }
  
  async forEachStepAsync(cb) {
    this.getInitialStep().iterateLinearAsync(cb);
  }
  
  /**
   * Modify
   */
  async insertStepAfter(stepType, prevStep) {
    const newStep = await ScriptStep.newFromTemplate(stepType);
    newStep.updateCallback = () => this._view.scriptGotUpdated();
    
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
    const initialStep = this.getInitialStep();
    
    if(initialStep) {
      initialStep.update();
    }
  }
  
  /**
   * Serialization
   */
  toJSON() {
    const jsonContainer = {};
    let step = this.getInitialStep();
    // #TODO: this is misplaced here
    step.updateCallback = () => this._view.scriptGotUpdated();
    jsonContainer[step.id] = step.toJSON();
    
    while (step.nextStep != null) {
      step = step.nextStep;
      step.updateCallback = () => this._view.scriptGotUpdated();
      jsonContainer[step.id] = step.toJSON();
      
      if (step.lastScript) break;
    }
    
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
  let script = vv.myCurrentScript;
  
  if(script) {
    // evil live programming
    script.constructor === Script;

    // we can fix this, so we can do live development again....
    script.__proto__ = Script.prototype;
  }
});
