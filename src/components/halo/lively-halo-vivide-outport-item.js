import lively from 'src/client/lively.js'
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from 'src/components/halo/lively-halo-item.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import {default as HaloService} from "src/components/halo/lively-halo.js"

export default class HaloVivideOutportItem extends HaloItem {

  updateTarget(view) {
    if(view && view.tagName === 'VIVIDE-VIEW') {
      this._view = view;
    }
  }
  
  onClick(evt) {
    if(this._view) {
      HaloService.hideHalos();
      lively.openInspector('WOOHOO', pt(evt.clientX, evt.clientY));
    }
  }
}
