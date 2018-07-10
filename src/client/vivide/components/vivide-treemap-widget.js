"enable aexpr";
import { debounce } from "utils";

import Morph from 'src/components/widgets/lively-morph.js';
import VivideMultiSelectionWidget from 'src/client/vivide/components/vivide-multi-selection-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation, wait } from 'utils';

export default class VivideTreemapWidget extends VivideMultiSelectionWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  get tree() { return this.get('#tree'); }
  get d3treemap() { return this.get('#d3-treemap'); }
  
  async initialize() {
    this.windowTitle = "VivideTreeWidget";
    // Callback set in the view
    this.expandChild = null;
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
  }
  onExtentChanged(evt) {
    this.d3treemap && this.d3treemap.updateViz && this.d3treemap.updateViz();
  }
  dataForDOMNode(treeItem) {
    return this.dataByTreeItem.get(treeItem);
  }

  createTreeNodeForLabel(label) {
    return ({
      name: label
    });
  }
  labelForModel(model) {
    const label = model.properties
      .map(prop => prop.label)
      .find(label => label) || textualRepresentation(model.object);
    return label;
  }
  async attachChildren(model, treeNode) {
    // console.log('attach children', model.object && model.object.name)
    let children = model.children;
    if (children && children.length > 0) {
      if (model.childScript) {
        let test = children.map(c => c.object);
        let x = await this.expandChild(test, model.childScript);
        if (x && x.length > 0) {
          treeNode.children = [];
          await Promise.all(x.map(async child => {
            const label = this.labelForModel(child);
            const childNode = this.createTreeNodeForLabel(label);
            treeNode.children.push(childNode);
            return await this.attachChildren(child, childNode);
          }));
          return;
        }
      }
    }
    treeNode.size = 1;
  }
  async display(model, config) {
    super.display(model, config);
    this.innerHTML = '';
    
    this.treeData = this.createTreeNodeForLabel('Top Level');

    for(var m of model) {
      await this.attachChildren(m, this.treeData);
    }
    
    console.warn(this.treeData);
    const outputWorkspace = document.body.querySelector('#output-dump');
    if(outputWorkspace) {
      outputWorkspace.value = JSON.stringify(this.treeData, null, 2)
    }

    let widget = this.d3treemap;
    widget.setTreeData(this.treeData);
  }
  
//   async toggleTree(treeItem, expander) {
//     let children = this.childrenByTreeItem.get(treeItem);
    
//     if (!children || !children.length) return;
    
//     let sub = treeItem.querySelector("#child");
//     if (sub.innerHTML.length == 0) {
//       treeItem.className += " expanded"
//       let childScript = this.childScriptByTreeItem.get(treeItem);
      
//       if (childScript) {
//         let test = children.map(c => c.object);
//         children = await this.expandChild(test, childScript);
//       }
      
//       this.childrenByTreeItem.set(treeItem, children);
      
//       for (let child of children) {  
//         this.processModel(child, sub);
//       }
//       treeItem.appendChild(sub);
//       expander.classList.remove("fa-caret-right");
//       expander.classList += " fa-caret-down";
//     } else if (treeItem.classList.contains("expanded")) {
//       treeItem.classList.remove("expanded");
//       expander.classList.remove("fa-caret-down");
//       expander.classList += " fa-caret-right";
//     } else {
//       treeItem.classList += " expanded";
//       expander.classList.remove("fa-caret-right");
//       expander.classList += " fa-caret-down";
//     }
//   }
  
//   async processModel(model, parent) {    
//     let label = model.properties.map(prop => prop.label).find(label => label) || textualRepresentation(model.object);
//     let treeItem = <li>{label}<ul id="child"></ul></li>;
//     let symbolClasses = "expander fa";
//     // Items with no children have no symbol, because FontAwesome does not supply a good one
//     symbolClasses += model.children && model.children.length > 0 ? " fa-caret-right" : " fa-circle small";
//     let expander = <span id="expander" class={symbolClasses}></span>;
    
//     treeItem.prepend(expander);
//     expander.addEventListener("click", this.toggleTree.bind(this, treeItem, expander));
//     this.multiSelection.addItem(treeItem);
//     this.addDragEventTo(treeItem);
//     this.dataByTreeItem.set(treeItem, model.object);
//     this.childrenByTreeItem.set(treeItem, model.children);
//     this.childScriptByTreeItem.set(treeItem, model.childScript);
//     parent.appendChild(treeItem);
//   }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }
  
  livelyMigrate(other) {
    lively.warn('MIGRATE')
    this.expandChild = other.expandChild;
    super.display(other);
  }
}