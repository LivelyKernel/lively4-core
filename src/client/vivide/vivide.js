import { uuid } from 'utils';
import { scriptFolder } from './utils.js';
import { pt } from 'src/client/graphics.js'

async function newScriptFromTemplate() {
  let newScriptURL = new URL(uuid() + '.js', scriptFolder());
  let scriptTemplateURL = new URL('script-template.js', scriptFolder());
  
  await lively.files.copyURLtoURL(scriptTemplateURL, newScriptURL);
  
  return newScriptURL;
}

export async function letsScript(object, evt, sourceView) {
  async function createScriptEditorNextTo(view) {
    let viewWindow = lively.findWindow(view);
    if(viewWindow && viewWindow.tagName === "LIVELY-WINDOW") {
      var pos = lively.getGlobalBounds(viewWindow).topRight();
    }

    let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);
    return scriptEditor;
  }

  async function createSideBySideViewAndEditor(evt) {
    let pos;
    if(evt) {
      pos = lively.getPosition(evt);
    }

    let view = await lively.openComponentInWindow('vivide-view', pos);

    let scriptEditor = await createScriptEditorNextTo(view);
    return { view, scriptEditor }
  }
  
  let { view, scriptEditor } = await createSideBySideViewAndEditor(evt);
  
  let scriptURL = await newScriptFromTemplate();
  
  view.setScriptURL(scriptURL);
  view.newDataFromUpstream(object);
  
  view.getScriptURL(scriptURL);
  scriptEditor.setScriptURL(scriptURL);
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
