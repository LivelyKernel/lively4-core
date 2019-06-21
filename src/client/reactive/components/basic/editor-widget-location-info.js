"enable aexpr";

import { fileName } from 'utils';

import Morph from 'src/components/widgets/lively-morph.js';

export default class EditorWidgetLocationInfo extends Morph {
  
  get fileLabel() { return this.get('#file-path'); }
  
  async initialize() {
    this.windowTitle = "EditorWidgetLocationInfo";

    this.updateAppearance()

    this.registerButtons()
  }
  
  
  get enclosingEditor() {
    return lively.allParents(this, undefined, true)
      .find(element => element.tagName === 'LIVELY-EDITOR')
  }
  
  get filePath() {
    const editor = this.enclosingEditor;
    
    return editor ? editor.getURLString() : '';
  }
  
  updateAppearance() {
    this.fileLabel.innerHTML = fileName.call(this.filePath)
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
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