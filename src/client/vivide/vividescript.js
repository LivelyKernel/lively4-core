import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';

export default class Script {
  constructor(view) {
    this._view = view;
  }
  setInitialStep(step) { return this.initialStep = step; }
  getInitialStep() { return this.initialStep; }
  
  numberOfSteps() {
    let length = 0
    this.getInitialStep().iterateLinear(() => length++);
    return length;
  }
  
  gotUpdated() {
    const initialStep = this.getInitialStep();
    
    if(initialStep) {
      initialStep.update();
    }
  }
  
  getPrevStep(step) {
    return this.getInitialStep().find(s => s.nextStep === step);
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
  
  toJSON() {
    const jsonContainer = {};
    let step = this.getInitialStep();
    // #TODO: this is misplaced here
    step.updateCallback = this._view.scriptGotUpdated.bind(this._view);
    jsonContainer[step.id] = step.toJSON();
    
    while (step.nextStep != null) {
      step = step.nextStep;
      step.updateCallback = this._view.scriptGotUpdated.bind(this._view);
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
