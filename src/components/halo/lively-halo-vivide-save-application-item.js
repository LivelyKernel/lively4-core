"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
import {getName, writeFile} from 'src/client/vivide/scripts/saving.js';

const basePath = "src/client/vivide/scripts/applications/";


export default class LivelyHaloVivideSaveApplicationItem extends HaloItem {
  async onClick(evt){
    const saveTarget = window.that;
    const {name, description, url} = await getName(saveTarget, "application");
    if(name===undefined) return;
    this.storedViews = [];
    // set the name on the saveTarget
    /*
    We have to save a multitude of things:
    inputData
    scriptSteps
    And for applications:
    input targets
    output targets
    */
    const stringToSave = JSON.stringify(this.createJSON(saveTarget, name, description));
    this.storedViews = [];
    writeFile(url, stringToSave);
  }
  
  createJSON(saveTarget, name, description){
    this.storedViews.push(saveTarget.id);
    saveTarget.applicationName = name;
    saveTarget.description = description;
    const script = saveTarget.myCurrentScript.toJSON();
    const inputSources = saveTarget.inportSources
      .filter(i => !this.storedViews.includes(i.id))
      .map(v => {
        return this.createJSON(v, name);
      });
    const outputs = saveTarget.outportTargets
      .filter(i => !this.storedViews.includes(i.id))
      .map(v => {
        return this.createJSON(v, name);
      });
    const inputs = saveTarget.input;
    const stringToSave = {description, script, outputs, inputSources, inputs, widget: saveTarget.widget.tagName.toLowerCase(), id: saveTarget.id};
    return stringToSave;
  }
}