"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class AexprTable extends Morph {
  async initialize() {
    this.windowTitle = "AexprTable";
  }
  
  get value() {
    return this._value
  }

  set value(v) {
    this._value = v
    this.update()
  }

  
  update() {
    var ul = this.get("#list")
  
    for(let ea of this.value) {
      ul.appendChild(<li>Item: {ea}</li>)
    }
  }
  
  livelyMigrate(other) {
    this.value = other.value
  }
  
  async livelyExample() {
  
    this.value = [1,2,3,4]
    
  }
  
  
}