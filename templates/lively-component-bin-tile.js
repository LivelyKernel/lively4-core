'use strict'

import Morph from './Morph.js';
import componentLoader from 'src/client/morphic/component-loader.js';
import preferences from 'src/client/preferences.js';

import {pt} from 'src/client/graphics.js';



export default class ComponentBinTile extends Morph {
  initialize() {
    this.addEventListener('click', evt => this.onClick(evt))
    this.addEventListener('dragstart', evt => this.onDragStart(evt))
    this.addEventListener('drag', evt => this.onDrag(evt))
    this.addEventListener('dragend', evt => this.onDragEnd(evt))
    this.addEventListener('keyup', evt => this.onKeyUp(evt))
    
    this.draggable = true;
    
    this.setAttribute("tabindex", 0)
  }
  
  
  configure(config) {
    this.setComponentName(config.name);
    // this.setThumbnail(lively4url + "/templates/" + (config.thumbnail || "thumbnails/default-placeholder.png"));
    this.setTooltip(config.description);

    this.htmlTag = config["html-tag"];
  }

  setThumbnail(path) {
    var img = this.getSubmorph('img');
    img.src = path;
  }

  setTooltip(string) {
    var img = this.getSubmorph('img');
    img.title = string;
  }

  setComponentName(name) {
    var text = this.getSubmorph('p');
    text.innerHTML = name;
  }

  setBin(componentBin) {
    this.componentBin = componentBin;
  }
  
  async onClick(evt) {
    var comp  = await this.createComponent(evt);
  } 
  
  
  
  createComponent(evt) {
    var worldContext = document.body
      var comp = componentLoader.createComponent(this.htmlTag);
      this.component = comp;

    if (this.componentBin.inWindow()) {
      return componentLoader.openInWindow(comp).then(comp => {
        var pos = lively.findPositionForWindow(worldContext)
        lively.notify("pos" + pos)
        lively.setPosition(comp, pos)
        return comp
      })
      
      // return componentLoader.openInWindow(comp).then(() => {
      //   return comp
      // })
    } else {
    
      var pos = lively.getGlobalPosition(this)
    
      return componentLoader.openInBody(comp).then( () => {
        lively.setGlobalPosition(comp, pos.subPt(lively.getExtent(comp).scaleBy(0.5)))
        lively.hand.startGrabbing(comp, evt)
      })
    }
  }
  
  async onDragStart(evt) {
    this.dragTarget = await this.createComponent()
    evt.dataTransfer.setDragImage(document.createElement("div"), 0, 0); 
  }
  
  onDrag(evt) {
    if (this.dragTarget && evt.clientX) {
     lively.setPosition(this.dragTarget, {x: evt.clientX - 300, y: evt.clientY - 10})
    } 
  }
  
  onDragEnd(evt) {
    // Do nothing... 
  }

  async onKeyUp(evt) {
    if (event.keyCode == 13) { // ENTER
      var comp  = await this.createComponent();
      var bounds = this.componentBin.getBoundingClientRect()
      lively.setPosition(comp, pt(bounds.left, bounds.top))
      this.componentBin.close()
      comp.focus()
  
    }
  } 

}
