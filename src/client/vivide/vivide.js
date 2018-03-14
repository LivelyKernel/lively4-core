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
  async function createSideBySideViewAndEditor(evt) {
    let pos;
    if(evt) {
      pos = lively.getPosition(evt)
    }

    let view = await lively.openComponentInWindow('vivide-view', pos);
    let viewWindow = lively.findWindow(view);
    if(viewWindow && viewWindow.tagName === "LIVELY-WINDOW") {
      pos = lively.getGlobalBounds(viewWindow).topRight();
    }

    let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);
    return { view, scriptEditor }
  }
  
  let { view, scriptEditor } = await createSideBySideViewAndEditor(evt);
  
  let scriptURL = await newScriptFromTemplate();
  
  view.setScript(scriptURL);
  view.newDataFromUpstream(object);
  
  scriptEditor.setScriptURL(scriptURL);
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
