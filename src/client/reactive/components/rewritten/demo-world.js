"enable aexpr";

import {pt} from 'src/client/graphics.js'

import Morph from 'src/components/widgets/lively-morph.js';

import * as cop  from 'src/client/ContextJS/src/contextjs.js'
import DragBehavior from 'src/client/morphic/dragbehavior.js'

export default class DemoWorld extends Morph {
  async initialize() {
    this.windowTitle = "DemoWorld";

    
    

    
    this.home = <div>Home</div>
    this.content.appendChild(this.home)
    
    
    
    this.work = <div>Work</div>
    this.content.appendChild(this.work)  
    
  
   
    
    lively.setPosition(this.home, pt(100,100))
    lively.setExtent(this.home, pt(100,100))
    this.home.style.border = "2px dashed gray"    
    
    lively.setPosition(this.work, pt(300,100))
    lively.setExtent(this.work, pt(100,100))

    this.work.style.border = "2px solid gray"    
    
     
    this.joe = <div click={evt => this.joe.onClick(evt)}>Joe</div>
    this.content.appendChild(this.joe)
     lively.setPosition(this.joe, pt(50,150))
    lively.setExtent(this.joe, pt(40,40))
    this.joe.style.border = "2px solid red" 
    
    this.joe.onClick = () => lively.notify("Hi!")
//     this.joe.draggable = true
//     this.joe.addEventListener("dragstart", evt => {
      
//       this.joe.dragoffset = lively.getPosition(this.joe).subPt(lively.getPosition(evt))
//     })
//     this.joe.addEventListener("drag", evt => lively.setPosition(this.joe, lively.getPosition(evt).addPt(this.this.joe.dragoffset)))
    
    
    DragBehavior.on(this.joe);

    
    this.homeLayer = cop.layer("HomeLayer")
    this.homeLayer.refineObject(this.joe, {
      onClick() {
        lively.notify("I am home!")
      }
    })
    this.homeLayer.onActivate(() => {})
    
    // #TODO does not work
    this.homeLayer.activeWhile(() => {
      this.joe.x
      return this.joe.style.left > this.home.style.left
      // return lively.getBounds(this.home).containsRect(lively.getBounds(this.joe))
    })
  }
  
  
  get content() {
    return this.get("#container-root")
  }
  
  
}