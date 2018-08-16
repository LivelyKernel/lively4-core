import boundEval from "src/client/bound-eval.js";
import { uuid } from 'utils';
import { stepFolder } from 'src/client/vivide/utils.js';

export default class Script {
  constructor(view) {
    this._view = view;
  }
  setInitialStep(step) { return this.initialStep = step; }
  getInitialStep() { return this.initialStep; }
  
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
