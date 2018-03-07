import { uuid } from 'utils';
import { scriptFolder } from './utils.js';
import { pt } from 'src/client/graphics.js'

async function newScriptFromTemplate() {
  let newScriptURL = new URL(uuid() + '.js', scriptFolder());
  let scriptTemplateURL = new URL('script-template.js', scriptFolder());
  
  await lively.files.copyURLtoURL(scriptTemplateURL, newScriptURL);
  
  return newScriptURL;
}

export async function letsScript(object, evt) {
  async function createSideBySideViewAndEditor(evt) {
    let pos;
    if(evt) {
      pos = lively.getPosition(evt)
    }

    let vivideView = await lively.openComponentInWindow('vivide-view', pos);
    let vivideViewWindow = lively.findWindow(vivideView);
    if(vivideViewWindow && vivideViewWindow.tagName === "LIVELY-WINDOW") {
      pos = lively.getGlobalBounds(vivideViewWindow).topRight();
    }

    let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);
    return {
      view: vivideView,
      scriptEditor
    }
  }
  
  let { view, scriptEditor } = await createSideBySideViewAndEditor(evt);
  
  let scriptURL = await newScriptFromTemplate();
  
  view.setScript(scriptURL);
  view.newDataFromUpstream(object);
  
  scriptEditor.setScriptURL(scriptURL);
}
