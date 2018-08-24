import VivideMultiSelectionWidget from 'src/client/vivide/components/vivide-multi-selection-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage, textualRepresentation } from 'utils';

export default class VivideListWidget extends VivideMultiSelectionWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  getObjectForSelectedNode(listItem) {
    return this.dataByListItem.get(listItem);
  }

  get list() { return this.get('#list'); }

  async initialize() {
    this.windowTitle = "VivideListWidget";
  }

  display(forest, config) {
    super.display(forest, config);

    this.dataByListItem = new Map();
    
    this.list.innerHTML = '';
    forest.forEach(m => {
      let label = m.properties.get('label') || textualRepresentation(m.data);
      
      let listItem = <li>{label}</li>;
      this.multiSelection.addItem(listItem);
      
      this.addDragEventTo(listItem);
      this.dataByListItem.set(listItem, m.object);
      this.list.appendChild(listItem);
    });
  }
  
  livelyExample() {
    this.display('abcdefghi'.split(''), {});
  }
}