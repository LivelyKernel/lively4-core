import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation } from 'utils';

// #VivideWidget VivideTableWidget
export default class VivideTableWidget extends VivideWidget {
  get multiSelectionConfig() {
    return [this, {
      selector: 'tbody tr',
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  getObjectForSelectedNode(selectedNode) {
    const model = this.modelByTableRow.get(selectedNode)
    return model.object;
  }

  focus() {
    this.multiSelection.focus();
  }

  get tree() { return this.get('#tree'); }
  get table() { return this.get('#table'); }
  get thead() { return this.get('#thead'); }
  get tbody() { return this.get('#tbody'); }
  
  async initialize() {
    this.windowTitle = "VivideTableWidget";
  }

  async display(forest, config) {
    super.display(forest, config);
    
    this.modelByTableRow = new Map();
    this.tableRowByModel = new Map();
    
    this.tableHeadFromConfig(config);
    this.insertChildModels(forest, undefined, 0);
  }
  
  tableHeadFromConfig(config) {
    this.thead.innerHTML = '';
      // #VivideProperty label(String) !script-property! shown in the table header
    this.thead.appendChild(<tr>{...config.getAll('header').map(header => <th>{header}</th>)}</tr>)
  }
  
  async toggleTree(treeItem) {
    const vivideObject = this.modelByTableRow.get(treeItem);
    if (!await vivideObject.hasChildren()) { return; }
    
    const showSubTree = async () => {
      treeItem.expanded = true;

      treeItem.querySelector('#expander').innerHTML = '▼';

      const childForest = await vivideObject.getChildren();
      await this.insertChildModels(childForest, treeItem, treeItem.level+1)
    }
    const hideSubTree = async () => {
      treeItem.expanded = false;

      treeItem.querySelector('#expander').innerHTML = '▶';
      
      const toRemove = [];
      let iter = treeItem;
      while (iter) {
        iter = iter.nextSibling;
        if (iter && iter.level > treeItem.level) {
          toRemove.push(iter);
        } else {
          break;
        }
      }
      toRemove.forEach(elem => elem.remove());
    }
    
    if (treeItem.expanded) {
      hideSubTree();
    } else {
      showSubTree();
    }
  }
  
  async buildTableRow(model, siblingsHaveChildren, level) {
    /*
     * indent*
     * expander? either
     *   '': if no item in the same group has children
     *   ' ': if one or more items have children in its group, but not this one
     *   '▶': if this item has children, but not unfolded yet
     *   '◀': if this item shows its children
     * item+
     */
    let treeItemInner;
    if (model.properties.has('label')) {
      // #VivideProperty label(String) representation shown in widget (you can specify multiple labels)
      treeItemInner = model.properties.getAll('label').map(l => <td>{l}</td>);
    } else {
      treeItemInner = [<td>{textualRepresentation(model.object)}</td>];
    }
    const treeItem = <tr>{...treeItemInner}</tr>;
    treeItem.expanded = false;
    treeItem.level = level;

    const expander = <span id="expander">▶</span>;
    if(await model.hasChildren()) {
      expander.addEventListener("click", evt => this.toggleTree(treeItem));
      treeItem.addEventListener("keydown", evt => {
        const { shiftKey, altKey, keyCode, charCode } = evt;
      
        // expand
        if(keyCode === 37 || keyCode === 39) {
          this.toggleTree(treeItem)

          evt.preventDefault();
          evt.stopPropagation();
        }
      });
    } else {
      expander.style.color = 'rgba(0,0,0,0)';
      expander.innerHTML = '⚫';
    }
    treeItemInner[0].prepend(expander);
    treeItemInner[0].prepend(<span style='color: rgba(0,0,0,0);'>{('▶').repeat(level)}</span>);

    return treeItem;
  }

  async getTableRow(model, siblingsHaveChildren, level) {
    if (this.tableRowByModel.has(model)) {
      return this.tableRowByModel.get(model);
    } else {
      const treeItem = await this.buildTableRow(model, siblingsHaveChildren, level);
      
      this.tableRowByModel.set(model, treeItem)
      this.modelByTableRow.set(treeItem, model);

      this.multiSelection.addItem(treeItem);
      this.addDragEventTo(treeItem);
      
      return treeItem;
    }
  }
  
  async anyChildrenInForest(forest) {
    const haveChildren = await Promise.all(forest.map(model => model.hasChildren()));
    return haveChildren.some(bool => bool);
  }

  async insertChildModels(forest, parent, level) {
    for (let model of forest) {
      await this.processObject(model, parent, forest, level);
    }
  }

  async processObject(model, parent, forest, level) {
    const siblingsHaveChildren = await this.anyChildrenInForest(forest)
    const treeItem = await this.getTableRow(model, siblingsHaveChildren, level);
    
    if (!parent) {
      this.tbody.appendChild(treeItem);
    } else {
      const realParent = parent.parentNode;
      let nextSiblingOnSameLevel;
      let iter = parent;
      while (iter) {
        iter = iter.nextSibling;
        if (iter && iter.level <= parent.level) {
          nextSiblingOnSameLevel = iter;
          break;
        }
      }
      realParent.insertBefore(treeItem, nextSiblingOnSameLevel);
    }
  }
  
  livelyExample() {
    // Displaying a vivide tree widget is only meaningful in a vivide view
  }  
}