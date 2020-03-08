import { scriptFolder, stepFolder, applicationFolder } from 'src/client/vivide/utils.js';

export async function getName(saveTarget, type, noNameProvided){
    let name, description;
    if(noNameProvided || !saveTarget[`${type}Name`]){
      name = await lively.prompt("Please attach a name", `vivide-${type}-name`);
      
      // bad UI
      description = "" // await lively.prompt("You may add a short description", "");
    } else {
      name = saveTarget[`${type}Name`];
      description = saveTarget[`${type}Description`];
    }
    saveTarget[`${type}Name`] = name;
    saveTarget[`${type}Description`] = description;
    if (name === undefined) return {name};
    const url = `${type === "script"? scriptFolder : applicationFolder}${name}.json`;
    const exists = await lively.files.exists(url);
    if(exists){   
      const confirm = await lively.confirm(`Are you sure you want to overwrite ${name}?`);
      if(!confirm){
        return getName(saveTarget, type, true);
      }
    }
    return {name, description, url};
  }


export async function writeFile(url, content){
  const res = await lively.files.saveFile(url, content);
  if(res.ok){
    lively.success("Saved");
  }else{
    lively.error(await res.text())
  }
}