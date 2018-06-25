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

  async display(vivideLayer, config) {
    super.display(vivideLayer, config);

    this.dataByTreeItem = new Map();
    this.childLayerByTreeItem = new Map();
    this.childScriptByTreeItem = new Map();
    
    this.tree.innerHTML = '';
    for (let object of vivideLayer.objects) {
      await this.processObject(object, this.tree);
    }
  }
  
  async toggleTree(treeItem, expander) {
    let object = this.dataByTreeItem.get(treeItem);
    let childLayer = object.childLayer;
    
    if (!childLayer || !childLayer.objects.length) return;
    
    let sub = treeItem.querySelector("#child");
    if (sub.innerHTML.length == 0) {
      treeItem.className += " expanded"
      if (childLayer.script) {
        let childData = childLayer.objects.map(c => c.data);
        object.childLayer = await this.expandChild(childData, childLayer.script);
        childLayer = object.childLayer;
      }
      
      for (let child of childLayer.objects) {  
        this.processObject(child, sub);
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
  
  async processObject(object, parent) {
    let label = object.properties.map(prop => prop.label).find(label => label) || textualRepresentation(object.data);
    let tooltipText = object.properties.map(prop => prop.tooltip).find(tooltip => tooltip) || "";
    let treeItem = <li>{label}<ul id="child"></ul></li>;
    let symbolClasses = "expander fa";
    symbolClasses += object.hasChildren > 0 ? " fa-caret-right" : " fa-circle small";
    let expander = <span id="expander" class={symbolClasses}></span>;
    
    if (tooltipText.length > 0) {
      let tooltip = <span class="tooltip"></span>;
      tooltip.innerHTML = tooltipText;
      treeItem.appendChild(tooltip);
      treeItem.addEventListener('mouseover', event => {
        tooltip.remove();
        document.body.appendChild(tooltip);
        tooltip.style.display = 'inline-block';
        tooltip.style.top = (event.clientY + 3) + "px";
        tooltip.style.left = (event.clientX + 3) + "px";
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = 1001;
        tooltip.style.backgroundColor = '#fff';
        tooltip.style.border = '1px solid #d5d5d5';
        tooltip.style.padding = '5px 10px';
      });
      
      treeItem.addEventListener('mouseout', event => {
        tooltip.remove();
        treeItem.appendChild(tooltip);
        tooltip.style.display = 'none';
      });
    }
    
    treeItem.prepend(expander);
    expander.addEventListener("click", this.toggleTree.bind(this, treeItem, expander));
    this.multiSelection.addItem(treeItem);
    this.addDragEventTo(treeItem);
    this.dataByTreeItem.set(treeItem, object);
    parent.appendChild(treeItem);
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}