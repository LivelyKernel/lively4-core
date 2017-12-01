import HaloItem from 'src/components/halo/lively-halo-item.js';

import * as exporting from 'src/client/morphic/component-creator.js'

export default class HaloExportItem extends HaloItem {
  
  onClick() {
    this.hideHalo();
    exporting.handle(window.that);
  }
}