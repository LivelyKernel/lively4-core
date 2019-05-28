"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class SimpleButtonAnim extends Morph {
  async initialize() {
    this.windowTitle = "SimpleButtonAnim";
    this.registerButtons()
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onTarget() {
    lively.notify("hello")
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
  }
  
  
}