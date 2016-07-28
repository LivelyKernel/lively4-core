
import HaloItem from './HaloItem.js';

import * as exporting from 'src/client/morphic/component-creator.js'

export default class HaloExportItem extends HaloItem {
  
  onClick() {
    exporting.handle(window.that);
    window.HaloService.hideHalos();
  }
}