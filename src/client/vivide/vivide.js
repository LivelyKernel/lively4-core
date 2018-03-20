import { uuid } from 'utils';
import { stepFolder, scriptFolder } from './utils.js';
import { pt } from 'src/client/graphics.js'

async function newScriptFromTemplate() {
  async function copyStep() {
    let transformStepURL = new URL(uuid() + '.js', stepFolder);
    let stepTemplateURL = new URL('step-template.js', stepFolder);

    await lively.files.copyURLtoURL(stepTemplateURL, transformStepURL);
    
    return transformStepURL;
  }
  
  let scriptURL = new URL(uuid() + '.json', scriptFolder);
  await lively.files.saveFile(scriptURL, JSON.stringify([{
    transform: [(await copyStep()).href, (await copyStep()).href],
    extract: []
  }]));
  
  return scriptURL.href;
}

export async function createScriptEditorFor(view) {
  let viewWindow = lively.findWindow(view);
  let reference = viewWindow && viewWindow.tagName === "LIVELY-WINDOW" ?
      viewWindow : view;
  let pos = lively.getGlobalBounds(reference).topRight();

  let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);

  let scriptURLString = view.getScriptURLString();
  scriptEditor.setScriptURLString(scriptURLString);

  return scriptEditor;
}

export async function letsScript(object, evt, sourceView) {

  let pos;
  if(evt) {
    pos = lively.getPosition(evt);
  }

  let view = await lively.openComponentInWindow('vivide-view', pos);

  let scriptURLString = await newScriptFromTemplate();
  view.setScriptURLString(scriptURLString);
  view.newDataFromUpstream(object);

  if(evt && evt.shiftKey) {
    await createScriptEditorFor(view);
  }
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
