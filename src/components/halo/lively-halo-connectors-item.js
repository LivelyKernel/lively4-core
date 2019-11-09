"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
//import {pt} from './graphics.js';
import ContextMenu from "src/client/contextmenu.js";

export default class LivelyHaloConnectorsItem extends HaloItem {
  async initialize() {
    this.windowTitle = "LivelyHaloConnectorsItem";

    this.registerEvent('click', 'onClick')
  }
   
  onClick(evt) {
      let target = window.that;
      
      this.showConnectorsMenuFor(target, evt);
    
      this.hideHalo();
    }
  
  async showConnectorsMenuFor(target, evt) {  
    const menuItems = [[
      'Example',
      doINeedThis => /*createStepAfterThisOne('createExampleFor')*/  this.createExampleFor(target, evt),
      'Creates a rectangle',
      '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
    ]]; /*, [
      'extract',
      evt => createStepAfterThisOne('extract'),
      'Alt+E',
      '<i class="fa fa-image" aria-hidden="true"></i>'
    ], [
      'descent',
      evt => createStepAfterThisOne('descent'),
      'Alt+D',
      '<i class="fa fa-arrow-down" aria-hidden="true"></i>'
    ]];*/

    const menu = await ContextMenu.openIn(document.body, undefined, undefined, document.body, menuItems);
    lively.setGlobalPosition(menu, lively.getGlobalPosition(target));
  }
  
  async createExampleFor(slider, evt){
      let worldContext = lively.findWorldContext(slider);
      let morph  = document.createElement("div");
          morph.style.width = "200px";
          morph.style.height = "100px";
          morph.style.border = "1px solid black"
          
          worldContext.appendChild(morph);
          //lively.setGlobalPosition(morph, pt(evt.clientX, evt.clientY)
          //  .subPt(lively.getExtent(morph).scaleBy(0.5)))
          morph.style.backgroundColor = 'rgba(40,40,80,0.5)';
          lively.hand.startGrabbing(morph, evt);

      let ae1 = aexpr(() => slider.value);
      ae1.onChange(svalue => morph.style.width= svalue+"pt")
  }
}