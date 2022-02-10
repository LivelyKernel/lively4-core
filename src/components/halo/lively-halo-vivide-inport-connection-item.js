import lively from 'src/client/lively.js'
import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt} from 'src/client/graphics.js'
import HaloItem from 'src/components/halo/lively-halo-item.js';
import Preferences from 'src/client/preferences.js'; 
import Snapping from "src/client/morphic/snapping.js"
import {Grid} from 'src/client/morphic/snapping.js';
import VivideView from 'src/client/vivide/components/vivide-view.js';
import svg from "src/client/svg.js"
import { cancelEvent } from 'utils';

export default class HaloVivideInportConnectionItem extends HaloItem {

  get path() { return this.get('#path-to-target'); }
  get overlay() { return this.get('#overlay-target'); }

  initialize() {
    this.addEventListener('click', evt => this.removeConnection(evt));
    this.path.addEventListener('click', cancelEvent);
    this.overlay.addEventListener('click', cancelEvent);
  }
  setSource(source) {
    this._source = source;
  }

  updateTarget(view) {
    this._view = view;
    if(!this._source) {
      this.classList.add('broken');
      return;
    }

    let offset = lively.getGlobalPosition(this.get('svg'));
    let startPoint = lively.getGlobalBounds(this).leftCenter().subPt(offset);
    let startOffsetPoint = startPoint.addPt(pt(-20, 0));
    let sourceCenterPoint = lively.getGlobalCenter(this._source).subPt(offset);

    svg.setPathVertices(this.path, [
      { c: 'M', x1: startPoint.x, y1: startPoint.y},
      { c: 'L', x1: startOffsetPoint.x, y1: startOffsetPoint.y},
      { c: 'L', x1: startOffsetPoint.x, y1: sourceCenterPoint.y},
      { c: 'L', x1: sourceCenterPoint.x, y1: sourceCenterPoint.y},
    ]);

    lively.setGlobalPosition(this.overlay, lively.getGlobalPosition(this._source));
    lively.setExtent(this.overlay, lively.getGlobalBounds(this._source).extent());
  }
  
  removeConnection(evt) {
    lively.notify('target', evt.target);
    if(this._view && this._source) {
      this._source.removeOutportTarget(this._view);
      lively.haloService.showHalos(window.that);
      cancelEvent(evt);
    }
  }
}
