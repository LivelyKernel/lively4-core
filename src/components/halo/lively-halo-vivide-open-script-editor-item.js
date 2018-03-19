import HaloItem from 'src/components/halo/lively-halo-item.js';
import componentLoader from "src/client/morphic/component-loader.js";

import HaloGrabItem from './lively-halo-grab-item.js';
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js';
import scriptManager from  "src/client/script-manager.js";
import persistence from  "src/client/persistence.js";
import { createScriptEditorFor } from 'src/client/vivide/vivide.js';

export default class HaloVivideOpenScriptEditorItem extends HaloItem {
  async onClick(evt) {
    var inspectTarget = window.that;

    this.hideHalo();
    let scriptEditor = await createScriptEditorFor(inspectTarget);
    scriptEditor.initialFocus();
  }
  
  updateTarget(view) {
    this._view = view;
  }
}