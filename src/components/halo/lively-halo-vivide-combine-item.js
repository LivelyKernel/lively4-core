import lively from 'src/client/lively.js'
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from 'src/components/halo/lively-halo-item.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';

export default class HaloVivideCombineItem extends HaloItem {

  async onClick(evt) {
    if (evt.composedPath().find(ea => ea.tagName == "LIVELY-STYLE-EDITOR")) return;

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
    return;
    var editor = this.querySelector("lively-style-editor")
    if (editor) {
      editor.setTarget(target)
    }
    if(view && view.tagName === 'VIVIDE-VIEW') {
      this._view = view;
    }
  }
}
