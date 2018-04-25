import VivideMultiSelectionWidget from 'src/client/vivide/components/vivide-multi-selection-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation } from 'utils';

export default class VivideTreeWidget extends VivideMultiSelectionWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  get tree() { return this.get('#tree'); }
  
  async initialize() {
    this.windowTitle = "VivideTreeWidget";
  }
  
  dataForDOMNode(treeItem) {
    return this.dataByTreeItem.get(treeItem);
  }

  display(model, config) {
    super.display(model, config);

    this.dataByTreeItem = new Map();
    this.childrenByTreeItem = new Map();
    
    this.tree.innerHTML = '';
    model.forEach(m => this.processModel(m, this.tree));
  }
  
  toggleTree(treeItem) {
    if (treeItem.childElementCount == 0) {
      let sub = <ul></ul>;
      let children = this.childrenByTreeItem.get(treeItem);
      children.forEach(c => this.processModel(c, sub));
      
      treeItem.appendChild(sub);
    }
  }
  
  processModel(model, parent) {
    let label = model.properties.map(prop => prop.label).find(label => label) || textualRepresentation(model.object);
    let treeItem = <li>{label}</li>;
    
    treeItem.addEventListener("click", this.toggleTree.bind(this, treeItem));
    this.multiSelection.addItem(treeItem);
    this.addDragEventTo(treeItem);
    this.dataByTreeItem.set(treeItem, model.object);
    this.childrenByTreeItem.set(treeItem, model.children);
    parent.appendChild(treeItem);
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}