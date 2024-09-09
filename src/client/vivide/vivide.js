/*MD # Vivide
![Vivide](./Vivide.png)
MD*/
/**
 * The high level entry point to vivide
 * call at least with some data as Array as argument
 */
export async function letsScript(object, evt, sourceView) {
  // lively.success('LETS_SCRIPT')
  let pos;
  if(evt) {
    pos = lively.getPosition(evt);
  }

  let view = await lively.openComponentInWindow('vivide-view', pos);

  await view.initDefaultScript();
  view.newDataFromUpstream(object);

  if(evt && evt.shiftKey) {
    await view.createScriptEditor();
  }
  
  if(sourceView) {
    sourceView.connectTo(view);
  }
}
