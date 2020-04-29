import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class HaloMenuItem extends HaloItem {
  
    onClick(evt) {
      var inspectTarget = window.that;
      lively.openContextMenu(document.body, evt, inspectTarget)
      this.hideHalo();
    }
}