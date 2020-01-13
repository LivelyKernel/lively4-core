"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';

const basePath = "src/client/vivide/scripts/scripts/";

export async function saveFile(saveTarget, isNameNotProvided){
  let name;
  if(isNameNotProvided || !saveTarget.scriptName){
    name = await lively.prompt("Please attach a name", "vivide-script-name");
  } else {
    name = saveTarget.scriptName
  }
  if(name === undefined) return;
  saveTarget.scriptName = name;
  /*
  We have to save a multitude of things:
  inputData
  scriptSteps
  And for applications:
  input targets
  output targets
  */
  const script = saveTarget.myCurrentScript.toJSON();
  const stringToSave = JSON.stringify({
    script,
    widget: saveTarget.widget.tagName.toLowerCase(),     
    inputs: JSON.stringify(saveTarget.input)
  });
  const url = `${lively4url}/${basePath}${name}.json`;
  const exists = await lively.files.exists(url);
  if(exists){   
    const confirm = await lively.confirm(`Are you sure you want to overwrite ${name}?`);
    if(confirm){
      writeFile(url, stringToSave);
    } else {
      saveFile(saveTarget, true);
    }
  } else {
    writeFile(url, stringToSave);
  }
}



async function writeFile(url, content){
  const res = await lively.files.saveFile(url, content);
  if(res.ok){
    lively.success("Saved");
  }else{
    lively.error(await res.text())
  }
}

export default class LivelyHaloVivideSaveScriptItem extends HaloItem {
  async onClick(evt){
    const saveTarget = window.that;
    saveFile(saveTarget);
  }
}