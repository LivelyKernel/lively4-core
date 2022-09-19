import lively from 'src/client/lively.js'
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from 'src/components/halo/lively-halo-item.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';

export default class HaloVivideInportItem extends HaloItem {

  updateTarget(view) {
    if(view && view.tagName === 'VIVIDE-VIEW') {
      this._view = view;
    }
  }
  
  onClick(evt) {
    if(this._view) {
      lively.haloService.hideHalos();
      lively.openInspector(this._view.getInputData(), pt(evt.clientX, evt.clientY));
    }
  }
}
