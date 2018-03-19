import { uuid } from 'utils';
import { scriptFolder } from './utils.js';
import { pt } from 'src/client/graphics.js'

async function newScriptFromTemplate() {
  let newScriptURL = new URL(uuid() + '.js', scriptFolder());
  let scriptTemplateURL = new URL('script-template.js', scriptFolder());
  
  await lively.files.copyURLtoURL(scriptTemplateURL, newScriptURL);
  
  return newScriptURL.href;
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

  await createScriptEditorFor(view);
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
