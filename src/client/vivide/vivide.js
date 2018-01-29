
export async function letsScript(object, evt) {
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
  let scriptEditor = await lively.openComponentInWindow('vivide-script-editor', pos);
}
