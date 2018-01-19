import HaloItem from 'src/components/halo/lively-halo-item.js';
import componentLoader from "src/client/morphic/component-loader.js";

export default class HaloMenuItem extends HaloItem {
  
    onClick(evt) {
      var inspectTarget = window.that;
      lively.openContextMenu(document.body, evt, inspectTarget)
      this.hideHalo();
    }
}