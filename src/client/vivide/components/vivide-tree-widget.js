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

  async display(vivideLayer, config) {
    super.display(vivideLayer, config);
    
    // Clean up
    this.tree.innerHTML = '';
    // Remove stuck tooltips
    let oldTooltips = document.body.getElementsByClassName('tooltip');
    if (oldTooltips) {
      for (let oldTooltip of oldTooltips) {
        oldTooltip.remove();
      }  
    }
    
    this.dataByTreeItem = new Map();
    this.childLayerByTreeItem = new Map();
    this.childScriptByTreeItem = new Map();
    
    for (let object of vivideLayer.objects) {
      await this.processObject(object, this.tree);
    }
  }
  
  async toggleTree(treeItem, expander) {
    function showSubTree() {
      treeItem.className += " expanded";
      expander.classList.remove("fa-caret-right");
      expander.classList += " fa-caret-down";
    }
    function hideSubTree() {
      treeItem.classList.remove("expanded");
      expander.classList.remove("fa-caret-down");
      expander.classList += " fa-caret-right";
    }
    
    const vivideObject = this.dataByTreeItem.get(treeItem);
    
    if (!vivideObject.hasChildren()) { return; }
    
    const sub = treeItem.querySelector("#child");
    if (sub.innerHTML.length == 0) {
      const childLayer = await vivideObject.getChildren();
      
      for (let child of childLayer.objects) {
        this.processObject(child, sub);
      }
      
      treeItem.appendChild(sub);
      showSubTree();
    } else if (treeItem.classList.contains("expanded")) {
      // child elements available and expanded -> hide them
      hideSubTree();
    } else {
      // child elements available but hidden -> show them
      showSubTree();
    }
  }
  
  async processObject(object, parent) {
    const label = object.properties.get('label') || textualRepresentation(object.data);
    let tooltipText = object.properties.get('tooltip') || "";
    let treeItem = <li>{label}<ul id="child"></ul></li>;
    let symbolClasses = "expander fa";
    symbolClasses += object.hasChildren() ? " fa-caret-right" : " fa-circle small";
    let expander = <span id="expander" class={symbolClasses}></span>;
    
    if (tooltipText.length > 0) {
      let tooltip = <span class="tooltip"></span>;
      let shownTooltip = null;
      tooltip.innerHTML = tooltipText;
      treeItem.appendChild(tooltip);
      treeItem.addEventListener('mouseover', event => {
        shownTooltip = tooltip.cloneNode(true);
        document.body.appendChild(shownTooltip);
        object.assign(shownTooltip.style, {
          display: 'inline-block',
          top: (event.clientY + 3) + "px",
          left: (event.clientX + 3) + "px",
          position: 'fixed',
          zIndex: 1001,
          backgroundColor: '#fff',
          border: '1px solid #d5d5d5',
          padding: '5px 10px',
        });
      });
      
      treeItem.addEventListener('mouseout', event => {
        shownTooltip.remove();
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