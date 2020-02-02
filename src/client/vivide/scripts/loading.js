import { scriptFolder, stepFolder, applicationFolder } from 'src/client/vivide/utils.js';
import Script from 'src/client/vivide/vividescript.js';
import View from 'src/client/vivide/components/vivide-view.js';
import { fileName, flatten } from 'utils';

export async function createView(content, createEditor = false, createDependents = false, name){
  const componentWindow = await lively.openComponentInWindow('vivide-view');
  if (!createDependents) componentWindow.input = JSON.parse(content.inputs);
  const script = await Script.fromJSON(content.script,componentWindow);
  componentWindow.myCurrentScript = script;
  const widget = document.createElement(content.widget);
  widget.setView(componentWindow);
  await componentWindow.scriptGotUpdated();
  if(createEditor){
    const scriptEditor = await componentWindow.createScriptEditor();
    scriptEditor.setView(componentWindow);
    await scriptEditor.setScript(script);
  }
  if(createDependents){
    componentWindow.applicationName = name;
    const inputs = await Promise.all(content.inputSources.map(i => createView(i, false, true, name)));
    inputs.forEach(i => i.connectTo(componentWindow));
    const outputs = await Promise.all(content.outputs.map(o => createView(o, false, true, name)));
    outputs.forEach(o => componentWindow.connectTo(o));
    if(content.inputs && content.inputs && content.inputs.length !== 0){
      componentWindow.newDataFromUpstream(content.inputs);
    }
  }
  return componentWindow;
}
