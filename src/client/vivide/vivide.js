import { uuid } from 'utils';
import { scriptFolder } from './utils.js';

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
      pos = {
        x: evt.clientX,
        y: evt.clientY
      };
    }

    let vivideView = await lively.openComponentInWindow('vivide-view', pos);
    let vivideViewWindow = lively.findWindow(vivideView);
    if(vivideViewWindow && vivideViewWindow.tagName === "LIVELY-WINDOW") {
      pos = {
        x: vivideViewWindow.getBoundingClientRect().right,
        y: vivideViewWindow.getBoundingClientRect().top
      }
    }

    return {
      view: vivideView,
      scriptEditor: await lively.openComponentInWindow('vivide-script-editor', pos)
    }
  }
  
  let { view, scriptEditor } = await createSideBySideViewAndEditor(evt);
  
  let scriptURL = await newScriptFromTemplate();
  
  view.setScript(scriptURL);
  view.newDataFromUpstream(object);
  
  scriptEditor.setScriptURL(scriptURL);
}
