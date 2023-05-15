"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';



export default class XrayEvents extends Morph {
  async initialize() {
    this.windowTitle = "XrayEvents";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    // #Note 1
    // ``lively.addEventListener`` automatically registers the listener
    // so that the the handler can be deactivated using:
    // ``lively.removeEventListener("template", this)``
    // #Note 1
    // registering a closure instead of the function allows the class to make 
    // use of a dispatch at runtime. That means the ``onDblClick`` method can be
    // replaced during development
    
     this.get("#textField").value = this.getAttribute("data-mydata") || 0
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
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
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

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray"
    this.someJavaScriptProperty = 42
    this.appendChild(<div>This is my content</div>)
  }
  
  
}