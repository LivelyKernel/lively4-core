import VivideWidget from 'src/client/vivide/components/vivide-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage } from 'utils';

export default class VivideMultiSelectionWidget extends VivideWidget {
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(...this.multiSelectionConfig);
  }

  focus() {
    this.multiSelection.focus();
  }
  
  selectionChanged(selection) {
    let viewParent = this.getViewParent();
    if(viewParent) {
      viewParent.selectionChanged();
    }
  }
  
  getSelectedData() {
    return this.multiSelection.getSelectedItems()
      .map(selectedNode => this.dataForDOMNode(selectedNode));
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
