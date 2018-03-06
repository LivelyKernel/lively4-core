import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideListWidget extends Morph {
  get list() { return this.get('#list'); }
  
  async initialize() {
    this.windowTitle = "VivideListWidget";
    
    this.display(["a", "b", "c"], {})
  }
  
  display(data, config) {
    this.list.innerHTML = '';
    data.forEach(d => {
      this.list.appendChild(<li>{d}</li>);
    });
  }
  
  livelyExample() {
  }
  
  livelyMigrate(other) {
  }
}