"enable aexpr";

import VivideWidget from 'src/client/vivide/components/vivide-widget.js';

export default class VivideInspectorWidget extends VivideWidget {
  get multiSelectionConfig() {
    return [this, {
      selector: 'lively-inspector',
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  getObjectForSelectedNode(selectedNode) {
    // return this.data.get(selectedNode).data = this.selection.get(selectedNode);
    return this.data.get(selectedNode);
  }
  
  async initialize() {
    this.windowTitle = "VivideInspectorWidget";
  }
  
  
  display(forest, config){
    super.display(forest, config);
    this.innerHTML ='';
    this.data = new Map();
    this.selection = new Map();
    forest.forEach(async f => {
      const inspector = await lively.create('lively-inspector');
      inspector.inspect(f.data);
      inspector.hideWorkspace();
      inspector.addVivideSelection(v => {
        const s = this.selection.get(inspector);
        const value = s.includes(v) ? s.filter(t => t!==v) : [...s, v];
        this.selection.set(inspector, value);
      });
      this.appendChild(inspector);
      this.multiSelection.addItem(inspector);
      this.data.set(inspector, f.object);
      this.selection.set(inspector, []);
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