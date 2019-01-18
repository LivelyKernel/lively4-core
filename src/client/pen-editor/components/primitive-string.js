"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class PrimitiveString extends Morph {
  get input() { return this.get('#input'); }
  
  async initialize() {
    this.windowTitle = "PrimitiveString";

    lively.html.registerKeys(this); // automatically installs handler for some methods
    this.enableAutoResize();
  }
  
  get value() {
    return this.input;
  }
  set value(str) {
    this.input.value = str;
    return str;
  }
  
  updateSize() {
    requestAnimationFrame(() => {
      this.input.size = (this.input.value.length || this.input.placeholder.length || 1);
    });
  }
  enableAutoResize() {
    for (let eventName of ['keyup', 'keypress', 'focus', 'blur', 'change']) {
      this.input.addEventListener(eventName, () => this.updateSize(), false);
    }
    this.updateSize();
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.keyCode)
  }
  
  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.input.value = other.input.value;
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
  }
  
  
}