
import HaloItem from './HaloItem.js';

import * as exporting from 'src/client/morphic/component-creator.js'

export default class HaloExportItem extends HaloItem {
  
  initialize() {

   lively.addEventListener('HaloExportItem', this, 'click', e => this.onClick(e))
    
  }
  
  onClick() {
    exporting.handle(window.that);
    window.HaloService.hideHalos();
  }
}