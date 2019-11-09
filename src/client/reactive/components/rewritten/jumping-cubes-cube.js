"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { uuid, shake } from 'utils';

export default class JumpingCubesCube extends Morph {
  async initialize() {
    this.windowTitle = "JumpingCubesCube";
    this.registerButtons();

    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    
    aexpr(() => this.someJavaScriptProperty/*getAttribute('value')*/).dataflow(v => this.get('#value-label').innerHTML = v);
     this.get("#textField").value = this.getAttribute("data-mydata") || 2;
    
     this.get("#textField").value = this.getAttribute("data-mydata") || 2;
    const div = document.createElement('span')
    div.innerHTML = 'test'
    this.appendChild(div)
  }
  
  inc() {
    lively.notify('inc to ' + this.value);
  }
  
  onDblClick() {
    shake(this);
    this.animate([
      {backgroundColor: "lightgray"},
      {backgroundColor: "red"},
      {backgroundColor: "lightgray"},
    ], {
      duration: 1000
    })
  }
  
  ['onTemp-button']() {
    this.inc();
  }
  // this method is automatically registered as handler through ``registerButtons``
  onPlusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) + 1
  }
  
  onMinusButton() {
    this.get("#textField").value =  parseFloat(this.get("#textField").value) - 1
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
    this.appendChild(<div>This is my content</div>)
  }
  
  
}