import { uuid } from 'utils';
import { stepFolder, scriptFolder } from './utils.js';
import { pt } from 'src/client/graphics.js';
import Script from 'src/client/vivide/script.js';

export async function newScriptFromTemplate() {
  async function copyStep(type) {
    let stepTemplateURL = new URL(type + '-step-template.js', stepFolder);
    let stepTemplate = await fetch(stepTemplateURL).then(r => r.text());
    let script = new Script(stepTemplate, type);
    
    return script;
  }
  
  let scripts = [];
  let transform = await copyStep('transform');
  let extract = await copyStep('extract');
  let descent = await copyStep('descent');
  
  transform.nextScript = extract;
  extract.nextScript = descent;
  
  scripts.push(transform);
  scripts.push(extract);
  scripts.push(descent);
  
  return scripts;
}

export async function createScriptEditorFor(view) {
  let viewWindow = lively.findWindow(view);
  let reference = viewWindow && viewWindow.tagName === "LIVELY-WINDOW" ?
      viewWindow : view;
  let pos = lively.getGlobalBounds(reference).topRight();

  let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);

  scriptEditor.setView(view);
  let scripts = view.getScripts();
  scriptEditor.setScripts(scripts);

  return scriptEditor;
}

export async function letsScript(object, evt, sourceView) {
  let pos;
  if(evt) {
    pos = lively.getPosition(evt);
  }

  let view = await lively.openComponentInWindow('vivide-view', pos);

  let scripts = await newScriptFromTemplate();
  view.setScripts(scripts);
  view.newDataFromUpstream(object);

  if(evt && evt.shiftKey) {
    await createScriptEditorFor(view);
  }
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
