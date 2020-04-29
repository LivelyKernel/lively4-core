import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation } from 'utils';

// #VivideWidget VivideTreeWidget
export default class VivideTreeWidget extends VivideWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  getObjectForSelectedNode(selectedNode) {
    const model = this.dataByTreeItem.get(selectedNode)
    return model.object;
  }

  focus() {
    this.multiSelection.focus();
  }

  get tree() { return this.get('#tree'); }
  
  async initialize() {
    this.windowTitle = "VivideTreeWidget";
  }
  

  async display(forest, config) {
    super.display(forest, config);

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
    
    for (let model of forest) {
      await this.processObject(model, this.tree);
    }
  }
  
  async toggleTree(treeItem, expander) {
    function showSubTree() {
      treeItem.classList.add("expanded");
      expander.classList.remove("fa-caret-right");
      expander.classList.add("fa-caret-down");
    }
    function hideSubTree() {
      treeItem.classList.remove("expanded");
      expander.classList.remove("fa-caret-down");
      expander.classList.add("fa-caret-right");
    }
    
    const vivideObject = this.dataByTreeItem.get(treeItem);
    
    if (!await vivideObject.hasChildren()) { return; }
    
    const sub = treeItem.querySelector("#child");
    if (sub.innerHTML.length == 0) {
      const childForest = await vivideObject.getChildren();

      for (let childModel of childForest) {
        this.processObject(childModel, sub);
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
  
  async processObject(model, parent) {
    const label = model.properties.get('label') || textualRepresentation(model.object);
    const treeItem = <li><span class='item-label'>{label}</span><ul id="child"></ul></li>;

    const tooltipText = model.properties.get('tooltip');
    if (tooltipText) {
      let tooltip = <span class="tooltip"></span>;
      let shownTooltip = null;
      tooltip.innerHTML = tooltipText;
      treeItem.appendChild(tooltip);
      treeItem.addEventListener('mouseover', event => {
        shownTooltip = tooltip.cloneNode(true);
        document.body.appendChild(shownTooltip);
        model.assign(shownTooltip.style, {
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
    
    const expander = <span id="expander"></span>;
    expander.classList.add('expander', 'fa');
    if(await model.hasChildren()) {
      expander.classList.add('fa-caret-right');
      expander.addEventListener("click", evt => this.toggleTree(treeItem, expander));
      treeItem.addEventListener("keydown", evt => {
        const { shiftKey, altKey, keyCode, charCode } = evt;
      
        // expand
        if(keyCode === 37 || keyCode === 39) {
          this.toggleTree(treeItem, expander)

          evt.preventDefault();
          evt.stopPropagation();
          return;
        }
      });
    } else {
      expander.classList.add('fa-circle', 'small');
    }
    treeItem.prepend(expander);
    
    this.multiSelection.addItem(treeItem);
    this.addDragEventTo(treeItem);
    this.dataByTreeItem.set(treeItem, model);
    
    parent.appendChild(treeItem);
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}