import HaloItem from 'src/components/halo/lively-halo-item.js';
import componentLoader from "src/client/morphic/component-loader.js";

import HaloGrabItem from './lively-halo-grab-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js';
import scriptManager from  "src/client/script-manager.js";
import persistence from  "src/client/persistence.js";

export default class HaloVivideOpenScriptEditorItem extends HaloItem {
  onClick(evt) {
    var inspectTarget = window.that;

    if (evt.shiftKey) {
      lively.openComponentInWindow('lively-object-editor').then((editor) => {
       editor.targetElement    = inspectTarget;   
      });
    } else {
      lively.openInspector(inspectTarget)    
    }
    this.hideHalo();
  }
}