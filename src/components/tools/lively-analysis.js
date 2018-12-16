"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import d3 from "src/external/d3.v5.js"
import FileIndex from "https://lively-kernel.org/lively4/lively4-analysis/src/client/fileindex-analysis.js"

export default class LivelyAnalysis extends Morph {
  
  async initialize() {
    this.windowTitle = "Lively Semantic Code Analysis";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt))
    
   this.get("#updateDirectory").addEventListener("update-directory", () => this.onUpdateDirectory)
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onUpdateDirectory(evt) {
    FileIndex.current().updateDirectory(lively4url + "/", true)
  }

  /* Lively-specific API */

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
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.appendChild(<div>This is my content</div>)
  }
  
  
}