"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';

export default class LivelyHaloConnectorsItem extends HaloItem {
  async initialize() {
    this.windowTitle = "LivelyHaloConnectorsItem";

    this.registerEvent('click', 'onClick')
  }
  
  
  onClick(){
    lively.notify("hi")
  }
  
}