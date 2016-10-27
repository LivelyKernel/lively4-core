import HaloItem from './HaloItem.js';
import componentLoader from "src/client/morphic/component-loader.js";

export default class HaloInspectItem extends HaloItem {
  
    onClick(evt) {
      var inspectTarget = window.that;

      if (evt.shiftKey) {
        lively.openInspector(inspectTarget)    
      } else {
        var editor = componentLoader.createComponent('lively-object-editor');
        editor.targetElement    = inspectTarget;
  
        componentLoader.openInWindow(editor).then((objectEditorWindow) => {
          objectEditorWindow.centerInWindow(); 
        });
      }
      this.hideHalo();
    }
}