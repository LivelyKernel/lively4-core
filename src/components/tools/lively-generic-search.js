"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js"

export default class LivelyGenericSearch extends Morph {
  get input() { return this.get('#input'); }
  get outer() { return this.get('#outer'); }
  get inner() { return this.get('#inner'); }

  // #TODO: mark as meta
  async initialize() {
    this.windowTitle = "LivelyGenericSearch";

    this.setupInput();
    lively.html.registerKeys(this); // automatically installs handler for some methods
  }
  
  setupInput() {
    this.input.addEventListener("keyup", evt => {
      this.onKeyInput(evt);
    });
    this.input.addEventListener('input', evt => this.inputChanged(evt));
  }

  inputChanged(evt) {
    lively.success('input is now ${this.input.value}', evt)
  }
  
  onKeyInput(evt) {
    const keyActions = new Map([
      [13, evt => lively.success('ENTER')], // ENTER
      [27, evt => this.remove()], // ESCAPE
    ]);
    
    keyActions.getOrCreate(evt.keyCode, keyCode => evt => lively.warn(evt.keyCode))(evt);
  }
  
  init() {
    Object.assign(this.outer.style, {
      width: self.innerWidth + 'px',
      height: self.innerHeight + 'px',
    });
    this.input.focus()
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down: " + evt.charCode)
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
}