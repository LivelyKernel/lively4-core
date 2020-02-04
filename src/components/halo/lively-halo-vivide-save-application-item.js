"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';

const basePath = "src/client/vivide/scripts/applications/";


export default class LivelyHaloVivideSaveApplicationItem extends HaloItem {
  async onClick(evt){
    const saveTarget = window.that;
    const name = await this.addingName(saveTarget);
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
    const stringToSave = JSON.stringify(this.createJSON(saveTarget, name));
    this.storedViews = [];
    this.saveFile(`${lively4url}/${basePath}${name}.json`, stringToSave);
  }
  
  async addingName(saveTarget, noNameProvided){
    let name;
    if(noNameProvided || !saveTarget.applicationName){
      name = await lively.prompt("Please attach a name", "vivide-application-name");
    } else {
      name = saveTarget.applicationName;
    }
    saveTarget.applicationName = name;
    if (name === undefined) return name;
    const url = `${lively4url}/${basePath}${name}.json`;
    const exists = await lively.files.exists(url);
    if(exists){   
      const confirm = await lively.confirm(`Are you sure you want to overwrite ${name}?`);
      if(confirm){
        return name;
      } else {
        return this.addingName(saveTarget, true);
      }
    } else {
      return name;
    }
  }
  
  createJSON(saveTarget, name){
    this.storedViews.push(saveTarget.id);
    saveTarget.applicationName = name;
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
    const stringToSave = {script, outputs, inputSources, inputs, widget: saveTarget.widget.tagName.toLowerCase(), id: saveTarget.id};
    return stringToSave;
  }
  
  async saveFile(url, content){
    const res = await lively.files.saveFile(url, content);
    if(res.ok){
      lively.success("Saved");
    }else{
      lively.error(await res.text())
    }
  }
  
  
}