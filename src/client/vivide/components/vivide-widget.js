import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage } from 'utils';

export default class VivideWidget extends Morph {
  getViewParent() {
    function findParent(obj, condition) {
      if(!obj) { return; }
      if(condition(obj)) { return obj; }
      
      return findParent(obj.parentNode || obj.host, condition);
    }
    
    return findParent(this, view => view.tagName === 'VIVIDE-VIEW');
  }
  
  setView(view) { this._view = view; }
  getView() { return this._view; }
  
  display(model, config) {
    this.model = model;
    this.config = config;
  }
  
  livelyMigrate(other) {
    this.setView(other.getView());
    this.display(other.model, other.config);
  }
  
  /**
   * Utilities for MultiSelection
   */
  get multiSelection() {
    this.multiSelectionEnabled = true;
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(...this.multiSelectionConfig);
  }

  selectionChanged(selection) {
    let viewParent = this.getViewParent();
    if(viewParent) {
      viewParent.selectionChanged();
    }
  }
  
  getSelectedData() {
    return this.multiSelection.getSelectedItems()
      .map(selectedNode => this.getObjectForSelectedNode(selectedNode));
  }
  
  addDragEventTo(item) {
    item.addEventListener('dragstart', evt => {
      let selectedItems = this.multiSelection.getSelectedItems();
      if(selectedItems.length > 1 && selectedItems.includes(item)) {
      } else {
        this.multiSelection.selectItem(item);
      }

      let viewParent = this.getViewParent();
      if(viewParent) {
        viewParent.addDragInfoTo(evt);
      }

      listAsDragImage(this.getSelectedData(), evt, -10, 2);
    });
  }
}
