"enable aexpr";

import HaloItem from 'src/components/halo/lively-halo-item.js';
//import {pt} from './graphics.js';

export default class LivelyHaloConnectorsItem extends HaloItem {
  async initialize() {
    this.windowTitle = "LivelyHaloConnectorsItem";

    this.registerEvent('click', 'onClick')
  }
   
  onClick(evt) {
      var target = window.that;
      //lively.openContextMenu(document.body, evt, inspectTarget)
      
      let slider = target;
    
    
      let worldContext = lively.findWorldContext(target);
      let morph  = document.createElement("div");
          morph.style.width = "200px";
          morph.style.height = "100px";
          morph.style.border = "1px solid black"
          
          worldContext.appendChild(morph);
          //lively.setGlobalPosition(morph, pt(evt.clientX, evt.clientY)
          //  .subPt(lively.getExtent(morph).scaleBy(0.5)))
          morph.style.backgroundColor = 'rgba(40,40,80,0.5)';
          lively.hand.startGrabbing(morph, evt)

      let ae1 = aexpr(() => slider.value);
      ae1.onChange(svalue => morph.style.width= svalue+"pt")
    
      this.hideHalo();
    }
}