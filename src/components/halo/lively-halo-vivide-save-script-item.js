"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
import {getName, writeFile} from 'src/client/vivide/scripts/saving.js';

export default class LivelyHaloVivideSaveScriptItem extends HaloItem {
  async onClick(){
    const saveTarget = window.that;
    const {name, description, url} = await getName(saveTarget, "script");
    const content = JSON.stringify(this.createJSON(saveTarget, name, description));
    writeFile(url, content);
  }
  
  createJSON(saveTarget, name, description){
    if(name === undefined) return;
    /*
    We have to save a multitude of things:
    inputData
    scriptStepson
    And for applications:
    input targets
    output targets
    */
    // We also want to save a description for scripts so we can suggest with more info
    // Additionally we want to safe the shape of the in and out object with types for later suggestion
    const script = saveTarget.myCurrentScript.toJSON();
    const stringToSave = {
      script,
      description,
      widget: saveTarget.widget.tagName.toLowerCase(),     
      inputs: JSON.stringify(saveTarget.input),
      inScheme: JSON.stringify(saveTarget.input[0], (_, value) => typeof value === "object" ? value : typeof value),
      outScheme: JSON.stringify(saveTarget.getDataToTransmit()[0], (_,value) => typeof value === "object" ? value : typeof value)
    };
    return stringToSave;
  }
}