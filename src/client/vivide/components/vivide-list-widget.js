import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, asDragImageFor } from 'utils';

function listAsDragImage(labels, evt, offsetX, offsetY) {
  const hints = labels.map(hintForLabel);
  const hintLength = hints.length;
  const maxLength = 5;
  if(hints.length > maxLength) {
    hints.length = maxLength;
    hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`))
  }
  const dragInfo = <div style="width: 151px;">
    {...hints}
  </div>;
  dragInfo::asDragImageFor(evt, -10, 2);
}

export default class VivideListWidget extends Morph {
  get list() { return this.get('#list'); }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(this, {
        onSelectionChanged: selection => this.selectionChanged(selection)
      });
  }
  async initialize() {
    this.windowTitle = "VivideListWidget";
  }

  focus() {
    this.multiSelection.focus();
  }
  
  selectionChanged(selection) {
    lively.success(`selected ${selection.length} item(s)`);
    let viewParent = this.getViewParent();
    if(viewParent) {
      viewParent.selectionChanged();
    }
  }
  
  getSelectedData() {
    return this.multiSelection.getSelectedItems()
      .map(selectedItem => this.dataByListItem.get(selectedItem));
  }

  display(data, config) {
    this.data = data;
    this.config = config;
    this.dataByListItem = new Map();
    
    this.list.innerHTML = '';
    data.forEach(d => {
      let listItem = <li>{d.label ? d.label() : d + 1}</li>;
      this.multiSelection.addItem(listItem);
      
      // event fired on drag element
      listItem.addEventListener('dragstart', evt => {
        let selectedItems = this.multiSelection.getSelectedItems();
        if(selectedItems.length > 1 && selectedItems.includes(listItem)) {
        } else {
          this.multiSelection.selectItem(listItem);
          // #TODO: selectedItems manually managed here,
          // instead of calling this.multiSelection.getSelectedItems() a second time 
          selectedItems = [listItem];
        }
        
        this.getViewParent().addDragInfoTo(evt);
        
        listAsDragImage(selectedItems.map(li => li.innerHTML), evt, -10, 2);
      });
      
      this.dataByListItem.set(listItem, d);
      this.list.appendChild(listItem);
    });
  }
  
  getViewParent() {
    function findParent(obj, condition) {
      if(!obj) { return; }
      if(condition(obj)) { return obj; }
      
      return findParent(obj.parentNode || obj.host, condition);
    }
    
    return findParent(this, view => view.tagName === 'VIVIDE-VIEW');
  }
  
  livelyExample() {
    this.display('abcdefghi'.split(''), {});
  }
  
  livelyMigrate(other) {
    this.display(other.data, other.config);
  }
}