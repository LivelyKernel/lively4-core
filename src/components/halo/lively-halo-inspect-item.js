import HaloItem from 'src/components/halo/lively-halo-item.js';
import componentLoader from "src/client/morphic/component-loader.js";

export default class HaloInspectItem extends HaloItem {
  
    onClick(evt) {
      var inspectTarget = window.that;

      if (evt.shiftKey) {
        lively.openComponentInWindow('lively-object-editor', undefined, undefined, 
        lively.findWorldContext(inspectTarget)).then((editor) => {
         editor.targetElement    = inspectTarget;   
        });
      } else {
        lively.openInspector(inspectTarget)    
      }
      this.hideHalo();
    }
}