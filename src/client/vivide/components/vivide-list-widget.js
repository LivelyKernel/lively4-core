import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';

export default class VivideListWidget extends Morph {
  get list() { return this.get('#list'); }
  get multiSelection() {
    return this._multiSelection = this._multiSelection ||
      new MultiSelection(this);
  }
  async initialize() {
    this.windowTitle = "VivideListWidget";
    
    this.display('abcdefghi'.split(''), {});
  }
  
  focus() {
    this.multiSelection.focus();
  }
  
  display(data, config) {
    this.list.innerHTML = '';
    data.forEach(d => {
      let listItem = <li>{d}</li>;
      this.multiSelection.addItem(listItem);
      
      this.list.appendChild(listItem);
    });
  }
  
  livelyExample() {
  }
  
  livelyMigrate(other) {
  }
}