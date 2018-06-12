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
    // Callback set in the view
    this.expandChild = null;
  }
  
  dataForDOMNode(treeItem) {
    return this.dataByTreeItem.get(treeItem);
  }

  async display(model, config) {
    super.display(model, config);

    this.dataByTreeItem = new Map();
    this.childrenByTreeItem = new Map();
    this.childScriptByTreeItem = new Map();
    
    this.tree.innerHTML = '';
    for (let m of model) {
      await this.processModel(m, this.tree);
    }
  }
  
  async toggleTree(treeItem, expander) {
    let children = this.childrenByTreeItem.get(treeItem);
    
    if (!children || !children.length) return;
    
    let sub = treeItem.querySelector("#child");
    if (sub.innerHTML.length == 0) {
      treeItem.className += " expanded"
      let childScript = this.childScriptByTreeItem.get(treeItem);
      
      if (childScript) {
        let test = children.map(c => c.object);
        children = await this.expandChild(test, childScript);
      }
      
      this.childrenByTreeItem.set(treeItem, children);
      
      for (let child of children) {  
        this.processModel(child, sub);
      }
      treeItem.appendChild(sub);
      expander.classList.remove("fa-caret-right");
      expander.classList += " fa-caret-down";
    } else if (treeItem.classList.contains("expanded")) {
      treeItem.classList.remove("expanded");
      expander.classList.remove("fa-caret-down");
      expander.classList += " fa-caret-right";
    } else {
      treeItem.classList += " expanded";
      expander.classList.remove("fa-caret-right");
      expander.classList += " fa-caret-down";
    }
  }
  
  async processModel(model, parent) {    
    let label = model.properties.map(prop => prop.label).find(label => label) || textualRepresentation(model.object);
    let tooltip = model.properties.map(prop => prop.tooltip).find(tooltip => tooltip) || "";
    let treeItem = <li>{label}<ul id="child"></ul></li>;
    let symbolClasses = "expander fa";
    // Items with no children have no symbol, because FontAwesome does not supply a good one
    symbolClasses += model.children && model.children.length > 0 ? " fa-caret-right" : "";
    let expander = <span id="expander" class={symbolClasses}></span>;
    
    if (tooltip.length > 0) {
      treeItem.title = tooltip;
      treeItem.setAttribute('data-tooltip', tooltip);
    }
    
    treeItem.prepend(expander);
    expander.addEventListener("click", this.toggleTree.bind(this, treeItem, expander));
    this.multiSelection.addItem(treeItem);
    this.addDragEventTo(treeItem);
    this.dataByTreeItem.set(treeItem, model.object);
    this.childrenByTreeItem.set(treeItem, model.children);
    this.childScriptByTreeItem.set(treeItem, model.childScript);
    parent.appendChild(treeItem);
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}