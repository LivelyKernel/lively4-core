"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';

const basePath = "src/client/vivide/scripts/application/";


export default class LivelyHaloVivideSaveApplicationItem extends HaloItem {
  async onClick(evt){
    this.name = await lively.prompt("Please attach a name", "vivide-application-name");
    const saveTarget = window.that;
    this.storedViews = [];
    /*
    We have to save a multitude of things:
    inputData
    scriptSteps
    And for applications:
    input targets
    output targets
    */
    const url = `${lively4url}/${basePath}${this.name}.json`;
    const exists = await lively.files.exists(url);
    const stringToSave = JSON.stringify(this.createJSON(saveTarget));
    if(exists){   
      const confirm = await lively.confirm(`Are you sure you want to overwrite ${this.name}?`);
      if(confirm){
        this.saveFile(url, stringToSave);
      }
    } else {
      this.saveFile(url, stringToSave);
    }
  }
  
  createJSON(saveTarget){
    this.storedViews.push(saveTarget.id);
    const script = saveTarget.myCurrentScript.toJSON();
    const inputSources = saveTarget.inportSources
      .filter(i => !this.storedViews.includes(i.id))
      .map(v => {
        return this.createJSON(v);
      });
    const outputs = saveTarget.outportTargets
      .filter(i => !this.storedViews.includes(i))
      .map(v => {
        return this.createJSON(v);
      });
    const stringToSave = {script, outputs, inputSources, widget: saveTarget.widget.tagName.toLowerCase()};
    this.storedViews = [];
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