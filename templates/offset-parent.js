"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class OffsetParent extends Morph {
  async initialize() {
    this.windowTitle = "OffsetParent";
    this.registerButtons()
  }
  
  onDblClick() {
    this.animate([
      {backgroundColor: "lightgray"},
      {backgroundColor: "red"},
      {backgroundColor: "lightgray"},
    ], {
      duration: 1000
    })
  }
  
  attachedCallback() {
    lively.notify('foo')
  }
  
}