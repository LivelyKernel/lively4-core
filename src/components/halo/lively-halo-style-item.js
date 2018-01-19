import HaloItem from 'src/components/halo/lively-halo-item.js';
import componentLoader from "src/client/morphic/component-loader.js";
import {pt} from 'src/client/graphics.js';

export default class HaloStyleItem extends HaloItem {
  
    async onClick(evt) {
      if (evt.path.find(ea => ea.tagName == "LIVELY-STYLE-EDITOR")) return;
      
      var inspectTarget = window.that;
      
      var editor = this.querySelector("lively-style-editor")
      if (editor) {
        editor.remove()
      } else {
        editor = await lively.create("lively-style-editor")
        editor.setTarget(inspectTarget)
        editor.hideTargetButton()
        this.appendChild(editor)

        lively.setPosition(editor, pt(0,-60))
        // this.hideHalo(); 
      }
    }
  
    updateTarget(target) {
      var editor = this.querySelector("lively-style-editor")
      if (editor) {
        editor.setTarget(target)
      }      
    }
  
}