import VivideMultiSelectionWidget from 'src/client/vivide/components/vivide-multi-selection-widget.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage } from 'utils';

export default class VivideListWidget extends VivideMultiSelectionWidget {
  get multiSelectionConfig() {
    return [this, {
      onSelectionChanged: selection => this.selectionChanged(selection)
    }];
  }
  
  get list() { return this.get('#list'); }

  async initialize() {
    this.windowTitle = "VivideListWidget";
  }

  dataForDOMNode(listItem) {
    return this.dataByListItem.get(listItem);
  }

  display(data, config) {
    super.display(data, config);

    this.dataByListItem = new Map();
    
    this.list.innerHTML = '';
    data.forEach(d => {
      let listItem = <li>{d}</li>;
      this.multiSelection.addItem(listItem);
      
      this.addDragEventTo(listItem);
      this.dataByListItem.set(listItem, d);
      this.list.appendChild(listItem);
    });
  }
  
  livelyExample() {
    this.display('abcdefghi'.split(''), {});
  }
}