"enable aexpr";

import VivideWidget from 'src/client/vivide/components/vivide-widget.js';

export default class VivideInspectorWidget extends VivideWidget {
  async initialize() {
    this.windowTitle = "VivideInspectorWidget";
    this.registerButtons();

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }
  
  
  display(forest, config){
    super.display(forest, config);
    this.innerHTML ='';
    forest.forEach(async f => {
      const inspector = await lively.create('lively-inspector');
      inspector.inspect(f.data);
      inspector.hideWorkspace();
      this.appendChild(inspector);
    })
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