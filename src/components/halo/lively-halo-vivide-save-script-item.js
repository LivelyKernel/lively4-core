"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';

const basePath = "src/client/vivide/scripts/scripts/";

export default class LivelyHaloVivideSaveScriptItem extends HaloItem {
  async onClick(evt){
    this.name = await lively.prompt("Please attach a name", "vivide-script-name");
    if(this.name === undefined) return;
    const saveTarget = window.that;
    /*
    We have to save a multitude of things:
    inputData
    scriptSteps
    And for applications:
    input targets
    output targets
    */
    const script = saveTarget.myCurrentScript.toJSON();
    const url = `${lively4url}/${basePath}${this.name}.json`;
    const exists = await lively.files.exists(url);
    console.log();
    const stringToSave = JSON.stringify({script, widget: saveTarget.widget.tagName.toLowerCase()});
    if(exists){   
      const confirm = await lively.confirm(`Are you sure you want to overwrite ${this.name}?`);
      if(confirm){
        this.saveFile(url, stringToSave);
      }
    } else {
      this.saveFile(url, stringToSave);
    }
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